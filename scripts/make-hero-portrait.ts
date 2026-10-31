/* Usage: npx tsx scripts/make-hero-portrait.ts "<cut-out PNG with transparent background>"
 * Writes public/examples/portrait-cutout.webp: a greyscale RGBA version for the black-and-white hero.
 * The soft fade at the cropped right shoulder and at the bottom is baked into the alpha channel. A CSS mask
 * is avoided on purpose: some browsers draw a hairline at a masked element's edge.
 * Built from explicit RGBA bytes because a two-channel sharp pipeline drops the alpha channel. */
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const smooth = (t: number) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

async function main() {
  const src = process.argv[2];
  if (!src) {
    console.error('usage: tsx scripts/make-hero-portrait.ts "<cut-out.png>"');
    process.exit(1);
  }
  const { data: rgba, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, o = 0; i < rgba.length; i += 4, o += 4) {
    const px = i / 4;
    const x = (px % info.width) / info.width;
    const y = Math.floor(px / info.width) / info.height;
    // Fully clear from 96% across, so nothing opaque touches the image's right edge.
    const fade = (1 - smooth((x - 0.86) / 0.1)) * (1 - smooth((y - 0.8) / 0.2));
    const luma = 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
    const g = Math.max(0, Math.min(255, Math.round(luma * 1.08 - 6)));
    out[o] = out[o + 1] = out[o + 2] = g;
    out[o + 3] = Math.round(rgba[i + 3] * fade);
  }
  mkdirSync("public/examples", { recursive: true });
  const res = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 86, alphaQuality: 100 })
    .toFile("public/examples/portrait-cutout.webp");
  console.log(`wrote public/examples/portrait-cutout.webp ${res.width}x${res.height} (${Math.round(res.size / 1024)} KB, alpha ${res.channels === 4})`);
}
main();
