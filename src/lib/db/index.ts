import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Pooled (WebSocket) driver: the budget guard needs real interactive transactions,
// which the neon-http driver cannot provide.
const globalForDb = globalThis as unknown as { __pool?: Pool };

function pool(): Pool {
  if (!globalForDb.__pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    globalForDb.__pool = new Pool({ connectionString: url });
  }
  return globalForDb.__pool;
}

export const db = drizzle({ client: pool(), schema });
export * as tables from "./schema";
