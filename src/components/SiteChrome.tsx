import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`display inline-flex items-center gap-2 text-[1.15rem] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-mark.svg" alt="" aria-hidden className="h-7 w-auto" />
      CounterReady
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        <Link href="/" aria-label="CounterReady home"><Wordmark /></Link>
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-3">
          <Link href="/#how" className="btn btn-ghost !hidden !min-h-10 sm:!inline-flex">How it works</Link>
          <Link href="/#real" className="btn btn-ghost !hidden !min-h-10 sm:!inline-flex">What&apos;s real</Link>
          <Link href="/consult" className="btn !min-h-10 !px-5 whitespace-nowrap"><span className="sm:hidden">Start</span><span className="hidden sm:inline">Start a consultation</span> <ArrowRight size={15} aria-hidden /></Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-hair">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-soft sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>Built for the YouCam API Skin AI &amp; eCommerce VTO Hackathon. Previews generated with the YouCam AI Makeup API.</p>
        <nav aria-label="Footer" className="flex gap-5">
          <Link href="/privacy" className="underline-offset-4 hover:underline">Privacy</Link>
          <Link href="/consult" className="underline-offset-4 hover:underline">Start a consultation</Link>
        </nav>
      </div>
    </footer>
  );
}
