"use client";

import { Check, Plus, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";
import { fitToBrief, matchesBrief, weightFeel } from "@/lib/fit";
import type { Product } from "@/lib/products";
import { Label, Ruler, Source } from "@/components/ui";
import { BriefForm } from "./BriefStep";
import { useStudio } from "./store";

const usd = (c: number) => `$${(c / 100).toFixed(0)}`;

export function ProductCard({ p, matches }: { p: Product; matches: boolean }) {
  const { brief, shortlist, toggleShortlist } = useStudio();
  const on = shortlist.includes(p.id);
  const full = !on && shortlist.length >= 3;
  const fit = fitToBrief(p, brief);
  return (
    <motion.article layout layoutId={`card-${p.id}`} className={`card flex flex-col overflow-hidden ${matches ? "" : "opacity-70"}`}>
      <div className="relative aspect-square bg-sunk">
        <Image src={p.imageUrl} alt={`${p.name}, catalogue photo of a single earring`} fill sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 90vw" className="object-contain p-6" unoptimized />
        <Label kind="Catalogue photo" className="absolute left-3 top-3" />
        {fit.applicable > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-bg/90 px-2.5 py-1 text-[0.68rem] font-semibold border border-hair">
            Fits <span className="num">{fit.met}/{fit.applicable}</span> of your brief
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="display text-xl">{p.name}</h3>
          <span className="num text-lg">{usd(p.priceCents)}</span>
        </div>
        <p className="text-sm text-soft">{p.brand}</p>
        <div className="mt-4 flex gap-4">
          <Ruler cm={p.dropLengthCm} pxPerCm={9} />
          <dl className="grid flex-1 grid-cols-2 content-start gap-x-3 gap-y-2 text-sm">
            <div><dt className="text-[0.7rem] uppercase tracking-wider text-soft">Drop</dt><dd className="num">{p.dropLengthCm} cm</dd></div>
            <div><dt className="text-[0.7rem] uppercase tracking-wider text-soft">Weight</dt><dd className="num">{p.weightG} g <span className="font-sans text-xs text-soft">· {weightFeel(p.weightG)}</span></dd></div>
            <div><dt className="text-[0.7rem] uppercase tracking-wider text-soft">Fastening</dt><dd className="capitalize">{p.fastening}</dd></div>
            <div><dt className="text-[0.7rem] uppercase tracking-wider text-soft">Returns</dt><dd className={p.finalSale ? "font-semibold text-oxblood" : ""}>{p.finalSale ? "Final sale" : `${p.returnWindowDays} days`}</dd></div>
          </dl>
        </div>
        <div className="mt-3"><Source kind="catalogue" /></div>
        <button
          type="button"
          aria-pressed={on}
          disabled={full}
          onClick={() => toggleShortlist(p.id)}
          className={`btn mt-5 ${on ? "" : "btn-ghost"}`}
        >
          {on ? <><Check size={16} aria-hidden /> On your shortlist</> : <><Plus size={16} aria-hidden /> {full ? "Shortlist full (3)" : "Add to shortlist"}</>}
        </button>
      </div>
    </motion.article>
  );
}

export function PiecesStep() {
  const { products, brief, shortlist, setStep } = useStudio();
  const [showAll, setShowAll] = useState(false);
  const sheet = useRef<HTMLDialogElement>(null);
  const matching = products.filter((p) => matchesBrief(p, brief));
  const others = products.filter((p) => !matchesBrief(p, brief));
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Step 2 of 6</p>
          <h1 className="display h-xl mt-3">Pick up to three.</h1>
          <p className="mt-3 max-w-xl text-soft">Every card shows the real specs. The ruler is drawn to scale: 1 cm is the same length on every card.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => sheet.current?.showModal()}><SlidersHorizontal size={16} aria-hidden /> Edit brief</button>
      </div>

      {matching.length === 0 && <p className="mt-8 rounded-2xl bg-maybebg p-5 text-sm">No piece meets every part of your brief. Loosen a limit, or look at everything below.</p>}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {matching.map((p) => <ProductCard key={p.id} p={p} matches />)}
      </div>

      {others.length > 0 && (
        <div className="mt-10">
          <button className="chip" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Hide" : "Show"} {others.length} outside your brief
          </button>
          {showAll && <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{others.map((p) => <ProductCard key={p.id} p={p} matches={false} />)}</div>}
        </div>
      )}

      <div className="sticky bottom-0 z-30 -mx-4 mt-12 border-t border-hair bg-bg/90 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button className="btn btn-ghost" onClick={() => setStep("brief")}>Back</button>
          <p className="hidden text-sm text-soft sm:block" aria-live="polite"><span className="num text-ink">{shortlist.length}</span>/3 shortlisted</p>
          <button className="btn" disabled={shortlist.length === 0} onClick={() => setStep("photo")}>Continue with {shortlist.length || "…"}</button>
        </div>
      </div>

      <dialog ref={sheet} aria-label="Edit your brief" className="m-0 mt-auto w-full max-w-none rounded-t-[28px] border-t border-hair bg-bg p-6 text-ink backdrop:bg-black/40 sm:m-auto sm:max-w-lg sm:rounded-[28px]">
        <h2 className="display h-lg mb-6">Your brief</h2>
        <BriefForm />
        <button className="btn mt-8 w-full" onClick={() => sheet.current?.close()}>Done</button>
      </dialog>
    </div>
  );
}
