import { count } from "drizzle-orm";
import { db, tables } from "@/lib/db";

export async function GET() {
  try {
    const [row] = await db.select({ n: count() }).from(tables.products);
    return Response.json({ ok: true, db: "up", products: row.n });
  } catch {
    return Response.json({ ok: false, db: "down" }, { status: 503 });
  }
}
