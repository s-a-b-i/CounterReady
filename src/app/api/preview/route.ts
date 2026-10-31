import { and, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { getProduct } from "@/lib/catalogue";
import { db, tables } from "@/lib/db";
import { previewHash } from "@/lib/hash";
import { refundUnits, reserveUnits } from "@/lib/ledger";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { getOrCreateSession } from "@/lib/session";
import { createMakeupTask, YoucamError } from "@/lib/youcam/client";
import { humanError } from "@/lib/youcam/errors";
import { makeupEffect } from "@/lib/youcam/effects";

export const maxDuration = 60;

const body = z.object({ uploadId: z.string().uuid(), productId: z.string().min(1).max(40) });

function fail(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

/** Starts one preview: one product shade applied to the original uploaded photo (never to another preview). */
export async function POST(req: Request) {
  const session = await getOrCreateSession();
  if (!rateLimit(`ip:${clientIp(req)}`, 30, 60_000) || !rateLimit(`sess:${session.id}`, 12, 60_000)) {
    return fail(429, "RATE_LIMIT", "You're going a little fast. Wait a moment and try again.");
  }

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "BAD_INPUT", "A photo and a product are required.");
  const product = getProduct(parsed.data.productId);
  if (!product) return fail(404, "NO_PRODUCT", "That product isn't in the catalogue.");
  if (!product.inStock) return fail(409, "OUT_OF_STOCK", "That shade is out of stock in the sample catalogue.");

  const [upload] = await db.select().from(tables.uploads).where(eq(tables.uploads.id, parsed.data.uploadId));
  if (!upload || upload.sessionId !== session.id) return fail(404, "NO_UPLOAD", "Your photo session expired. Please upload the photo again.");

  const effect = makeupEffect(product);
  const inputHash = previewHash(upload.photoHash, product.id, effect);

  // Cache: an identical successful preview is reused at zero cost.
  const [hit] = await db
    .select()
    .from(tables.previews)
    .where(and(eq(tables.previews.inputHash, inputHash), eq(tables.previews.status, "success"), isNotNull(tables.previews.resultImageId)))
    .limit(1);
  if (hit) {
    const [row] = await db
      .insert(tables.previews)
      .values({ sessionId: session.id, productId: product.id, inputHash, status: "success", resultImageId: hit.resultImageId, unitsSpent: 0 })
      .returning({ id: tables.previews.id });
    return Response.json({ previewId: row.id, cached: true });
  }

  const reservation = await reserveUnits({ sessionId: session.id, productId: product.id, inputHash });
  if (!reservation.decision.ok || !reservation.previewId) {
    const d = reservation.decision;
    return fail(429, d.ok ? "BUDGET" : d.reason, d.ok ? "Budget unavailable" : d.message);
  }
  const previewId = reservation.previewId;

  try {
    const taskId = await createMakeupTask(upload.fileId, effect);
    await db.update(tables.previews).set({ taskId, status: "processing" }).where(eq(tables.previews.id, previewId));
    return Response.json({ previewId, cached: false });
  } catch (err) {
    // The task was never created, so nothing was charged upstream: give the unit back.
    await refundUnits(previewId, session.id, err instanceof Error ? err.message : "failed");
    if (err instanceof YoucamError) {
      const code = err.status === 429 ? "RATE_LIMIT" : err.transient ? "RUNTIME_ERROR" : (err.code ?? "RUNTIME_ERROR");
      return fail(err.status === 429 ? 429 : 502, code, humanError(code));
    }
    console.error("preview create failed", err instanceof Error ? err.message : err);
    return fail(502, "RUNTIME_ERROR", humanError("RUNTIME_ERROR"));
  }
}
