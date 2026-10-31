import { and, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { db, tables } from "@/lib/db";
import { tryonHash } from "@/lib/hash";
import { ImageProblem, prepareReference, prepareSelfie } from "@/lib/images";
import { refundUnits, reserveUnits } from "@/lib/ledger";
import { getProduct } from "@/lib/products";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { getOrCreateSession } from "@/lib/session";
import { createEarringTask, uploadImage, YoucamError } from "@/lib/youcam/client";
import { humanError } from "@/lib/youcam/adapter";

export const maxDuration = 60;

const form = z.object({
  productId: z.string().uuid(),
  isRightEar: z.enum(["true", "false"]).default("true"),
});

function fail(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

async function loadReference(imageUrl: string, origin: string): Promise<Buffer> {
  const url = imageUrl.startsWith("/") ? new URL(imageUrl, origin).toString() : imageUrl;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`reference image ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function POST(req: Request) {
  const session = await getOrCreateSession();
  if (!rateLimit(`ip:${clientIp(req)}`, 20, 60_000) || !rateLimit(`sess:${session.id}`, 8, 60_000)) {
    return fail(429, "RATE_LIMIT", "You're going a little fast. Wait a moment and try again.");
  }

  let data: FormData;
  try {
    data = await req.formData();
  } catch {
    return fail(400, "BAD_FORM", "We couldn't read that upload.");
  }
  const fields = form.safeParse({ productId: data.get("productId"), isRightEar: data.get("isRightEar") ?? undefined });
  const file = data.get("selfie");
  if (!fields.success || !(file instanceof File)) return fail(400, "BAD_INPUT", "A photo and a product are required.");

  const product = await getProduct(fields.data.productId);
  if (!product) return fail(404, "NO_PRODUCT", "That product no longer exists.");

  let selfie: Buffer;
  try {
    selfie = await prepareSelfie(Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    if (err instanceof ImageProblem) return fail(422, err.code, err.message);
    throw err;
  }

  const params = { earring_is_right_ear: fields.data.isRightEar === "true" };
  const inputHash = tryonHash(selfie, product.id, product.referenceScaleCm, params);

  // Cache: an identical successful try-on is reused at zero cost.
  const [hit] = await db
    .select()
    .from(tables.tryons)
    .where(and(eq(tables.tryons.inputHash, inputHash), eq(tables.tryons.status, "success"), isNotNull(tables.tryons.resultImageId)))
    .limit(1);
  if (hit) {
    const [row] = await db
      .insert(tables.tryons)
      .values({ sessionId: session.id, productId: product.id, inputHash, params, status: "success", resultImageId: hit.resultImageId, unitsSpent: 0 })
      .returning({ id: tables.tryons.id });
    return Response.json({ tryonId: row.id, cached: true });
  }

  const reservation = await reserveUnits({ sessionId: session.id, productId: product.id, inputHash, params });
  if (!reservation.decision.ok || !reservation.tryonId) {
    const d = reservation.decision;
    return fail(429, d.ok ? "BUDGET" : d.reason, d.ok ? "Budget unavailable" : d.message);
  }
  const tryonId = reservation.tryonId;

  try {
    const [srcFileId, refFileId] = await Promise.all([
      uploadImage(selfie, "image/jpeg", "selfie.jpg"),
      loadReference(product.imageUrl, new URL(req.url).origin).then(prepareReference).then((b) => uploadImage(b, "image/png", "earring.png")),
    ]);
    // `selfie` is only ever held in memory for this request; it is never written anywhere.
    const taskId = await createEarringTask({
      srcFileId,
      refFileId,
      earringScaleCm: product.referenceScaleCm,
      isRightEar: params.earring_is_right_ear,
    });
    await db.update(tables.tryons).set({ taskId, status: "processing" }).where(eq(tables.tryons.id, tryonId));
    return Response.json({ tryonId, cached: false });
  } catch (err) {
    await refundUnits(tryonId, session.id, err instanceof Error ? err.message : "failed");
    if (err instanceof YoucamError) {
      const code = err.status === 429 ? "RATE_LIMIT" : err.transient ? "RUNTIME_ERROR" : (err.code ?? "RUNTIME_ERROR");
      return fail(err.status === 429 ? 429 : 502, code, humanError(code));
    }
    console.error("tryon create failed", err instanceof Error ? err.message : err);
    return fail(502, "RUNTIME_ERROR", humanError("RUNTIME_ERROR"));
  }
}

