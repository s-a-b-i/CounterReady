import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, tables } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

/** Streams a stored AI preview. Ids are unguessable UUIDs, so previews can be embedded safely. */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new Response("Not found", { status: 404 });
  const [row] = await db.select().from(tables.resultImages).where(eq(tables.resultImages.id, id));
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.bytes), {
    headers: { "Content-Type": row.mime, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
