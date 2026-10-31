import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  title: { default: "CounterReady: choose from what the shop actually sells", template: "%s · CounterReady" },
  description:
    "A budget-first makeup consultation. Filter one shop's catalogue, preview up to three shades on the same photo with the YouCam API, and leave with a purchase-ready card.",
  openGraph: {
    title: "CounterReady",
    description: "Choose from what the shop actually sells, not an endless palette of colours.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <a href="#main" className="skip-link">Skip to content</a>
        <SiteHeader />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
