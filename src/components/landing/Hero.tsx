"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const TONES = {
  bw: { label: "Black and white", bg: "#ffffff", fg: "#000000", head: "#000000", dot: "#000000" },
  red: { label: "Red on white", bg: "#ffffff", fg: "#000000", head: "#e5231b", dot: "#e5231b" },
  blue: { label: "Blue and red", bg: "#1d2bff", fg: "#ffffff", head: "#ff3b2f", dot: "#1d2bff" },
} as const;
type Tone = keyof typeof TONES;

/** One word, letters spread edge to edge so every line fills the poster width. */
function Word({ text, delay }: { text: string; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <span className="block overflow-hidden pb-[0.04em]">
      <motion.span
        className="flex justify-between"
        initial={reduce ? false : { y: "105%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1, delay, ease }}
      >
        {text.split("").map((c, i) => <span key={i}>{c}</span>)}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const [tone, setTone] = useState<Tone>("bw");
  const t = TONES[tone];
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.9, delay },
  });
  const vars = { "--hero-bg": t.bg, "--hero-fg": t.fg, background: t.bg, color: t.fg } as CSSProperties;

  return (
    <section style={vars} className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden transition-colors duration-500">
      {/* colour swatches */}
      <div role="group" aria-label="Colour" className="absolute right-5 top-5 z-30 hidden items-center gap-2 sm:flex sm:right-10">
        {(Object.keys(TONES) as Tone[]).map((k) => (
          <button
            key={k}
            aria-label={TONES[k].label}
            aria-pressed={tone === k}
            onClick={() => setTone(k)}
            className="h-4 w-4 rounded-full border"
            style={{ background: TONES[k].dot, borderColor: t.fg, outline: tone === k ? `2px solid ${t.fg}` : "none", outlineOffset: 2 }}
          />
        ))}
      </div>

      {/* poster */}
      <div className="relative flex-1">
        <h1
          aria-label="Choose from what the shop actually sells"
          style={{ color: t.head }}
          className="poster pointer-events-none absolute inset-x-0 top-[6%] z-0 px-[3vw] text-[clamp(2.6rem,16vw,8rem)] transition-colors duration-500 sm:top-[19%] sm:text-[17.4vw]"
        >
          <Word text="CHOOSE" delay={0.1} />
          <Word text="WISELY" delay={0.22} />
        </h1>

        {/* cut-out portrait stands in front of the type */}
        <motion.div
          className="pointer-events-none absolute bottom-0 left-1/2 z-10 aspect-[2/3] h-[74%] -translate-x-1/2 sm:-bottom-[8%] sm:h-[108%]"
          initial={reduce ? false : { y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.1, delay: 0.3, ease }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/examples/portrait-cutout.webp"
            alt="Side-profile portrait of a woman with a small gold hoop earring (AI-generated image)"
            className="h-full w-full object-contain object-bottom"
            style={{
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
              WebkitMaskImage: "linear-gradient(to right, #000 0, #000 86%, transparent 97%), linear-gradient(to bottom, #000 80%, transparent 100%)",
              maskImage: "linear-gradient(to right, #000 0, #000 86%, transparent 97%), linear-gradient(to bottom, #000 80%, transparent 100%)",
              WebkitMaskComposite: "source-in",
              maskComposite: "intersect",
            }}
          />
        </motion.div>

        {/* captions */}
        <motion.p {...fade(0.9)} className="micro absolute left-5 top-[11%] z-20 hidden sm:left-10 sm:block">
          Budget first.<br />Real catalogue.<br />Real shades.
        </motion.p>
        <motion.p {...fade(1)} className="micro absolute right-5 top-[11%] z-20 hidden text-right sm:right-10 sm:top-[14%] sm:block">
          Lipstick<br />Blush<br />Eyeshadow
        </motion.p>
        <motion.div {...fade(1.1)} className="absolute bottom-6 left-5 z-20 sm:bottom-10 sm:left-10">
          <p className="micro mb-5 hidden sm:block">
            From what<br />the shop<br />actually sells
          </p>
          <Link href="/consult" className="pill pill-solid">Start a consultation <ArrowRight size={13} aria-hidden /></Link>
        </motion.div>
        <motion.p {...fade(1.2)} className="micro absolute bottom-6 right-5 z-20 hidden text-right sm:bottom-10 sm:right-10 sm:block">
          A purchase-<br />ready<br />shortlist
        </motion.p>
      </div>
    </section>
  );
}
