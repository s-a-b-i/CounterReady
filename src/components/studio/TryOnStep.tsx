"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RefreshCcw, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui";
import type { Product } from "@/lib/products";
import { useStudio } from "./store";

const MICROCOPY = [
  "Finding your ear…",
  "Measuring against the declared drop length…",
  "Matching light and shadow…",
  "Placing the earring…",
  "Nearly there. Good jewellery takes a moment.",
];

function Waiting() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % MICROCOPY.length), 2600); return () => clearInterval(t); }, []);
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
      <div className="shimmer absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <AnimatePresence mode="wait">
          <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="rounded-xl bg-bg/85 px-4 py-3 text-sm backdrop-blur">
            {MICROCOPY[i]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

function BlurUp({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-sunk">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} onLoad={() => setLoaded(true)} className={`h-full w-full object-cover transition-all duration-700 ${loaded ? "blur-0 scale-100" : "scale-105 blur-xl"}`} />
      <Label kind="AI preview" className="absolute left-3 top-3" />
    </div>
  );
}

function Tile({ p }: { p: Product }) {
  const { results, generate, resume, session, selfie } = useStudio();
  const r = results[p.id] ?? { status: "idle" as const };
  const blocked = session.exhausted || session.tryonsUsed >= session.tryonsAllowed;
  return (
    <div className="card p-4">
      <div aria-live="polite" aria-busy={r.status === "running"}>
        {r.status === "running" && <Waiting />}
        {r.status === "success" && r.imageUrl && <BlurUp src={r.imageUrl} alt={`AI preview of ${p.name} on your ear`} />}
        {(r.status === "idle" || r.status === "error" || r.status === "timeout") && (
          <div className="relative grid aspect-[3/4] place-items-center rounded-2xl bg-sunk">
            <Image src={p.imageUrl} alt="" width={200} height={200} unoptimized className="opacity-80" />
            <Label kind="Catalogue photo" className="absolute left-3 top-3" />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between"><h3 className="display text-xl">{p.name}</h3><span className="num text-sm text-soft">{p.dropLengthCm} cm</span></div>
      {r.status === "success" && <p className="mt-1 text-sm text-sage">{r.cached ? "Reused a matching preview. No credit used." : "Preview ready."}</p>}
      {(r.status === "error" || r.status === "timeout") && <p role="alert" className="mt-2 text-sm text-oxblood">{r.error}</p>}
      <div className="mt-4">
        {r.status === "idle" && (
          <button className="btn w-full" disabled={!selfie || blocked} onClick={() => void generate(p.id)}>
            <Sparkles size={16} aria-hidden /> Generate preview
          </button>
        )}
        {r.status === "error" && (
          <button className="btn btn-ghost w-full" disabled={blocked} onClick={() => void generate(p.id)}><RefreshCcw size={16} aria-hidden /> Try again</button>
        )}
        {r.status === "timeout" && (
          <button className="btn btn-ghost w-full" onClick={() => resume(p.id)}><RefreshCcw size={16} aria-hidden /> Check again</button>
        )}
        {r.status === "running" && <button className="btn btn-ghost w-full" disabled>Generating…</button>}
      </div>
    </div>
  );
}

export function TryOnStep() {
  const { products, shortlist, results, session, selfie, setStep, online } = useStudio();
  const picked = products.filter((p) => shortlist.includes(p.id));
  const done = picked.filter((p) => results[p.id]?.status === "success").length;
  const left = Math.max(0, session.tryonsAllowed - session.tryonsUsed);
  const blocked = session.exhausted || left === 0;

  return (
    <div>
      <p className="eyebrow">Step 4 of 6</p>
      <h1 className="display h-xl mt-3">One at a time. You press go.</h1>
      <p className="mt-3 max-w-2xl text-soft">
        Each preview is made by the YouCam Earring API and costs one demo credit. You have <span className="num text-ink">{left}</span> of {session.tryonsAllowed} left in this session.
      </p>
      {!online && <p role="alert" className="mt-4 rounded-xl bg-oxbloodbg p-3 text-sm text-oxblood">You&apos;re offline. Previews already made are kept; reconnect to generate more.</p>}
      {!selfie && <p className="mt-4 rounded-xl bg-maybebg p-3 text-sm">Your photo isn&apos;t in this tab any more (photos are never saved). <button className="underline" onClick={() => setStep("photo")}>Add it again</button> to generate more previews.</p>}
      {blocked && done === 0 && (
        <div className="card mt-8 p-6">
          <h2 className="display h-lg">Demo credit limit reached</h2>
          <p className="mt-2 text-soft">Live generation is paused for this demo. You can still browse the catalogue, and the pre-generated example on the home page shows exactly what a result looks like.</p>
        </div>
      )}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {picked.map((p) => <Tile key={p.id} p={p} />)}
      </div>
      <div className="mt-10 flex justify-between">
        <button className="btn btn-ghost" onClick={() => setStep("photo")}>Back</button>
        <button className="btn" disabled={done === 0} onClick={() => setStep("compare")}>Compare {done || ""} {done === 1 ? "preview" : "previews"}</button>
      </div>
    </div>
  );
}
