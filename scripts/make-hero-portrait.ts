/* Usage: npx tsx scripts/make-hero-portrait.ts "<cut-out PNG with transparent background>"
 * Writes public/examples/portrait-cutout.webp: a greyscale RGBA version for the black-and-white hero.
 * Built from explicit RGBA bytes because a two-channel sharp pipeline drops the alpha channel. */
import { mkdirSync } from "node:fs";
import sharp from "sharp";

async function main() {
  const src = process.argv[2];
  if (!src) {
    console.error('usage: tsx scripts/make-hero-portrait.ts "<cut-out.png>"');
    process.exit(1);
  }
  const { data: rgba, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, o = 0; i < rgba.length; i += 4, o += 4) {
    const luma = 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
    const g = Math.max(0, Math.min(255, Math.round(luma * 1.08 - 6)));
    out[o] = out[o + 1] = out[o + 2] = g;
    out[o + 3] = rgba[i + 3];
  }
  mkdirSync("public/examples", { recursive: true });
  const res = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 86, alphaQuality: 100 })
    .toFile("public/examples/portrait-cutout.webp");
  console.log(`wrote public/examples/portrait-cutout.webp ${res.width}x${res.height} (${Math.round(res.size / 1024)} KB, alpha ${res.channels === 4})`);
}
main();
