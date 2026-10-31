"use client";

import { motion, useReducedMotion } from "framer-motion";
import { toPng } from "html-to-image";
import { Copy, Download, Printer } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { DecisionCard, type CardItem } from "@/components/DecisionCard";
import { useStudio } from "./store";

function Sparks() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span key={i} className="absolute h-2 w-2 rounded-full bg-gold"
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{ opacity: 0, x: (i - 7) * 26, y: 90 + (i % 4) * 40, scale: 0.3 }}
          transition={{ duration: 1.4, delay: 0.1 + i * 0.03, ease: "easeOut" }} />
      ))}
    </div>
  );
}

export function CardStep() {
  const { products, shortlist, results, verdicts, setStep, resetAll } = useStudio();
  const [photos, setPhotos] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState<"png" | "link" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const card = useRef<HTMLDivElement>(null);

  const items = useMemo<CardItem[]>(() => products
    .filter((p) => shortlist.includes(p.id) && verdicts[p.id])
    .map((p) => {
      const v = verdicts[p.id];
      const preview = results[p.id]?.imageUrl;
      return {
        name: p.name, brand: p.brand, priceCents: p.priceCents, dropLengthCm: p.dropLengthCm, weightG: p.weightG,
        fastening: p.fastening,
        returnLine: p.finalSale ? "Final sale, no returns" : `${p.returnWindowDays}-day returns. ${p.returnPolicy}`,
        imageUrl: photos && preview ? preview : p.imageUrl,
        isPreview: photos && !!preview,
        verdict: v.verdict, reason: v.reasons.join(", "),
      };
    }), [products, shortlist, verdicts, results, photos]);

  async function png() {
    if (!card.current) return;
    setBusy("png"); setMsg(null);
    try {
      const url = await toPng(card.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = url; a.download = "smallprint-decision-card.png"; a.click();
    } catch { setMsg("Couldn't export the image. Try Print → Save as PDF instead."); }
    setBusy(null);
  }

  async function share() {
    setBusy("link"); setMsg(null);
    try {
      const res = await fetch("/api/decisions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisions: products.filter((p) => shortlist.includes(p.id) && verdicts[p.id]).map((p) => ({
            productId: p.id,
            tryonId: photos ? results[p.id]?.tryonId ?? null : null,
            verdict: verdicts[p.id].verdict,
            reason: verdicts[p.id].reasons.join(", "),
          })),
        }),
      });
      const j = (await res.json()) as { url?: string };
      if (!res.ok || !j.url) throw new Error();
      const full = `${location.origin}${j.url}`;
      setLink(full);
      await navigator.clipboard?.writeText(full).catch(() => undefined);
      setMsg("Link copied. Anyone with it can see this card (read-only).");
    } catch { setMsg("Couldn't create a link just now. Please try again."); }
    setBusy(null);
  }

  return (
    <div>
      <div className="relative mb-10 text-center">
        <Sparks />
        <p className="eyebrow">Step 6 of 6</p>
        <h1 className="display h-xl mt-3">Decision made.</h1>
      </div>
      <DecisionCard ref={card} items={items} />
      <div className="no-print mx-auto mt-8 max-w-3xl">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={photos} onChange={(e) => { setPhotos(e.target.checked); setLink(null); }} className="mt-1 h-5 w-5 accent-[var(--gold-text)]" />
          <span>Include my try-on photos on the card and shared link. <span className="text-soft">They show your face, so this is off by default.</span></span>
        </label>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button className="btn" onClick={png} disabled={busy !== null}><Download size={16} aria-hidden /> Download PNG</button>
          <button className="btn btn-ghost" onClick={share} disabled={busy !== null}><Copy size={16} aria-hidden /> Copy share link</button>
          <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={16} aria-hidden /> Print</button>
        </div>
        {link && <p className="num mt-4 break-all rounded-xl bg-sunk p-3 text-xs">{link}</p>}
        {msg && <p role="status" className="mt-3 text-sm text-soft">{msg}</p>}
        <div className="mt-8 flex justify-between">
          <button className="btn btn-ghost" onClick={() => setStep("compare")}>Back</button>
          <button className="btn btn-ghost" onClick={resetAll}>Start over</button>
        </div>
      </div>
    </div>
  );
}
