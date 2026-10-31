import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { db, tables } = await import("../src/lib/db");
  const [s] = await db.insert(tables.sessions).values({}).returning();
  await db.transaction(async (tx) => {
    await tx.insert(tables.usageLedger).values({ sessionId: s.id, units: 1, kind: "probe" });
  });
  const ledger = await db.select().from(tables.usageLedger);
  const [img] = await db.insert(tables.resultImages).values({ mime: "image/png", bytes: Buffer.from([1, 2, 3, 255]) }).returning();
  console.log("transaction ok; ledger rows:", ledger.length, "| bytea roundtrip:", [...img.bytes]);
  await db.delete(tables.sessions);
  await db.delete(tables.resultImages);
  process.exit(0);
}
main();
