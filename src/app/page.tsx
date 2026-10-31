import { ArrowRight, Ban, Camera, Filter, ReceiptText, Sparkles } from "lucide-react";
import Link from "next/link";
import { Hero } from "@/components/landing/Hero";

const STEPS = [
  { icon: Filter, title: "Pick a type and budget", body: "Lipstick, blush or eyeshadow, then a maximum price, preferred finish and optional colour family. Matches appear straight away." },
  { icon: Sparkles, title: "Shortlist up to three", body: "Each card shows price, finish, shade code and stock status. Out-of-stock shades can't be picked." },
  { icon: Camera, title: "Add a photo, with consent", body: "You agree before anything is sent. Or use the sample photo to explore." },
  { icon: Sparkles, title: "Compare side by side", body: "Every shade is applied to your original photo, same size and crop, with a retry for any that fail." },
  { icon: ReceiptText, title: "Decide and save", body: "Pick a favourite, add a note, and export a purchase card with the exact shade code and price." },
];

const REAL = [
  { who: "The shop", what: "Product name, shade code, price in PKR, finish, stock status, contact", tag: "Catalogue data", tone: "tag" },
  { who: "The shopper", what: "Budget, finish, colour family, shortlist, favourite, personal note", tag: "Your choices", tone: "tag" },
  { who: "YouCam AI", what: "The makeup preview image, nothing else", tag: "AI-generated", tone: "tag tag-ai" },
];

export default function Home() {
  return (
    <>
      <Hero />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="eyebrow">See it before you buy it</p>
          <h2 className="display h-lg mt-3">Same photo. Real shades. One decision.</h2>
          <p className="mt-4 max-w-md text-soft">
            Set a budget, shortlist real products, preview them on the same photo, and leave with a clear purchase choice.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/consult" className="btn btn-lg">Start a consultation <ArrowRight size={16} aria-hidden /></Link>
            <a href="#how" className="btn btn-outline btn-lg">How it works</a>
          </div>
        </div>
        <figure className="grid grid-cols-2 gap-3">
          {[
            { src: "/sample-photos/sample-1.jpg", cap: "Original", tag: null },
            { src: "/examples/sample-bl-02.jpg", cap: "Sample Rose Flush · BL-02 · Satin blush", tag: "AI preview" },
          ].map((i) => (
            <div key={i.src} className="card overflow-hidden">
              <div className="relative aspect-[3/4] bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.src} alt={i.cap} className="h-full w-full object-cover object-[50%_35%]" />
                {i.tag && <span className="tag tag-ai absolute left-3 top-3">{i.tag}</span>}
              </div>
              <figcaption className="p-3 text-sm font-medium">{i.cap}</figcaption>
            </div>
          ))}
          <p className="col-span-2 text-xs text-soft">A real result from the YouCam AI Makeup API. Digital colour is approximate and may differ from the physical product.</p>
        </figure>
      </section>

      <section id="how" className="border-y border-hair bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
          <h2 className="display h-lg">Five steps, one decision.</h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card p-5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
                <h3 className="h-md mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="real" className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <h2 className="display h-lg max-w-2xl">Product facts and AI imagery stay separate.</h2>
        <p className="mt-3 max-w-2xl text-soft">The preview helps you picture a shade. It never decides the price, the shade code or whether something is in stock.</p>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {REAL.map((r) => (
            <li key={r.who} className="card p-6">
              <span className={r.tone}>{r.tag}</span>
              <h3 className="h-md mt-4 font-semibold">{r.who}</h3>
              <p className="mt-2 text-soft">{r.what}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-surface p-5 text-sm text-soft">
          <Ban size={18} className="mt-0.5 shrink-0" aria-hidden />
          <p>
            The demo shop is a <strong className="text-ink">manually maintained sample catalogue</strong> of twenty made-up products, not a live retailer feed.
            There are no skin-tone claims, suitability scores or exact-shade-match promises, only filters you can see.
          </p>
        </div>
      </section>

      <section className="border-t border-hair">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-8 md:flex-row md:items-center md:justify-between">
          <h2 className="display h-lg max-w-xl">Ready to narrow it down?</h2>
          <Link href="/consult" className="btn btn-lg">Start a consultation <ArrowRight size={16} aria-hidden /></Link>
        </div>
      </section>
    </>
  );
}
