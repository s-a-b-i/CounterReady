import { config } from "dotenv";

config({ path: ".env.local" });

/** Removes all sessions/try-ons/images created by local testing; records real units spent by hand. */
async function main() {
  const { db, tables } = await import("../src/lib/db");
  await db.delete(tables.sessions);
  await db.delete(tables.resultImages);
  const realUnits = Number(process.argv[2] ?? 0);
  if (realUnits > 0) {
    const [s] = await db.insert(tables.sessions).values({ preferences: { system: true } }).returning({ id: tables.sessions.id });
    await db.insert(tables.usageLedger).values({ sessionId: s.id, units: realUnits, kind: "manual_smoke_test" });
  }
  console.log(`cleaned; recorded ${realUnits} real unit(s)`);
  process.exit(0);
}
main();
