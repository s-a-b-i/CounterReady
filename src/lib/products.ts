import { asc, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";

export type Product = typeof tables.products.$inferSelect;

export async function listProducts(): Promise<Product[]> {
  return db.select().from(tables.products).orderBy(asc(tables.products.priceCents));
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const [row] = await db.select().from(tables.products).where(eq(tables.products.id, id));
  return row;
}
