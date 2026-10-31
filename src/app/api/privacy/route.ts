import { eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, tables } from "@/lib/db";
import { readSessionId } from "@/lib/session";

/**
 * "Delete my data": wipes what CounterReady holds for this session (preview records, stored preview
 * images, upload references). It cannot delete anything YouCam keeps on its side; the privacy page says so.
 */
export async function DELETE() {
  const sessionId = await readSessionId();
  if (sessionId) {
    const rows = await db.select({ img: tables.previews.resultImageId }).from(tables.previews).where(eq(tables.previews.sessionId, sessionId));
    const imgIds = [...new Set(rows.map((r) => r.img).filter((x): x is string => !!x))];
    // Cached previews can share an image across sessions; only delete images nobody else still uses.
    const stillUsed = imgIds.length
      ? await db.select({ img: tables.previews.resultImageId, s: tables.previews.sessionId }).from(tables.previews).where(inArray(tables.previews.resultImageId, imgIds))
      : [];
    const shared = new Set(stillUsed.filter((r) => r.s !== sessionId).map((r) => r.img));
    // Deleting the session cascades its ledger rows. Record the spend on an anonymous tombstone first,
    // so "delete my data" can never hand credits back to the shared demo budget.
    const ledger = await db.select({ units: tables.usageLedger.units }).from(tables.usageLedger).where(eq(tables.usageLedger.sessionId, sessionId));
    const units = ledger.reduce((a, b) => a + b.units, 0);
    await db.delete(tables.sessions).where(eq(tables.sessions.id, sessionId));
    const free = imgIds.filter((i) => !shared.has(i));
    if (free.length) await db.delete(tables.resultImages).where(inArray(tables.resultImages.id, free));
    if (units > 0) {
      const [tomb] = await db.insert(tables.sessions).values({}).returning({ id: tables.sessions.id });
      await db.insert(tables.usageLedger).values({ sessionId: tomb.id, units, kind: "deleted_session_spend" });
    }
  }
  (await cookies()).delete("cr_session");
  return Response.json({ ok: true });
}
