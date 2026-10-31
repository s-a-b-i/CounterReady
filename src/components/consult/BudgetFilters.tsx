"use client";

import { ArrowRight, Info } from "lucide-react";
import { BUDGET_MAX, BUDGET_MIN, BUDGET_STEP, explainNoMatches, familiesIn, formatPkr, matchProducts } from "@/lib/catalogue";
import { CATEGORIES, CATEGORY_LABEL, FINISHES_BY_CATEGORY, type Category, type Preferences } from "@/lib/consultation-types";

interface Props {
  prefs: Preferences;
  onChange: (p: Preferences) => void;
  onContinue: () => void;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Step 1: only three questions. Matching products update immediately; an empty result says which filter caused it. */
export function BudgetFilters({ prefs, onChange, onContinue }: Props) {
  const matches = matchProducts(prefs);
  const reasons = explainNoMatches(prefs);
  const available = matches.filter((m) => m.inStock).length;
  const finishes = FINISHES_BY_CATEGORY[prefs.category];
  const families = familiesIn(prefs.category);
  const noun = CATEGORY_LABEL[prefs.category].toLowerCase();

  /** Switching category resets finish and colour, because their options differ per product type. */
  const pickCategory = (category: Category) => category !== prefs.category && onChange({ ...prefs, category, finish: "any", family: "any" });

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
      <div className="space-y-8">
        <div>
          <h2 className="display h-lg">What are you shopping for?</h2>
          <p className="mt-2 text-soft">Pick a product type, then set a budget. Products above it won&apos;t be shown.</p>
        </div>

        <fieldset>
          <legend className="field-label">Product type</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={prefs.category === c} onClick={() => pickCategory(c)}>{CATEGORY_LABEL[c]}</button>
            ))}
          </div>
        </fieldset>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="budget" className="field-label !mb-0">Maximum budget</label>
            <output htmlFor="budget" className="display num text-3xl">{formatPkr(prefs.budget)}</output>
          </div>
          <input
            id="budget"
            type="range"
            min={BUDGET_MIN}
            max={BUDGET_MAX}
            step={BUDGET_STEP}
            value={prefs.budget}
            onChange={(e) => onChange({ ...prefs, budget: Number(e.target.value) })}
            className="mt-4 h-2 w-full cursor-pointer accent-black"
            aria-valuetext={formatPkr(prefs.budget)}
          />
          <div className="mt-1 flex justify-between text-xs text-soft"><span>{formatPkr(BUDGET_MIN)}</span><span>{formatPkr(BUDGET_MAX)}</span></div>
        </div>

        <fieldset>
          <legend className="field-label">Preferred finish</legend>
          <div className="flex flex-wrap gap-2">
            {(["any", ...finishes] as const).map((f) => (
              <button key={f} type="button" className="chip" aria-pressed={prefs.finish === f} onClick={() => onChange({ ...prefs, finish: f })}>
                {f === "any" ? "Any finish" : cap(f)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="field-label">Colour family <span className="font-normal text-soft">(optional)</span></legend>
          <div className="flex flex-wrap gap-2">
            {(["any", ...families] as const).map((f) => (
              <button key={f} type="button" className="chip" aria-pressed={prefs.family === f} onClick={() => onChange({ ...prefs, family: f })}>
                {f === "any" ? "Any colour" : cap(f)}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="h-md font-semibold" aria-live="polite">
            {matches.length ? `${matches.length} ${noun} shade${matches.length === 1 ? "" : "s"} match` : `No ${noun} shades match`}
          </h3>
          {matches.length > 0 && <span className="tag">{available} in stock</span>}
        </div>

        {matches.length === 0 ? (
          <div role="status" className="mt-4 rounded-2xl border border-warn/30 bg-warn-bg p-5">
            <p className="flex items-center gap-2 font-semibold text-warn"><Info size={18} aria-hidden /> Nothing fits these filters</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
              {reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
            <p className="mt-3 text-xs text-soft">We won&apos;t quietly show over-budget products. Change a filter to continue.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-hair overflow-hidden rounded-2xl border border-hair">
            {matches.map((p) => (
              <li key={p.id} className="flex items-center gap-4 p-4">
                <span aria-hidden className="h-9 w-9 shrink-0 rounded-full border border-black/10" style={{ background: p.previewHex }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-sm text-soft">{p.shadeCode} · {cap(p.finish)} · {cap(p.colourFamily)}</p>
                </div>
                <div className="text-right">
                  <p className="num font-semibold">{formatPkr(p.price)}</p>
                  <p className={`text-xs ${p.inStock ? "text-ok" : "text-bad"}`}>{p.inStock ? "In stock" : "Out of stock"}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-xs text-soft">Sample catalogue: twenty made-up products, maintained by hand. Not linked to real stock.</p>
        <button type="button" className="btn btn-lg mt-6 w-full sm:w-auto" disabled={available === 0} onClick={onContinue}>
          Choose from these <ArrowRight size={16} aria-hidden />
        </button>
        {matches.length > 0 && available === 0 && <p className="field-error">Every matching shade is out of stock. Change a filter.</p>}
      </div>
    </div>
  );
}
