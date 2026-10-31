"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";

/** The landing page ships its own black-and-white chrome, so the global one steps aside on "/". */
export function SiteHeader() {
  if (usePathname() === "/") return null;
  return (
    <header className="no-print sticky top-0 z-40 backdrop-blur bg-bg/80 border-b border-hair">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" aria-label="SmallPrint home"><Wordmark /></Link>
        <nav className="flex items-center gap-5 text-sm" aria-label="Primary">
          <Link href="/#how" className="hidden sm:inline text-soft hover:text-ink">How it works</Link>
          <Link href="/privacy" className="hidden sm:inline text-soft hover:text-ink">Privacy</Link>
          <Link href="/studio" className="btn !min-h-10 !px-5">Start</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  if (usePathname() === "/") return null;
  return (
    <footer className="no-print border-t border-hair mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-10 grid gap-6 sm:grid-cols-2 text-sm text-soft">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-sm">
            Previews are AI-generated approximations. Weight, material, hypoallergenic status and return terms come from
            the seller&apos;s catalogue, never from the AI.
          </p>
        </div>
        <div className="sm:text-right space-y-1">
          <p>Try-on by the YouCam Earring VTO API.</p>
          <p><Link href="/privacy" className="underline underline-offset-4">Privacy &amp; delete my data</Link></p>
          <p>Built for the YouCam API Skin AI &amp; eCommerce VTO Hackathon.</p>
        </div>
      </div>
    </footer>
  );
}
