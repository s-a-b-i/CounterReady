import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { DecisionCard, type CardItem } from "@/components/DecisionCard";
import { db, tables } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Decision card", robots: { index: false } };

export default async function SharedCard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[\w-]{4,32}$/.test(slug)) notFound();
  const rows = await db
    .select({ d: tables.decisions, p: tables.products, t: tables.tryons })
    .from(tables.decisions)
    .innerJoin(tables.products, eq(tables.decisions.productId, tables.products.id))
    .leftJoin(tables.tryons, eq(tables.decisions.tryonId, tables.tryons.id))
    .where(eq(tables.decisions.shareSlug, slug))
    .orderBy(asc(tables.decisions.createdAt));
  if (rows.length === 0) notFound();

  // A try-on photo shows the shopper's face: only included when they opted in (tryonId stored).
  const items: CardItem[] = rows.map(({ d, p, t }) => {
    const preview = t?.resultImageId ? `/api/images/${t.resultImageId}` : null;
    return {
      name: p.name, brand: p.brand, priceCents: p.priceCents, dropLengthCm: p.dropLengthCm, weightG: p.weightG,
      fastening: p.fastening,
      returnLine: p.finalSale ? "Final sale, no returns" : `${p.returnWindowDays}-day returns. ${p.returnPolicy}`,
      imageUrl: preview ?? p.imageUrl, isPreview: !!preview,
      verdict: d.verdict as CardItem["verdict"], reason: d.reason,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
      <DecisionCard items={items} />
      <div className="no-print mt-10 text-center">
        <p className="text-soft">Someone made this decision with SmallPrint.</p>
        <Link href="/studio" className="btn mt-4">Make your own</Link>
      </div>
    </div>
  );
}
