/* Builds a transparent-background portrait for the landing hero by flood-filling the bright sky from the edges. */
import sharp from "sharp";

const THRESH = Number(process.argv[2] ?? 200);

async function main() {
  const { data, info } = await sharp("public/examples/pre-generated-tryon.jpg")
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const bg = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    const i = y * w + x;
    if (!bg[i] && data[i] >= THRESH) { bg[i] = 1; stack.push(i); }
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  const alpha = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = bg[i] ? 0 : 255;
  const soft = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } }).blur(1.4).threshold(128).blur(0.8).extractChannel(0).raw().toBuffer();
  const gray = await sharp("public/examples/pre-generated-tryon.jpg").grayscale().linear(1.1, -8).raw().toBuffer();
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = gray[i];
    rgba[i * 4 + 3] = soft[i];
  }
  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toFile("public/examples/portrait-cutout.png");
  console.log(`cutout ${w}x${h}, threshold ${THRESH}`);
}
main();
