import { ImageResponse } from "next/og";

export const alt = "SmallPrint: Looks right. But should I buy it?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#F7F3EC", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, fontFamily: "serif" }}>
        <div style={{ fontSize: 28, letterSpacing: 6, color: "#7A5C25", textTransform: "uppercase", fontFamily: "sans-serif" }}>SmallPrint</div>
        <div style={{ fontSize: 124, color: "#16130F", marginTop: 24, lineHeight: 1.02 }}>Looks right.</div>
        <div style={{ fontSize: 124, color: "#7A5C25", fontStyle: "italic", lineHeight: 1.02 }}>But should I buy it?</div>
        <div style={{ fontSize: 30, color: "#5A5247", marginTop: 36, fontFamily: "sans-serif" }}>AI earring try-on, next to the real small print.</div>
      </div>
    ),
    size,
  );
}
