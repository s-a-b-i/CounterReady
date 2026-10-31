"use client";

import { Check, Minus, X } from "lucide-react";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Label, Source, WeightMeter } from "@/components/ui";
import { fitToBrief, rowWinners, type CompareRow } from "@/lib/fit";
import type { Product } from "@/lib/products";
import { useStudio, type VerdictKind } from "./store";

const REASONS: Record<VerdictKind, string[]> = {
  buy: ["love the length", "right price", "easy returns", "sits well on my ear"],
  maybe: ["need to think", "wish it were lighter", "good but pricey"],
  skip: ["too heavy", "too long", "returns too strict", "not my style", "over budget"],
};

const usd = (c: number) => `$${(c / 100).toFixed(0)}`;

const ROWS: { key: CompareRow; label: string; cell: (p: Product) => string }[] = [
  { key: "price", label: "Price", cell: (p) => usd(p.priceCents) },
  { key: "drop", label: "Drop length", cell: (p) => `${p.dropLengthCm} cm` },
  { key: "weight", label: "Weight", cell: (p) => `${p.weightG} g` },
  { key: "fastening", label: "Fastening", cell: (p) => p.fastening },
  { key: "material", label: "Material", cell: (p) => p.material },
  { key: "returns", label: "Returns", cell: (p) => (p.finalSale ? "Final sale" : `${p.returnWindowDays} days`) },
];

function Decide({ p }: { p: Product }) {
  const { verdicts, setVerdict } = useStudio();
  const v = verdicts[p.id];
  return (
    <div className="mt-5">
      <div className="flex gap-2" role="radiogroup" aria-label={`Verdict for ${p.name}`}>
        {(["buy", "maybe", "skip"] as VerdictKind[]).map((k) => (
          <button key={k} role="radio" aria-checked={v?.verdict === k} onClick={() => setVerdict(p.id, { verdict: k, reasons: [] })} className="chip flex-1 justify-center font-semibold capitalize">{k}</button>
        ))}
      </div>
      {v && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Reasons">
          {REASONS[v.verdict].map((r) => {
            const on = v.reasons.includes(r);
            return (
              <button key={r} aria-pressed={on} className="chip !min-h-9 !text-xs"
                onClick={() => setVerdict(p.id, { ...v, reasons: on ? v.reasons.filter((x) => x !== r) : [...v.reasons, r] })}>{r}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ICON = { met: Check, partial: Minus, miss: X, "n/a": Minus } as const;
const TONE = { met: "text-sage", partial: "text-goldtext", miss: "text-oxblood", "n/a": "text-soft" } as const;

export function CompareStep() {
  const { products, shortlist, results, selfieUrl, brief, verdicts, setStep } = useStudio();
  const picked = products.filter((p) => shortlist.includes(p.id) && results[p.id]?.status === "success");
  const decided = picked.filter((p) => verdicts[p.id]).length;
  return (
    <div>
      <p className="eyebrow">Step 5 of 6</p>
      <h1 className="display h-xl mt-3">Looks vs. facts.</h1>
      <p className="mt-3 max-w-2xl text-soft">
        Swipe or scroll across. Green-highlighted cells win that row <em>against your brief</em>. Then give each piece a verdict.
        {selfieUrl ? " The slider compares with your original photo, which only exists in this tab." : ""}
      </p>

      <div className="-mx-4 mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0" style={{ gridTemplateColumns: `repeat(${Math.max(picked.length, 1)}, minmax(0,1fr))` }}>
        {picked.map((p) => {
          const r = results[p.id];
          const fit = fitToBrief(p, brief);
          return (
            <article key={p.id} className="card w-[85vw] max-w-sm shrink-0 snap-center p-4 lg:w-auto lg:max-w-none">
              {selfieUrl && r.imageUrl ? (
                <BeforeAfter before={selfieUrl} after={r.imageUrl} afterLabel="AI preview" beforeAlt="Your original photo" afterAlt={`AI preview of ${p.name}`} />
              ) : (
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-sunk">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.imageUrl} alt={`AI preview of ${p.name}`} className="h-full w-full object-cover" />
                  <Label kind="AI preview" className="absolute right-3 top-3" />
                </div>
              )}
              <div className="mt-4 flex items-baseline justify-between"><h2 className="display text-2xl">{p.name}</h2><span className="num">{usd(p.priceCents)}</span></div>
              <p className="text-sm text-soft">{p.brand}</p>
              <div className="mt-4"><WeightMeter grams={p.weightG} /></div>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm font-semibold">Fit to your brief <span className="num">{fit.met}/{fit.applicable}</span></p>
                <Source kind="smallprint" />
              </div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {fit.criteria.map((c) => {
                  const I = ICON[c.status];
                  return <li key={c.key} className={`flex items-start gap-2 ${TONE[c.status]}`}><I size={15} className="mt-1 shrink-0" aria-hidden /><span><span className="sr-only">{c.status}: </span><span className="text-ink">{c.label}.</span> <span className="text-soft">{c.note}</span></span></li>;
                })}
              </ul>
              <Decide p={p} />
            </article>
          );
        })}
      </div>

      {picked.length > 1 && (
        <div className="card mt-10 overflow-x-auto p-2 sm:p-4">
          <table className="w-full min-w-[520px] text-left text-sm">
            <caption className="sr-only">Spec comparison. Highlighted cells win the row against your brief.</caption>
            <thead><tr><th className="p-3"><Source kind="catalogue" /></th>{picked.map((p) => <th key={p.id} scope="col" className="p-3 font-semibold">{p.name}</th>)}</tr></thead>
            <tbody>
              {ROWS.map((row) => {
                const win = rowWinners(row.key, picked, brief);
                return (
                  <tr key={row.key} className="border-t border-hair">
                    <th scope="row" className="p-3 font-normal text-soft">{row.label}</th>
                    {picked.map((p) => (
                      <td key={p.id} className={`p-3 num ${win.has(p.id) ? "bg-sagebg font-semibold text-sage" : ""}`}>
                        {row.cell(p)}{win.has(p.id) && <span className="sr-only"> (best for your brief)</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10 flex justify-between">
        <button className="btn btn-ghost" onClick={() => setStep("tryon")}>Back</button>
        <button className="btn" disabled={decided === 0} onClick={() => setStep("card")}>Make my decision card</button>
      </div>
    </div>
  );
}

