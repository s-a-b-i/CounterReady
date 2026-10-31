import { listProducts } from "@/lib/products";

export async function GET() {
  return Response.json({ products: await listProducts() });
}
