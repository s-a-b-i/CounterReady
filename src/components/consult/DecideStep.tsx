"use client";

import { ArrowLeft, Copy, Download, RotateCcw } from "lucide-react";
import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import type { MakeupProduct, Preferences } from "@/lib/consultation-types";
import { SHOP } from "@/lib/consultation-types";
import { buildReceipt, receiptText } from "@/lib/receipt";
import { CARD_H, CARD_W, PurchaseCard } from "./PurchaseCard";

interface Props {
  prefs: Preferences;
  compared: MakeupProduct[];
  selected: MakeupProduct;
  /** The favourite's AI preview, used on the card only if the shopper opts in. */
  previewUrl?: string;
  note: string;
  showFace: boolean;
  onNote: (v: string) => void;
  onShowFace: (v: boolean) => void;
  onBack: () => void;
  onRestart: () => void;
}

export const NOTE_MAX = 120;

/** Step 5: the note, the comparison receipt and the exportable purchase card. */
export function DecideStep({ prefs, compared, selected, previewUrl, note, showFace, onNote, onShowFace, onBack, onRestart }: Props) {
  const rows = buildReceipt({ prefs, compared, selected, note });
  const cardRef = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / CARD_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  async function download() {
    if (!cardRef.current) return;
    setBusy(true);
    setMsg("");
    try {
      const url = await toPng(cardRef.current, { width: CARD_W, height: CARD_H, pixelRatio: 1, style: { transform: "none" } });
      const a = document.createElement("a");
      a.href = url;
      a.download = `counterready-${selected.shadeCode.toLowerCase()}.png`;
      a.click();
      setMsg("Card downloaded.");
    } catch {
      setMsg("The card couldn't be exported in this browser. Try a screenshot instead.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(receiptText(SHOP.name, rows));
      setMsg("Receipt copied.");
    } catch {
      setMsg("Copying isn't available here. Select the receipt text instead.");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
      <div>
        <h2 className="display h-lg">Your comparison receipt</h2>
        <p className="mt-2 text-soft">What you chose and why, tied to a real product code. The preview image never appears in this list.</p>

        <div className="mt-6">
          <label htmlFor="note" className="field-label">Add a note <span className="font-normal text-soft">(optional)</span></label>
          <textarea id="note" className="input !min-h-[96px]" maxLength={NOTE_MAX} value={note} onChange={(e) => onNote(e.target.value)} placeholder="e.g. I prefer this shade for everyday use." />
          <p className="field-hint num">{note.length}/{NOTE_MAX}</p>
        </div>

        <dl className="card mt-4 divide-y divide-hair" aria-label="Comparison receipt">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-6 px-5 py-3.5">
              <dt className="text-soft">{k}</dt>
              <dd className="num text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        {previewUrl && (
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-surface p-4">
            <input type="checkbox" checked={showFace} onChange={(e) => onShowFace(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-black" />
            <span className="text-sm"><span className="font-semibold">Show my face on the card.</span> Off by default: the card then shows only the product. If you turn it on, the card includes your AI preview, labelled as such.</span>
          </label>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-lg" onClick={download} disabled={busy}><Download size={16} aria-hidden /> {busy ? "Preparing…" : "Download purchase card"}</button>
          <button type="button" className="btn btn-outline btn-lg" onClick={copy}><Copy size={16} aria-hidden /> Copy receipt</button>
        </div>
        <p role="status" className="field-hint min-h-5">{msg}</p>

        <div className="mt-6 flex items-center justify-between">
          <button type="button" className="btn btn-ghost" onClick={onBack}><ArrowLeft size={16} aria-hidden /> Compare</button>
          <button type="button" className="btn btn-ghost" onClick={onRestart}><RotateCcw size={16} aria-hidden /> Start again</button>
        </div>
      </div>

      <div className="min-w-0">
        <p className="eyebrow mb-3">Purchase card preview</p>
        <div ref={wrap} className="card overflow-hidden" style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }}>
          <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <div ref={cardRef} style={{ width: CARD_W, height: CARD_H }}>
              <PurchaseCard product={selected} note={note} budget={prefs.budget} comparedCount={compared.length} facePreviewUrl={showFace ? previewUrl : undefined} />
            </div>
          </div>
        </div>
        <p className="field-hint">1080 × 1350 px. {showFace ? "Includes your AI preview." : "Product only: no photo of you."}</p>
      </div>
    </div>
  );
}
