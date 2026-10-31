"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { CATALOGUE, matchProducts } from "@/lib/catalogue";
import { MAX_SHORTLIST, type Preferences } from "@/lib/consultation-types";
import { ProductCard } from "./ProductCard";

interface Props {
  prefs: Preferences;
  shortlist: string[];
  onToggle: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

/** Step 2: the matching shades. Out-of-stock items stay visible (so nothing disappears silently) but can't be picked. */
export function ProductGrid({ prefs, shortlist, onToggle, onBack, onContinue }: Props) {
  const matches = matchProducts(prefs);
  const hidden = CATALOGUE.filter((p) => p.category === prefs.category).length - matches.length;
  const full = shortlist.length >= MAX_SHORTLIST;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="display h-lg">Pick up to three</h2>
          <p className="mt-2 text-soft">You&apos;ll try them on the same photo, side by side.</p>
        </div>
        <p className="tag num" aria-live="polite">{shortlist.length} of {MAX_SHORTLIST} selected</p>
      </div>

      <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm text-soft">
        Sample catalogue data: these are made-up products entered by hand, not a live retailer feed.
        {hidden > 0 && <> {hidden} product{hidden === 1 ? " is" : "s are"} hidden by your budget, finish or colour choice.</>}
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-5 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {matches.map((p) => (
          <ProductCard key={p.id} product={p} selected={shortlist.includes(p.id)} full={full} onToggle={() => onToggle(p.id)} />
        ))}
      </ul>

      <div className="sticky bottom-0 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-hair bg-white/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <button type="button" className="btn btn-ghost" onClick={onBack}><ArrowLeft size={16} aria-hidden /> Preferences</button>
        <button type="button" className="btn btn-lg" disabled={shortlist.length === 0} onClick={onContinue}>
          Continue with {shortlist.length || "…"} <ArrowRight size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
