import Link from "next/link";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Magnetic, Reveal, Ruler, Source, WeightMeter } from "@/components/ui";

const steps = [
  { n: "01", t: "Set your brief", d: "Budget, how long a drop you'll tolerate, fastening, material. Under twenty seconds." },
  { n: "02", t: "Try up to three", d: "Upload a side-profile selfie. The YouCam Earring API places each piece on your ear." },
  { n: "03", t: "Decide with facts", d: "Previews sit beside real drop length, weight, returns. Then Buy, Maybe or Skip, and share the card." },
];

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-14 sm:px-8 lg:grid-cols-12 lg:pt-24">
        <div className="lg:col-span-7">
          <Reveal><p className="eyebrow">An earring decision assistant</p></Reveal>
          <Reveal delay={0.08}>
            <h1 className="display h-hero mt-5">Looks right.<br /><em className="text-goldtext">But should I buy it?</em></h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-8 max-w-xl text-lg text-soft">
              A product photo tells you if an earring is beautiful. It can&apos;t tell you if it&apos;s right for you.
              SmallPrint shows the AI try-on <strong className="text-ink">next to the small print</strong>: drop length, weight, fastening and what happens if you send it back.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Magnetic><Link href="/studio" className="btn !min-h-14 !px-8 text-base">Try my first earring</Link></Magnetic>
              <a href="#how" className="text-sm underline underline-offset-4 text-soft hover:text-ink">How it works</a>
            </div>
            <p className="mt-5 text-sm text-soft">No account. Your selfie is never stored.</p>
          </Reveal>
        </div>
        <Reveal delay={0.2} className="lg:col-span-5">
          <div className="mx-auto max-w-sm">
            <BeforeAfter
              before="/examples/pre-generated-before.jpg"
              after="/examples/pre-generated-tryon.jpg"
              afterLabel="Pre-generated example"
              beforeAlt="Side profile portrait before the try-on"
              afterAlt="The same portrait with a small gold hoop earring added by the YouCam Earring API"
            />
            <p className="mt-3 text-center text-xs text-soft">Drag to compare. Pre-generated example made with the YouCam Earring API.</p>
          </div>
        </Reveal>
      </section>

      <section className="border-y border-hair bg-sunk">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">The problem</p>
            <h2 className="display h-xl mt-4">Photos don&apos;t come with a ruler.</h2>
            <p className="mt-5 text-soft">
              Product images are cropped to fill the frame, so a 1 cm stud and a 9 cm chandelier look the same size. Shoppers find out
              when the parcel arrives, and returns are the most expensive part of selling jewellery online.
              Baymard&apos;s research on <a className="underline underline-offset-4" href="https://baymard.com/research-articles/in-scale-product-images">product scale in images</a> documents exactly this.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="card grid grid-cols-2 gap-6 p-6 sm:p-8">
              {[{ n: "Lune Pearl Stud", cm: 0.8, g: 1.1 }, { n: "Aurelia Chandelier", cm: 8.5, g: 14.5 }].map((p) => (
                <div key={p.n}>
                  <div className="flex h-[150px] items-start gap-3"><Ruler cm={p.cm} /></div>
                  <p className="mt-3 font-medium">{p.n}</p>
                  <p className="num text-sm text-soft">{p.cm} cm · {p.g} g</p>
                  <div className="mt-3"><WeightMeter grams={p.g} /></div>
                </div>
              ))}
              <p className="col-span-2 text-xs text-soft">Same product-photo crop, drawn here to scale. Catalogue values.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-8">
        <Reveal><p className="eyebrow">How it works</p><h2 className="display h-xl mt-4 max-w-2xl">Three steps from &ldquo;pretty&rdquo; to &ldquo;sure&rdquo;.</h2></Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="card h-full p-7">
                <span className="num text-sm text-goldtext">{s.n}</span>
                <h3 className="display h-lg mt-3">{s.t}</h3>
                <p className="mt-3 text-soft">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-24 sm:px-8 lg:grid-cols-2">
        <Reveal>
          <div className="card h-full p-8">
            <p className="eyebrow">Privacy promise</p>
            <h2 className="display h-lg mt-3">Your selfie is used once and forgotten.</h2>
            <ul className="mt-5 space-y-3 text-soft">
              <li>It&apos;s sent to YouCam to render the preview, then discarded. SmallPrint never writes it to disk or a database.</li>
              <li>Only the generated preview is kept, so your comparison survives a reload. Delete it any time from the privacy page.</li>
              <li>No accounts, no tracking pixels.</li>
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="card h-full p-8">
            <p className="eyebrow">Honest about its limits</p>
            <h2 className="display h-lg mt-3">What each number is, and isn&apos;t.</h2>
            <div className="mt-5 space-y-3 text-sm">
              <p><Source kind="youcam" /> <span className="text-soft">The preview is an approximation, not a calibrated measurement. Size comes from the catalogue&apos;s declared dimensions.</span></p>
              <p><Source kind="catalogue" /> <span className="text-soft">Weight, material, hypoallergenic claims and return terms are the seller&apos;s. We never claim an earring is allergy-safe.</span></p>
              <p><Source kind="smallprint" /> <span className="text-soft">&ldquo;Fit to your brief&rdquo; is a plain checklist of your own limits, not a scientific score.</span></p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="bg-ink text-bg">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-20 sm:px-8 md:flex-row md:items-center md:justify-between">
          <h2 className="display h-xl max-w-2xl">Buy the ones that fit. Skip the ones that only photograph well.</h2>
          <Magnetic><Link href="/studio" className="btn btn-gold !min-h-14 !px-8">Start the brief</Link></Magnetic>
        </div>
      </section>
    </>
  );
}
