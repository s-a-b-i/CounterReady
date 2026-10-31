import { config } from "dotenv";
import { Pool } from "@neondatabase/serverless";

config({ path: ".env.local" });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query("drop table if exists decisions, usage_ledger, tryons, generations, previews, uploads, result_images, sessions, products cascade");
  await pool.end();
  console.log("dropped old tables");
}
main();
