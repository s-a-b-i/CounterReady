import { createHash } from "node:crypto";

export function photoHash(photo: Buffer): string {
  return createHash("sha256").update(photo).digest("hex");
}

/** Cache key: the same photo with the same product and effect settings always maps to the same preview. */
export function previewHash(photoDigest: string, productId: string, effect: unknown): string {
  return createHash("sha256").update(photoDigest).update("\0").update(productId).update("\0").update(JSON.stringify(effect)).digest("hex");
}
