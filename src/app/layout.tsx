import type { Metadata, Viewport } from "next";
import { Archivo, Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Cursor } from "@/components/Cursor";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
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
    <html lang="en" className={`${fraunces.variable} ${archivo.variable} ${inter.variable} ${mono.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <a href="#main" className="skip-link">Skip to content</a>
        <SiteHeader />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter />
        <Cursor />
      </body>
    </html>
  );
}
