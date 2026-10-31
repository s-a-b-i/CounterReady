import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { Studio } from "@/components/studio/Studio";
import { db, tables } from "@/lib/db";
import { env } from "@/lib/env";
import { unitsUsed } from "@/lib/ledger";
import { listProducts } from "@/lib/products";
import { readSessionId } from "@/lib/session";

export const metadata: Metadata = { title: "Studio" };
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const e = env();
  const sessionId = await readSessionId();
  const products = await listProducts();
  let used = 0;
  if (sessionId) {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(tables.tryons)
      .where(sql`${tables.tryons.sessionId} = ${sessionId} and ${tables.tryons.unitsSpent} > 0`);
    used = n;
  }
  const exhausted = (await unitsUsed()) >= e.MAX_UNITS_TOTAL;
  return <Studio products={products} initial={{ tryonsUsed: used, tryonsAllowed: e.MAX_TRYONS_PER_SESSION, exhausted }} />;
}
