import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
/** YouCam needs a face at least 100 px wide; a 400 px short side keeps a normal selfie comfortably above that. */
export const MIN_SIDE_PX = 400;
/** YouCam's documented limit is "long side < 1920"; we cap at 1080, which also keeps every preview the same size. */
export const MAX_SIDE_PX = 1080;

export type SniffedType = "image/jpeg" | "image/png";

/** Identify JPEG/PNG by magic bytes, never by the client-supplied MIME type. */
export function sniffImageType(b: Buffer): SniffedType | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  return null;
}

export class ImageProblem extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
  }
}

/**
 * Validates and normalises a selfie: type by magic bytes, orientation applied, EXIF stripped,
 * long side capped. These exact bytes are what YouCam receives, so every shade is applied to the same image.
 */
export async function prepareSelfie(bytes: Buffer): Promise<Buffer> {
  if (bytes.length > MAX_UPLOAD_BYTES) throw new ImageProblem("That photo is over 10 MB. Try a smaller one.", "TOO_LARGE");
  if (!sniffImageType(bytes)) throw new ImageProblem("Only JPG or PNG photos are supported.", "BAD_TYPE");
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(bytes).metadata();
  } catch {
    throw new ImageProblem("We couldn't read that image. Try another photo.", "UNREADABLE");
  }
  const oriented = meta.orientation && meta.orientation >= 5;
  const w = oriented ? meta.height ?? 0 : meta.width ?? 0;
  const h = oriented ? meta.width ?? 0 : meta.height ?? 0;
  if (Math.min(w, h) < MIN_SIDE_PX) throw new ImageProblem(`That photo is too small. Use one at least ${MIN_SIDE_PX}px on its short side.`, "TOO_SMALL");
  return sharp(bytes)
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize({ width: MAX_SIDE_PX, height: MAX_SIDE_PX, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toBuffer();
}

/** Compresses a provider result for storage in Postgres (target well under 1 MB). */
export async function compressResult(bytes: Buffer): Promise<{ mime: string; bytes: Buffer }> {
  for (const [width, quality] of [[1080, 88], [1080, 80], [900, 72]] as const) {
    const out = await sharp(bytes).resize({ width, withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toBuffer();
    if (out.length <= 1_000_000) return { mime: "image/jpeg", bytes: out };
  }
  const out = await sharp(bytes).resize({ width: 800 }).jpeg({ quality: 60 }).toBuffer();
  return { mime: "image/jpeg", bytes: out };
}
