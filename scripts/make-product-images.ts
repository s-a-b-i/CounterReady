/* Usage: npx tsx scripts/make-product-images.ts
 * Writes simple illustrations to public/products/<id>.svg, tinted from each product's previewHex.
 * They are placeholders for the sample catalogue, not photographs of real products. */
import { mkdirSync, writeFileSync } from "node:fs";
import { CATALOGUE } from "../src/lib/catalogue";
import type { MakeupProduct } from "../src/lib/consultation-types";

mkdirSync("public/products", { recursive: true });

const sheen = (p: MakeupProduct, x: number, y: number, rx: number, ry: number) =>
  p.finish === "gloss" || p.finish === "metallic"
    ? `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".42" transform="rotate(8 ${x} ${y})"/>`
    : p.finish === "satin" || p.finish === "shimmer"
      ? `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".2" transform="rotate(8 ${x} ${y})"/>`
      : "";

function art(p: MakeupProduct): string {
  if (p.category === "lipstick") {
    return `<ellipse cx="200" cy="352" rx="92" ry="12" fill="#000" opacity=".08"/>
  <rect x="160" y="236" width="80" height="112" rx="10" fill="#1d1e21"/>
  <rect x="160" y="236" width="80" height="14" fill="#c9a24b"/>
  <rect x="160" y="262" width="80" height="3" fill="#c9a24b" opacity=".6"/>
  <rect x="168" y="170" width="64" height="70" fill="#d8dadd"/>
  <path d="M172 176 V112 Q172 94 188 84 L222 62 Q230 58 230 70 V176 Z" fill="${p.previewHex}"/>
  ${sheen(p, 205, 128, 9, 34)}`;
  }
  if (p.category === "blush") {
    return `<ellipse cx="200" cy="330" rx="130" ry="14" fill="#000" opacity=".08"/>
  <rect x="80" y="130" width="240" height="190" rx="28" fill="#1d1e21"/>
  <rect x="80" y="130" width="240" height="14" rx="7" fill="#c9a24b"/>
  <rect x="104" y="160" width="192" height="136" rx="20" fill="#2b2c30"/>
  <circle cx="200" cy="228" r="58" fill="${p.previewHex}"/>
  ${sheen(p, 182, 206, 22, 12)}`;
  }
  return `<ellipse cx="200" cy="330" rx="130" ry="14" fill="#000" opacity=".08"/>
  <rect x="100" y="120" width="200" height="200" rx="28" fill="#1d1e21"/>
  <rect x="100" y="120" width="200" height="14" rx="7" fill="#c9a24b"/>
  <rect x="124" y="152" width="152" height="144" rx="18" fill="#2b2c30"/>
  <rect x="140" y="170" width="120" height="108" rx="14" fill="${p.previewHex}"/>
  ${sheen(p, 178, 204, 28, 12)}`;
}

for (const p of CATALOGUE) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="${p.name} sample illustration">
  <rect width="400" height="400" fill="#f4f5f6"/>
  ${art(p)}
  <text x="200" y="392" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#8a9099">SAMPLE · ${p.shadeCode}</text>
</svg>
`;
  writeFileSync(`public/products/${p.id}.svg`, svg);
}
console.log(`wrote ${CATALOGUE.length} images`);
