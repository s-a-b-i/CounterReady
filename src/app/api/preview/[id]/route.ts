import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { db, tables } from "@/lib/db";
import { compressResult } from "@/lib/images";
import { readSessionId } from "@/lib/session";
import { getMakeupTask } from "@/lib/youcam/client";
import { humanError } from "@/lib/youcam/errors";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

function view(row: typeof tables.previews.$inferSelect) {
  if (row.status === "success" && row.resultImageId) {
    return { status: "success", previewId: row.id, imageUrl: `/api/images/${row.resultImageId}`, cached: row.unitsSpent === 0 };
  }
  if (row.status === "error") return { status: "error", previewId: row.id, message: row.error ?? humanError() };
  return { status: "processing", previewId: row.id };
}

async function fetchResult(url: string, productId: string): Promise<Buffer> {
  if (url.startsWith("mock://")) {
    // Mock mode returns a bundled real YouCam result for this product (fallback: the first one).
    for (const name of [`sample-${productId}.jpg`, "sample-cr-04.jpg"]) {
      try {
        return await readFile(path.join(process.cwd(), "public", "examples", name));
      } catch {
        /* try next */
      }
    }
    throw new Error("no bundled mock result");
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`result download ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Polled by the client. On provider success, downloads the (expiring) result and stores it. */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return Response.json({ error: "Not found" }, { status: 404 });
  const sessionId = await readSessionId();
  const [row] = await db.select().from(tables.previews).where(eq(tables.previews.id, id));
  if (!row || row.sessionId !== sessionId) return Response.json({ error: "Not found" }, { status: 404 });

  if (row.status === "success" || row.status === "error" || !row.taskId) return Response.json(view(row));

  try {
    const { parsed } = await getMakeupTask(row.taskId);
    if (parsed.status === "processing") return Response.json(view(row));

    if (parsed.status === "error") {
      // Provider-side failures keep their unit spent (conservative for the shared demo budget).
      const message = humanError(parsed.errorCode);
      const [updated] = await db.update(tables.previews).set({ status: "error", error: message }).where(eq(tables.previews.id, id)).returning();
      return Response.json({ ...view(updated), code: parsed.errorCode });
    }

    const stored = await compressResult(await fetchResult(parsed.resultUrl!, row.productId));
    const [img] = await db.insert(tables.resultImages).values(stored).returning({ id: tables.resultImages.id });
    const [updated] = await db.update(tables.previews).set({ status: "success", resultImageId: img.id }).where(eq(tables.previews.id, id)).returning();
    return Response.json(view(updated));
  } catch (err) {
    // Transient provider/network trouble: leave the row as-is so the client simply polls again.
    console.error("preview poll failed", err instanceof Error ? err.message : err);
    return Response.json(view(row));
  }
}
