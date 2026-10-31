/** Browser-only helpers. The selfie is downscaled here so uploads stay small and previews are all the same size. */

const MAX_SIDE = 1080;
const MIN_SIDE = 400;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export class PhotoProblem extends Error {}

export interface LoadedPhoto {
  dataUrl: string;
  width: number;
  height: number;
  source: "upload" | "sample";
}

/** Quick check before the file is read. The server re-validates by magic bytes. */
export function validatePhotoFile(f: { type: string; size: number }): string | null {
  if (!ACCEPTED_TYPES.includes(f.type)) return "Use a JPG or PNG photo.";
  if (f.size > MAX_FILE_BYTES) return "That photo is over 10 MB. Try a smaller one.";
  return null;
}

/** Applies EXIF orientation, caps the long side, returns a JPEG data URL plus its final size. */
export async function loadPhoto(file: Blob, source: LoadedPhoto["source"]): Promise<LoadedPhoto> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new PhotoProblem("We couldn't read that image. Try another JPG or PNG.");
  }
  try {
    if (Math.min(bitmap.width, bitmap.height) < MIN_SIDE) {
      throw new PhotoProblem(`That photo is too small. Use one at least ${MIN_SIDE}px on its short side.`);
    }
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new PhotoProblem("Your browser couldn't process that image.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.92), width, height, source };
  } finally {
    bitmap.close();
  }
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}
