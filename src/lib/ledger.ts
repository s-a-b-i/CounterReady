import { eq, sql } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { env } from "@/lib/env";
import { evaluateBudget, type BudgetDecision } from "@/lib/budget";

const LOCK_KEY = 8_675_309;
/** AI Makeup VTO V1.0 costs 1 unit per task (YouCam's published unit table). */
export const UNITS_PER_PREVIEW = 1;

export interface Reservation {
  decision: BudgetDecision;
  previewId?: string;
}

/**
 * Atomically checks the global and per-session caps from usage_ledger and, if allowed,
 * inserts the preview row plus its ledger debit. The advisory lock serialises concurrent callers
 * so two requests can never both squeeze under the cap. Mock mode writes 0-unit rows.
 */
export async function reserveUnits(args: { sessionId: string; productId: string; inputHash: string }): Promise<Reservation> {
  const e = env();
  const mock = e.YOUCAM_MOCK === "1";
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${LOCK_KEY})`);
    const [{ total }] = await tx
      .select({ total: sql<number>`coalesce(sum(${tables.usageLedger.units}), 0)::int` })
      .from(tables.usageLedger);
    const [{ n }] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(tables.previews)
      .where(sql`${tables.previews.sessionId} = ${args.sessionId} and ${tables.previews.unitsSpent} > 0`);
    const decision = evaluateBudget({
      totalUnitsUsed: total,
      sessionPreviews: n,
      cost: UNITS_PER_PREVIEW,
      maxUnitsTotal: e.MAX_UNITS_TOTAL,
      maxPreviewsPerSession: e.MAX_PREVIEWS_PER_SESSION,
    });
    if (!decision.ok) return { decision };
    const [row] = await tx
      .insert(tables.previews)
      .values({ sessionId: args.sessionId, productId: args.productId, inputHash: args.inputHash, status: "queued", unitsSpent: UNITS_PER_PREVIEW })
      .returning({ id: tables.previews.id });
    await tx.insert(tables.usageLedger).values({
      sessionId: args.sessionId,
      units: mock ? 0 : UNITS_PER_PREVIEW,
      kind: mock ? "mock_preview" : "makeup_vto",
    });
    return { decision, previewId: row.id };
  });
}

/** Gives units back when the provider task was never created (nothing was charged upstream). */
export async function refundUnits(previewId: string, sessionId: string, error: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(tables.previews).where(eq(tables.previews.id, previewId));
    if (!row || row.unitsSpent === 0) return; // idempotent: never refund twice
    await tx.update(tables.previews).set({ status: "error", unitsSpent: 0, error }).where(eq(tables.previews.id, previewId));
    await tx.insert(tables.usageLedger).values({ sessionId, units: env().YOUCAM_MOCK === "1" ? 0 : -row.unitsSpent, kind: "refund" });
  });
}

export async function unitsUsed(): Promise<number> {
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${tables.usageLedger.units}), 0)::int` })
    .from(tables.usageLedger);
  return total;
}
