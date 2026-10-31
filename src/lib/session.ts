import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, tables } from "@/lib/db";

const COOKIE = "sp_session";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function readSessionId(): Promise<string | null> {
  const v = (await cookies()).get(COOKIE)?.value;
  return v && UUID.test(v) ? v : null;
}

/** Returns the anonymous session, creating it (and setting the httpOnly cookie) when absent. */
export async function getOrCreateSession(): Promise<{ id: string; preferences: Record<string, unknown> }> {
  const existing = await readSessionId();
  if (existing) {
    const [row] = await db.select().from(tables.sessions).where(eq(tables.sessions.id, existing));
    if (row) return { id: row.id, preferences: row.preferences };
  }
  const [created] = await db.insert(tables.sessions).values({}).returning();
  (await cookies()).set(COOKIE, created.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { id: created.id, preferences: created.preferences };
}
