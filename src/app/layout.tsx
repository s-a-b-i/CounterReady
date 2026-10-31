import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { Cursor } from "@/components/Cursor";
import { Wordmark } from "@/components/Wordmark";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "SmallPrint: looks right, but should I buy it?", template: "%s · SmallPrint" },
  description:
    "Try earrings on with the YouCam Earring VTO API, then see the real drop length, weight, fastening and return terms side by side before you buy.",
  openGraph: {
    title: "SmallPrint: Looks right. But should I buy it?",
    description: "An earring decision assistant: AI preview next to the real catalogue facts.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#14110d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${mono.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <a href="#main" className="skip-link">Skip to content</a>
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
        <main id="main" className="flex-1">{children}</main>
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
              <p>
                <Link href="/privacy" className="underline underline-offset-4">Privacy &amp; delete my data</Link>
              </p>
              <p>Built for the YouCam API Skin AI &amp; eCommerce VTO Hackathon.</p>
            </div>
          </div>
        </footer>
        <Cursor />
      </body>
    </html>
  );
}
