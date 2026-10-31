"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Label, type ImageLabel } from "@/components/ui";

/** Draggable, keyboard-operable before/after slider with spring settle. */
export function BeforeAfter({
  before, after, afterLabel, beforeAlt, afterAlt,
}: { before: string; after: string; afterLabel: ImageLabel; beforeAlt: string; afterAlt: string }) {
  const box = useRef<HTMLDivElement>(null);
  const pos = useMotionValue(50);
  const clip = useTransform(pos, (v) => `inset(0 ${100 - v}% 0 0)`);
  const left = useTransform(pos, (v) => `${v}%`);
  const [now, setNow] = useState(50);

  const setFromX = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const v = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
    pos.set(v);
    setNow(Math.round(v));
  };
  const settle = (v: number) => { animate(pos, v, { type: "spring", stiffness: 260, damping: 26 }); setNow(Math.round(v)); };

  return (
    <div
      ref={box}
      className="relative aspect-[3/4] w-full select-none overflow-hidden rounded-[20px] border border-hair bg-sunk touch-pan-y"
      onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setFromX(e.clientX); }}
      onPointerMove={(e) => { if (e.buttons) setFromX(e.clientX); }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={afterAlt} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt={beforeAlt} className="h-full w-full object-cover" draggable={false} />
      </motion.div>
      <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[0.68rem] font-semibold text-bg">Original</span>
      <Label kind={afterLabel} className="absolute right-3 top-3" />
      <motion.div className="absolute inset-y-0 w-px bg-bg shadow" style={{ left }}>
        <button
          type="button"
          role="slider"
          aria-label="Compare original and AI preview"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={now}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") settle(Math.max(0, pos.get() - 5));
            if (e.key === "ArrowRight") settle(Math.min(100, pos.get() + 5));
          }}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-bg text-ink shadow-soft border border-hair"
        >
          <span aria-hidden="true" className="text-xs">◀ ▶</span>
        </button>
      </motion.div>
    </div>
  );
}
