"use client";

import { matchesBrief } from "@/lib/fit";
import { useStudio } from "./store";

const FASTENINGS = ["any", "post", "hook", "screw-back", "clip-on"] as const;
const MATERIALS = ["any", "gold", "silver", "titanium", "brass"] as const;
const OCCASIONS = ["any", "everyday", "office", "evening", "wedding", "statement"] as const;

function Chips<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={value === o} className="chip capitalize" onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Used both as step 1 and inside the mobile bottom sheet on the catalogue. */
export function BriefForm() {
  const { brief, setBrief, products } = useStudio();
  const count = products.filter((p) => matchesBrief(p, brief)).length;
  return (
    <div className="space-y-9">
      <div>
        <label htmlFor="budget" className="eyebrow">Budget per pair</label>
        <div className="mt-3 flex items-center gap-4">
          <input id="budget" type="range" min={20} max={200} step={5} value={brief.budget ?? 100}
            onChange={(e) => setBrief({ budget: Number(e.target.value) })} className="h-2 w-full accent-[var(--gold-text)]" />
          <output htmlFor="budget" className="num w-20 text-right text-xl">${brief.budget}</output>
        </div>
      </div>
      <div>
        <label htmlFor="drop" className="eyebrow">Longest drop you&apos;d wear</label>
        <div className="mt-3 flex items-center gap-4">
          <input id="drop" type="range" min={1} max={10} step={0.5} value={brief.maxDropCm ?? 6}
            onChange={(e) => setBrief({ maxDropCm: Number(e.target.value) })} className="h-2 w-full accent-[var(--gold-text)]" />
          <output htmlFor="drop" className="num w-20 text-right text-xl">{brief.maxDropCm} cm</output>
        </div>
      </div>
      <Chips label="Fastening" value={brief.fastening ?? "any"} options={FASTENINGS} onChange={(v) => setBrief({ fastening: v })} />
      <Chips label="Material" value={(brief.material ?? "any") as (typeof MATERIALS)[number]} options={MATERIALS} onChange={(v) => setBrief({ material: v })} />
      <Chips label="Occasion" value={(brief.occasion ?? "any") as (typeof OCCASIONS)[number]} options={OCCASIONS} onChange={(v) => setBrief({ occasion: v })} />
      <p className="text-sm text-soft" aria-live="polite">
        <span className="num text-ink">{count}</span> of {products.length} pieces match your brief right now.
      </p>
    </div>
  );
}

export function BriefStep() {
  const { setStep, products, brief } = useStudio();
  const none = products.filter((p) => matchesBrief(p, brief)).length === 0;
  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">Step 1 of 6</p>
      <h1 className="display h-xl mt-3">What does &ldquo;right for me&rdquo; mean?</h1>
      <p className="mt-4 text-soft">Set your limits once. Everything after is measured against them. You can change them any time.</p>
      <div className="card mt-10 p-6 sm:p-9"><BriefForm /></div>
      {none && <p className="mt-4 text-sm text-oxblood">Nothing matches all of that, but you can still browse everything on the next screen.</p>}
      <div className="mt-8 flex justify-end">
        <button className="btn !min-h-14 !px-8" onClick={() => setStep("pieces")}>See the pieces</button>
      </div>
    </div>
  );
}
