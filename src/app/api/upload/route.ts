import { z } from "zod";
import { db, tables } from "@/lib/db";
import { photoHash } from "@/lib/hash";
import { ImageProblem, prepareSelfie } from "@/lib/images";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { getOrCreateSession } from "@/lib/session";
import { uploadImage, YoucamError } from "@/lib/youcam/client";
import { humanError } from "@/lib/youcam/errors";

export const maxDuration = 60;

const SAMPLE_PATH = "/sample-photos/sample-1.jpg";

const form = z.object({ consent: z.literal("true"), sample: z.enum(["1"]).optional() });

function fail(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

/**
 * Sends the shopper's photo to YouCam once and returns an upload id. Every shade is then applied to this same
 * provider file. The photo is held in memory for this request only; we store the provider file id and a hash, never pixels.
 */
export async function POST(req: Request) {
  const session = await getOrCreateSession();
  if (!rateLimit(`ip:${clientIp(req)}`, 12, 60_000) || !rateLimit(`sess:${session.id}`, 6, 60_000)) {
    return fail(429, "RATE_LIMIT", "You're going a little fast. Wait a moment and try again.");
  }

  let data: FormData;
  try {
    data = await req.formData();
  } catch {
    return fail(400, "BAD_FORM", "We couldn't read that upload.");
  }
  const fields = form.safeParse({ consent: data.get("consent"), sample: data.get("sample") ?? undefined });
  if (!fields.success) return fail(400, "NO_CONSENT", "Please tick the consent box before we send your photo for the preview.");

  let raw: Buffer;
  if (fields.data.sample) {
    // Sample route: read the bundled file server-side so its hash (and therefore the result cache) is stable.
    const res = await fetch(new URL(SAMPLE_PATH, req.url));
    if (!res.ok) return fail(500, "NO_SAMPLE", "The sample photo isn't available right now.");
    raw = Buffer.from(await res.arrayBuffer());
  } else {
    const file = data.get("photo");
    if (!(file instanceof File)) return fail(400, "BAD_INPUT", "A photo is required.");
    raw = Buffer.from(await file.arrayBuffer());
  }

  let photo: Buffer;
  try {
    photo = await prepareSelfie(raw);
  } catch (err) {
    if (err instanceof ImageProblem) return fail(422, err.code, err.message);
    throw err;
  }

  try {
    const fileId = await uploadImage(photo, "image/jpeg", "selfie.jpg");
    const [row] = await db.insert(tables.uploads).values({ sessionId: session.id, fileId, photoHash: photoHash(photo) }).returning({ id: tables.uploads.id });
    return Response.json({ uploadId: row.id });
  } catch (err) {
    if (err instanceof YoucamError) {
      const code = err.status === 429 ? "RATE_LIMIT" : err.transient ? "RUNTIME_ERROR" : (err.code ?? "RUNTIME_ERROR");
      return fail(err.status === 429 ? 429 : 502, code, humanError(code));
    }
    console.error("upload failed", err instanceof Error ? err.message : err);
    return fail(502, "RUNTIME_ERROR", humanError("RUNTIME_ERROR"));
  }
}
