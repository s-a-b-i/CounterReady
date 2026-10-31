import { eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, tables } from "@/lib/db";
import { readSessionId } from "@/lib/session";

/** "Delete my data": wipes this session's try-ons, stored result images, decisions and ledger rows. */
export async function DELETE() {
  const sessionId = await readSessionId();
  if (sessionId) {
    const rows = await db.select({ img: tables.tryons.resultImageId }).from(tables.tryons).where(eq(tables.tryons.sessionId, sessionId));
    const imgIds = [...new Set(rows.map((r) => r.img).filter((x): x is string => !!x))];
    // Cached try-ons can share an image across sessions; only delete images nobody else still uses.
    const stillUsed = imgIds.length
      ? await db.select({ img: tables.tryons.resultImageId, s: tables.tryons.sessionId }).from(tables.tryons).where(inArray(tables.tryons.resultImageId, imgIds))
      : [];
    const shared = new Set(stillUsed.filter((r) => r.s !== sessionId).map((r) => r.img));
    // Ledger rows are kept (as anonymous usage accounting) by detaching nothing: deleting the session
    // cascades them, so re-credit is avoided by recording the spend on a tombstone below.
    const [{ units }] = await db
      .select({ units: tables.usageLedger.units })
      .from(tables.usageLedger)
      .where(eq(tables.usageLedger.sessionId, sessionId))
      .then((r) => [{ units: r.reduce((a, b) => a + b.units, 0) }]);
    await db.delete(tables.sessions).where(eq(tables.sessions.id, sessionId));
    const free = imgIds.filter((i) => !shared.has(i));
    if (free.length) await db.delete(tables.resultImages).where(inArray(tables.resultImages.id, free));
    if (units > 0) {
      const [tomb] = await db.insert(tables.sessions).values({ preferences: { deleted: true } }).returning({ id: tables.sessions.id });
      await db.insert(tables.usageLedger).values({ sessionId: tomb.id, units, kind: "deleted_session_spend" });
    }
  }
  (await cookies()).delete("sp_session");
  return Response.json({ ok: true });
}
