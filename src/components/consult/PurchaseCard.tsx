import { formatPkr } from "@/lib/catalogue";
import { CATEGORY_LABEL, REMINDER, SHOP, type MakeupProduct } from "@/lib/consultation-types";

export const CARD_W = 1080;
export const CARD_H = 1350;

interface Props {
  product: MakeupProduct;
  note?: string;
  budget: number;
  comparedCount: number;
  /** Customer's own AI preview. Only passed when they opted in; otherwise the card is product-only. */
  facePreviewUrl?: string;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/**
 * The purchase card, drawn at full export size (1080x1350). The same markup is previewed scaled down and
 * rasterised to PNG, so what you see is what you download. Plain <img> and inline styles on purpose: html-to-image
 * needs ordinary elements and same-origin or data URLs.
 */
export function PurchaseCard({ product: p, note, budget, comparedCount, facePreviewUrl }: Props) {
  const n = note?.trim();
  return (
    <div style={{ width: CARD_W, height: CARD_H, display: "flex", flexDirection: "column", background: "#fff", color: "#0b0c0e", fontFamily: "var(--font-inter), sans-serif", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "44px 56px 0" }}>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", fontFamily: "var(--font-archivo), var(--font-inter), sans-serif" }}>{SHOP.name}</div>
        <div style={{ fontSize: 22, fontWeight: 700, background: "#f1f2f4", padding: "8px 18px", borderRadius: 999, color: "#565b63" }}>Sample catalogue</div>
      </div>

      <div style={{ display: "flex", gap: 40, padding: "36px 56px 0", flex: 1, minHeight: 0 }}>
        <div style={{ position: "relative", width: 440, height: 440, flexShrink: 0, borderRadius: 32, overflow: "hidden", background: "#f4f5f6" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={facePreviewUrl ?? p.imageUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: facePreviewUrl ? "50% 62%" : "50% 50%" }}
          />
          {facePreviewUrl && (
            <span style={{ position: "absolute", left: 16, bottom: 16, background: "#fff", fontSize: 20, fontWeight: 700, padding: "8px 16px", borderRadius: 999 }}>AI preview · colour approximate</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#565b63", letterSpacing: "0.1em", textTransform: "uppercase" }}>My choice · {CATEGORY_LABEL[p.category]}</div>
          <div style={{ marginTop: 12, fontSize: 62, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.03em", fontFamily: "var(--font-archivo), var(--font-inter), sans-serif" }}>{p.name}</div>
          <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span style={{ border: "3px solid #0b0c0e", borderRadius: 999, padding: "6px 22px", fontSize: 30, fontWeight: 800 }}>{p.shadeCode}</span>
            <span style={{ background: "#f1f2f4", borderRadius: 999, padding: "9px 22px", fontSize: 28, fontWeight: 600 }}>{cap(p.finish)}</span>
          </div>
          <div style={{ marginTop: "auto", fontSize: 92, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{formatPkr(p.price)}</div>
          <div style={{ marginTop: 8, fontSize: 22, color: "#8a9099" }}>Listed price in the sample catalogue</div>
        </div>
      </div>

      <div style={{ padding: "0 56px", marginTop: 36 }}>
        <div style={{ background: "#f6f7f8", borderRadius: 28, padding: "28px 36px", minHeight: 150 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#565b63", letterSpacing: "0.1em", textTransform: "uppercase" }}>My note</div>
          <div style={{ marginTop: 10, fontSize: 38, fontWeight: 600, lineHeight: 1.25, color: n ? "#0b0c0e" : "#8a9099" }}>{n ? `“${n}”` : "No note added."}</div>
        </div>
        <div style={{ marginTop: 18, fontSize: 26, color: "#565b63" }}>Budget {formatPkr(budget)} · {comparedCount} shade{comparedCount === 1 ? "" : "s"} compared</div>
      </div>

      <div style={{ marginTop: "auto", background: "#0b0c0e", color: "#fff", padding: "32px 56px 36px" }}>
        <div style={{ fontSize: 32, fontWeight: 700 }}>{SHOP.contact}</div>
        <div style={{ marginTop: 10, fontSize: 22, lineHeight: 1.35, color: "#c4c8ce" }}>{REMINDER}</div>
      </div>
    </div>
  );
}
