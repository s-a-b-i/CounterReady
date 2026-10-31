import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, tables } from "@/lib/db";
import { readSessionId } from "@/lib/session";

const body = z.object({
  decisions: z
    .array(
      z.object({
        productId: z.string().uuid(),
        tryonId: z.string().uuid().nullable(),
        verdict: z.enum(["buy", "maybe", "skip"]),
        reason: z.string().max(200).default(""),
      }),
    )
    .min(1)
    .max(3),
});

/** Saves the verdicts for a shortlist under one share slug and returns the public card URL. */
export async function POST(req: Request) {
  const sessionId = await readSessionId();
  if (!sessionId) return Response.json({ error: "No session" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid decisions" }, { status: 400 });

  const slug = randomBytes(6).toString("base64url");
  for (const d of parsed.data.decisions) {
    if (d.tryonId) {
      const [t] = await db
        .select({ id: tables.tryons.id })
        .from(tables.tryons)
        .where(and(eq(tables.tryons.id, d.tryonId), eq(tables.tryons.sessionId, sessionId)));
      if (!t) return Response.json({ error: "Unknown try-on" }, { status: 400 });
    }
  }
  await db.insert(tables.decisions).values(
    parsed.data.decisions.map((d) => ({ sessionId, productId: d.productId, tryonId: d.tryonId, verdict: d.verdict, reason: d.reason, shareSlug: slug })),
  );
  return Response.json({ slug, url: `/d/${slug}` });
}
