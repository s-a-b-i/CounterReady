import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, tables } from "@/lib/db";
import { env } from "@/lib/env";
import { getOrCreateSession } from "@/lib/session";
import { unitsUsed } from "@/lib/ledger";

const prefs = z.object({
  budget: z.number().min(0).max(100000).optional(),
  maxDropCm: z.number().min(0).max(30).optional(),
  fastening: z.enum(["any", "post", "hook", "screw-back", "clip-on"]).optional(),
  material: z.string().max(40).optional(),
  occasion: z.string().max(40).optional(),
});

async function snapshot(sessionId: string, preferences: Record<string, unknown>) {
  const e = env();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(tables.tryons)
    .where(sql`${tables.tryons.sessionId} = ${sessionId} and ${tables.tryons.unitsSpent} > 0`);
  const used = await unitsUsed();
  return {
    preferences,
    tryonsUsed: n,
    tryonsAllowed: e.MAX_TRYONS_PER_SESSION,
    demoCreditsExhausted: used >= e.MAX_UNITS_TOTAL,
  };
}

/** Creates/reads the anonymous session. Optionally saves the shopper's brief. */
export async function POST(req: Request) {
  const session = await getOrCreateSession();
  let preferences = session.preferences;
  const text = await req.text();
  if (text) {
    const parsed = prefs.safeParse(JSON.parse(text));
    if (!parsed.success) return Response.json({ error: "Invalid preferences" }, { status: 400 });
    preferences = { ...preferences, ...parsed.data };
    await db.update(tables.sessions).set({ preferences }).where(eq(tables.sessions.id, session.id));
  }
  return Response.json(await snapshot(session.id, preferences));
}
