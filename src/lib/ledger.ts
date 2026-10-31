import { eq, sql } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { env } from "@/lib/env";
import { evaluateBudget, type BudgetDecision } from "@/lib/budget";

const LOCK_KEY = 8_675_309;
export const UNITS_PER_TRYON = 1;

export interface Reservation {
  decision: BudgetDecision;
  tryonId?: string;
}

/**
 * Atomically checks the global and per-session caps from usage_ledger and, if allowed,
 * inserts the tryon row plus its ledger debit. The advisory lock serialises concurrent callers
 * so two requests can never both squeeze under the cap.
 */
export async function reserveUnits(args: {
  sessionId: string;
  productId: string;
  inputHash: string;
  params: Record<string, unknown>;
}): Promise<Reservation> {
  const e = env();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${LOCK_KEY})`);
    const [{ total }] = await tx
      .select({ total: sql<number>`coalesce(sum(${tables.usageLedger.units}), 0)::int` })
      .from(tables.usageLedger);
    const [{ n }] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(tables.tryons)
      .where(sql`${tables.tryons.sessionId} = ${args.sessionId} and ${tables.tryons.unitsSpent} > 0`);
    const decision = evaluateBudget({
      totalUnitsUsed: total,
      sessionTryons: n,
      cost: UNITS_PER_TRYON,
      maxUnitsTotal: e.MAX_UNITS_TOTAL,
      maxTryonsPerSession: e.MAX_TRYONS_PER_SESSION,
    });
    if (!decision.ok) return { decision };
    const [row] = await tx
      .insert(tables.tryons)
      .values({
        sessionId: args.sessionId,
        productId: args.productId,
        inputHash: args.inputHash,
        params: args.params,
        status: "queued",
        unitsSpent: UNITS_PER_TRYON,
      })
      .returning({ id: tables.tryons.id });
    await tx.insert(tables.usageLedger).values({ sessionId: args.sessionId, units: UNITS_PER_TRYON, kind: "earring_tryon" });
    return { decision, tryonId: row.id };
  });
}

/** Gives units back when the provider task was never created (nothing was charged upstream). */
export async function refundUnits(tryonId: string, sessionId: string, error: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(tables.tryons).where(eq(tables.tryons.id, tryonId));
    if (!row || row.unitsSpent === 0) return; // idempotent: never refund twice
    await tx.update(tables.tryons).set({ status: "error", unitsSpent: 0, error }).where(eq(tables.tryons.id, tryonId));
    await tx.insert(tables.usageLedger).values({ sessionId, units: -row.unitsSpent, kind: "refund" });
  });
}

export async function unitsUsed(): Promise<number> {
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${tables.usageLedger.units}), 0)::int` })
    .from(tables.usageLedger);
  return total;
}
