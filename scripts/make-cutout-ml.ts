/* ML background removal for the hero portrait.
 * Usage: npx tsx scripts/make-cutout-ml.ts <input image> [out.png]
 * Output is a greyscale PNG with a transparent background (public/examples/portrait-cutout.png by default).
 *
 * The remover bundles its own sharp/libvips, which crashes if our sharp is loaded in the same process,
 * so the greyscale pass runs in a child process.
 */
import { removeBackground } from "@imgly/background-removal-node";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const GREY_STEP = `
const sharp = require("sharp");
const [src, out] = process.argv.slice(1);
(async () => {
  const alpha = await sharp(src).extractChannel(3).toBuffer();
  const gray = await sharp(src).removeAlpha().grayscale().linear(1.08, -6).toBuffer();
  const info = await sharp(gray).joinChannel(alpha).png({ compressionLevel: 9 }).toFile(out);
  console.log("wrote " + out + " (" + Math.round(info.size / 1024) + " KB)");
})();
`;

async function main() {
  const [input, out = "public/examples/portrait-cutout.png"] = process.argv.slice(2);
  if (!input) {
    console.error("usage: tsx scripts/make-cutout-ml.ts <input> [out.png]");
    process.exit(1);
  }
  const blob = await removeBackground(new Blob([new Uint8Array(readFileSync(input))], { type: /[.]png$/i.test(input) ? "image/png" : /[.]webp$/i.test(input) ? "image/webp" : "image/jpeg" }), {
    model: "medium",
    output: { format: "image/png" },
  });
  const tmp = path.resolve("test-results", "cutout-color.png");
  writeFileSync(tmp, Buffer.from(await blob.arrayBuffer()));
  console.log(execFileSync("node", ["-e", GREY_STEP, tmp, path.resolve(out)], { encoding: "utf8" }).trim());
}
main();
