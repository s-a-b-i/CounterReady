import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { env } from "@/lib/env";
import { unitsUsed } from "@/lib/ledger";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function Admin({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const e = env();
  if (!e.ADMIN_TOKEN || token !== e.ADMIN_TOKEN) notFound();
  const used = await unitsUsed();
  const [{ sessions }] = await db.select({ sessions: sql<number>`count(*)::int` }).from(tables.sessions);
  const [{ tryons }] = await db.select({ tryons: sql<number>`count(*)::int` }).from(tables.tryons);
  const [{ cached }] = await db.select({ cached: sql<number>`count(*) filter (where ${tables.tryons.unitsSpent} = 0 and ${tables.tryons.status} = 'success')::int` }).from(tables.tryons);
  const rows = [
    ["Units used", used], ["Units remaining", Math.max(0, e.MAX_UNITS_TOTAL - used)], ["Cap", e.MAX_UNITS_TOTAL],
    ["Per-session cap", e.MAX_TRYONS_PER_SESSION], ["Sessions", sessions], ["Try-ons", tryons], ["Served from cache", cached],
    ["Mode", e.YOUCAM_MOCK === "1" ? "MOCK" : "LIVE"],
  ];
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="display h-xl">Usage</h1>
      <dl className="card mt-8 divide-y divide-hair">
        {rows.map(([k, v]) => <div key={String(k)} className="flex justify-between p-4"><dt className="text-soft">{k}</dt><dd className="num">{v}</dd></div>)}
      </dl>
    </div>
  );
}
