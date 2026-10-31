import { ArrowRight, Ban } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Hero } from "@/components/landing/Hero";

const STEPS = [
  { title: "Type & budget", body: "Lipstick, blush or eyeshadow, then a maximum price, finish and optional colour family. Matches appear straight away." },
  { title: "Shortlist three", body: "Each card shows price, finish, shade code and stock status. Out-of-stock shades can't be picked." },
  { title: "Photo & consent", body: "You agree before anything is sent. Or use the sample photo to explore." },
  { title: "Compare", body: "Every shade is applied to your original photo, same size and crop, with a retry for any that fail." },
  { title: "Decide & save", body: "Pick a favourite, add a note, and export a purchase card with the exact shade code and price." },
];

const REAL = [
  { tag: "Catalogue data", who: "The shop", what: "Product name, shade code, price in PKR, finish, stock status, contact." },
  { tag: "Your choices", who: "The shopper", what: "Budget, finish, colour family, shortlist, favourite, personal note." },
  { tag: "AI-generated", who: "YouCam AI", what: "The makeup preview image. Nothing else." },
];

const white = { "--hero-bg": "#ffffff", "--hero-fg": "#000000" } as CSSProperties;
const black = { "--hero-bg": "#000000", "--hero-fg": "#ffffff" } as CSSProperties;

export default function Home() {
  return (
    <>
      <Hero />

      {/* compare */}
      <section style={black} className="bg-black text-white">
        <div className="mx-auto grid max-w-[96rem] items-end gap-10 px-5 py-20 sm:px-10 sm:py-28 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="micro">See it before you buy it</p>
            <h2 className="poster mt-6 text-[clamp(3.2rem,12vw,11rem)]">Same<br />photo.</h2>
            <p className="micro mt-8 max-w-xs">Real shades.<br />One decision.</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/consult" className="pill pill-solid">Start a consultation <ArrowRight size={13} aria-hidden /></Link>
              <a href="#how" className="pill">How it works</a>
            </div>
          </div>
          <figure>
            <div className="grid grid-cols-2 gap-px bg-white/30">
              {[
                { src: "/sample-photos/sample-1.jpg", cap: "Original", tag: null },
                { src: "/examples/sample-bl-02.jpg", cap: "BL-02 · Satin blush", tag: "AI preview" },
              ].map((i) => (
                <div key={i.src} className="bg-black">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i.src} alt={i.cap} className="h-full w-full object-cover object-[50%_35%] grayscale" />
                    {i.tag && <span className="micro absolute left-3 top-3 bg-white px-2.5 py-1 text-black">{i.tag}</span>}
                  </div>
                  <p className="micro px-1 pb-1 pt-3">{i.cap}</p>
                </div>
              ))}
            </div>
            <figcaption className="micro mt-4 max-w-md normal-case tracking-normal text-white/60">
              A real result from the YouCam AI Makeup API, shown in black and white here. Digital colour is approximate and may differ from the physical product.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* how */}
      <section id="how" style={white} className="bg-white text-black">
        <div className="mx-auto max-w-[96rem] px-5 py-20 sm:px-10 sm:py-28">
          <div className="flex items-end justify-between gap-6">
            <h2 className="poster text-[clamp(2.8rem,9vw,8.5rem)]">Five steps.<br />One decision.</h2>
            <p className="micro hidden text-right sm:block">About<br />two minutes</p>
          </div>
          <ol className="mt-14 grid border-t-2 border-black sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="border-b border-black/20 py-8 sm:pr-6 lg:border-b-0 lg:border-r lg:border-black/20 lg:px-6 lg:first:pl-0 lg:last:border-r-0">
                <span className="poster block text-[clamp(3.5rem,6vw,5.5rem)]" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="micro mt-6 text-[0.8rem] font-extrabold">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-black/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* what is real */}
      <section id="real" style={black} className="bg-black text-white">
        <div className="mx-auto max-w-[96rem] px-5 py-20 sm:px-10 sm:py-28">
          <p className="micro">Product facts and AI imagery</p>
          <h2 className="poster mt-6 text-[clamp(3rem,11vw,10rem)]">Kept<br />apart.</h2>
          <p className="mt-8 max-w-xl text-white/70">
            The preview helps you picture a shade. It never decides the price, the shade code or whether something is in stock.
          </p>
          <ul className="mt-14 grid border-t-2 border-white md:grid-cols-3">
            {REAL.map((r) => (
              <li key={r.who} className="border-b border-white/25 py-8 md:border-b-0 md:border-r md:border-white/25 md:px-8 md:first:pl-0 md:last:border-r-0">
                <span className="pill !px-3.5 !py-1.5 !text-[0.62rem]">{r.tag}</span>
                <h3 className="poster mt-8 text-[clamp(1.6rem,2.5vw,2.4rem)] whitespace-nowrap">{r.who}</h3>
                <p className="mt-4 text-white/70">{r.what}</p>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex items-start gap-3 border-t border-white/25 pt-6 text-sm text-white/70">
            <Ban size={18} className="mt-0.5 shrink-0" aria-hidden />
            <p>
              The demo shop is a <strong className="text-white">manually maintained sample catalogue</strong> of twenty made-up products, not a live retailer feed.
              There are no skin-tone claims, suitability scores or exact-shade-match promises, only filters you can see.
            </p>
          </div>
        </div>
      </section>

      {/* closing call to action */}
      <section style={white} className="bg-white text-black">
        <div className="mx-auto flex max-w-[96rem] flex-col items-start gap-10 px-5 py-20 sm:px-10 sm:py-28">
          <h2 className="poster text-[clamp(3rem,12vw,11rem)]">Narrow<br />it down.</h2>
          <div className="flex w-full flex-wrap items-end justify-between gap-6">
            <p className="micro">Budget first.<br />Real catalogue.<br />Real shades.</p>
            <Link href="/consult" className="pill pill-solid !px-8 !py-4 !text-[0.8rem]">Start a consultation <ArrowRight size={14} aria-hidden /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
