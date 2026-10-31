import { createHash } from "node:crypto";

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;
}

/** Cache key: selfie bytes + product + declared scale + params. */
export function tryonHash(selfie: Buffer, productId: string, earringScaleCm: number, params: Record<string, unknown> = {}): string {
  return createHash("sha256")
    .update(selfie)
    .update("\0")
    .update(productId)
    .update("\0")
    .update(String(earringScaleCm))
    .update("\0")
    .update(stable(params))
    .digest("hex");
}
