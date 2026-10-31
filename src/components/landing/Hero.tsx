"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Menu, Search } from "lucide-react";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

function Line({ children, delay }: { children: string; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <span className="block overflow-hidden pb-[0.04em]">
      <motion.span
        className="block"
        initial={reduce ? false : { y: "105%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1, delay, ease }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.9, delay },
  });
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-white text-black">
      {/* nav */}
      <nav aria-label="Primary" className="relative z-30 grid grid-cols-[auto_1fr_auto] items-center gap-6 px-5 py-5 sm:px-10">
        <button aria-label="Menu" className="grid h-10 w-10 place-items-center"><Menu size={18} aria-hidden /></button>
        <ul className="micro hidden justify-center gap-10 sm:flex">
          <li><a href="#pieces" className="hover:underline underline-offset-4">Pieces</a></li>
          <li><a href="#how" className="hover:underline underline-offset-4">Try-on</a></li>
          <li><a href="#honest" className="hover:underline underline-offset-4">About</a></li>
          <li><Link href="/privacy" className="hover:underline underline-offset-4">Privacy</Link></li>
        </ul>
        <div className="col-start-3 flex items-center gap-4 sm:col-auto">
          <Search size={15} aria-hidden className="hidden sm:block" />
          <Link href="/studio" className="pill">Get started <ArrowRight size={13} aria-hidden /></Link>
        </div>
      </nav>

      {/* poster */}
      <div className="relative flex-1">
        <h1 aria-label="Looks right? But should I buy it?" className="poster pointer-events-none absolute inset-x-0 top-[8%] z-0 flex flex-col items-center px-[3vw] text-[clamp(3rem,20vw,9rem)] sm:top-[31%] sm:flex-row sm:items-start sm:justify-between sm:text-[6.6vw]">
          <Line delay={0.1}>Looks</Line>
          <Line delay={0.22}>Right?</Line>
        </h1>

        {/* portrait: greyscale photo multiplied onto white so its sky disappears */}
        <motion.div
          className="pointer-events-none absolute -bottom-[8%] left-1/2 z-10 aspect-[2/3] h-[132%] -translate-x-1/2"
          initial={reduce ? false : { y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.1, delay: 0.3, ease }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/examples/portrait-cutout.png"
            alt="Side-profile portrait wearing a small gold hoop earring placed by the YouCam Earring API"
            className="h-full w-full object-contain object-bottom"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent 0, #000 14%, #000 86%, transparent 100%), linear-gradient(to bottom, #000 78%, transparent 100%)",
              maskImage: "linear-gradient(to right, transparent 0, #000 14%, #000 86%, transparent 100%), linear-gradient(to bottom, #000 78%, transparent 100%)",
              WebkitMaskComposite: "source-in",
              maskComposite: "intersect",
            }}
          />
        </motion.div>

        {/* second layer of type, inverted where it crosses the photo */}
        <p
          aria-hidden="true"
          className="poster pointer-events-none absolute left-[calc(50%+24vw)] top-[44%] z-20 hidden whitespace-nowrap text-[clamp(1rem,2vw,2.2rem)] text-white mix-blend-difference [writing-mode:vertical-rl] sm:block"
        >
          But should I buy it?
        </p>

        {/* captions */}
        <motion.p {...fade(0.9)} className="micro text-white mix-blend-difference absolute hidden sm:block left-5 top-[48%] z-20 sm:left-10 sm:top-[17%]">
          AI try-on<br />meets the<br />small print
        </motion.p>
        <motion.p {...fade(1)} className="micro text-white mix-blend-difference absolute hidden sm:block right-5 top-[48%] z-20 text-right sm:right-10 sm:top-[17%]">
          Try<br />Compare<br />Decide
        </motion.p>
        <motion.div {...fade(1.1)} className="absolute bottom-6 left-5 z-20 sm:bottom-10 sm:left-10">
          <p className="micro mb-5 hidden text-white mix-blend-difference sm:block">
            Drop length<br />Weight<br />Returns<br />Without guessing
          </p>
          <Link href="/studio" className="pill pill-solid">Try my first earring <ArrowRight size={13} aria-hidden /></Link>
        </motion.div>
        <motion.p {...fade(1.2)} className="micro text-white mix-blend-difference absolute bottom-6 right-5 z-20 text-right sm:bottom-10 sm:right-10">
          A more<br />confident<br />checkout
        </motion.p>
      </div>
    </section>
  );
}
