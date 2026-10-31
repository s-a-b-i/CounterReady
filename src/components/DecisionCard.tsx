"use client";

import { motion, useReducedMotion } from "framer-motion";
import { forwardRef } from "react";
import { Wordmark } from "@/components/Wordmark";
import { Label } from "@/components/ui";

export type Verdict = "buy" | "maybe" | "skip";

export interface CardItem {
  name: string;
  brand: string;
  priceCents: number;
  dropLengthCm: number;
  weightG: number;
  fastening: string;
  returnLine: string;
  imageUrl: string;
  isPreview: boolean;
  verdict: Verdict;
  reason: string;
}

const STAMP: Record<Verdict, { label: string; bg: string; fg: string }> = {
  buy: { label: "BUY", bg: "var(--sage)", fg: "var(--bg)" },
  maybe: { label: "MAYBE", bg: "var(--gold)", fg: "#16130f" },
  skip: { label: "SKIP", bg: "var(--oxblood)", fg: "var(--bg)" },
};

/** A verdict that presses onto the card like a wax seal. */
export function VerdictStamp({ verdict, delay = 0 }: { verdict: Verdict; delay?: number }) {
  const reduce = useReducedMotion();
  const s = STAMP[verdict];
  return (
    <motion.div
      role="img"
      aria-label={`Verdict: ${s.label}`}
      initial={reduce ? false : { scale: 1.9, rotate: -24, opacity: 0 }}
      animate={{ scale: 1, rotate: -8, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 14, delay }}
      className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold tracking-widest shadow-[inset_0_0_0_3px_rgb(255_255_255/0.25),0_4px_10px_rgb(0_0_0/0.25)]"
      style={{ background: s.bg, color: s.fg, borderRadius: "46% 54% 50% 50% / 52% 48% 52% 48%" }}
    >
      {s.label}
    </motion.div>
  );
}

const usd = (c: number) => `$${(c / 100).toFixed(2)}`;

export const DecisionCard = forwardRef<HTMLDivElement, { items: CardItem[]; footnote?: string }>(function DecisionCard({ items, footnote }, ref) {
  const total = items.filter((i) => i.verdict === "buy").reduce((a, i) => a + i.priceCents, 0);
  return (
    <div ref={ref} className="print-card card mx-auto w-full max-w-3xl overflow-hidden p-6 sm:p-10" style={{ background: "var(--bg-raised)" }}>
      <div className="flex items-center justify-between">
        <Wordmark />
        <span className="eyebrow">Decision card</span>
      </div>
      <h2 className="display h-xl mt-6">Looks right. Here&apos;s whether it is.</h2>
      <ul className="mt-8 divide-y divide-hair">
        {items.map((it, i) => (
          <li key={it.name} className="grid grid-cols-[96px_1fr_auto] items-center gap-4 py-5 sm:grid-cols-[132px_1fr_auto] sm:gap-6">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-sunk">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.imageUrl} alt={it.isPreview ? `AI preview of ${it.name}` : `Catalogue photo of ${it.name}`} className={`h-full w-full ${it.isPreview ? "object-cover" : "object-contain p-3"}`} crossOrigin="anonymous" />
              <Label kind={it.isPreview ? "AI preview" : "Catalogue photo"} className="absolute left-1.5 top-1.5 !px-1.5 !py-0.5 !text-[0.55rem]" />
            </div>
            <div className="min-w-0">
              <p className="display text-xl leading-tight sm:text-2xl">{it.name}</p>
              <p className="text-sm text-soft">{it.brand} · <span className="num">{usd(it.priceCents)}</span></p>
              <p className="num mt-2 text-xs text-soft">{it.dropLengthCm} cm drop · {it.weightG} g · {it.fastening}</p>
              <p className="text-xs text-soft">{it.returnLine}</p>
              {it.reason && <p className="mt-2 text-sm italic">&ldquo;{it.reason}&rdquo;</p>}
            </div>
            <VerdictStamp verdict={it.verdict} delay={0.25 + i * 0.2} />
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-baseline justify-between border-t border-ink pt-5">
        <span className="eyebrow">Total if you buy</span>
        <span className="num text-3xl">{usd(total)}</span>
      </div>
      <p className="mt-5 text-[0.7rem] leading-relaxed text-soft">
        {footnote ?? "Previews are AI-generated approximations (YouCam Earring API), not measurements. Specs and return terms are the seller's catalogue data. Verdicts are the shopper's own."}
      </p>
    </div>
  );
});
