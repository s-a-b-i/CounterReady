"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/products";
import { BriefStep } from "./BriefStep";
import { CardStep } from "./CardStep";
import { CompareStep } from "./CompareStep";
import { PhotoStep } from "./PhotoStep";
import { PiecesStep } from "./PiecesStep";
import { TryOnStep } from "./TryOnStep";
import { STEPS, StudioProvider, useStudio, type SessionInfo } from "./store";

function Stepper() {
  const { step, setStep } = useStudio();
  const idx = STEPS.findIndex((s) => s.key === step);
  return (
    <nav aria-label="Progress" className="no-print mx-auto mb-12 max-w-3xl">
      <ol className="flex items-center justify-between gap-1">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex flex-1 items-center gap-1 last:flex-none">
            <button
              disabled={i > idx}
              onClick={() => setStep(s.key)}
              aria-current={i === idx ? "step" : undefined}
              className={`num grid h-8 w-8 place-items-center rounded-full border text-xs transition ${i === idx ? "border-ink bg-ink text-bg" : i < idx ? "border-gold bg-gold/20" : "border-hair text-soft"}`}
              aria-label={`${s.label}${i < idx ? " (completed)" : ""}`}
            >{i + 1}</button>
            <span className={`hidden text-xs sm:inline ${i === idx ? "font-semibold" : "text-soft"}`}>{s.label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px flex-1 bg-hair" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Body() {
  const { step } = useStudio();
  const View = { brief: BriefStep, pieces: PiecesStep, photo: PhotoStep, tryon: TryOnStep, compare: CompareStep, card: CardStep }[step];
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
      <Stepper />
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
          <View />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function Studio({ products, initial }: { products: Product[]; initial: SessionInfo }) {
  return (
    <StudioProvider products={products} initial={initial}>
      <Body />
    </StudioProvider>
  );
}
