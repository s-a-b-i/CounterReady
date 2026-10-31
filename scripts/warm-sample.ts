/* Usage: BASE=http://localhost:3000 npx tsx scripts/warm-sample.ts
 * Runs the bundled sample photo through every in-stock shade of every category via the app's own API (1 unit each, cached afterwards),
 * and saves each real YouCam result to public/examples/sample-<id>.jpg for mock mode and the landing page. */
import { mkdirSync, writeFileSync } from "node:fs";
import { CATALOGUE } from "../src/lib/catalogue";

const base = process.env.BASE ?? "http://localhost:3000";
let cookie = "";

async function json(path: string, init: RequestInit) {
  const res = await fetch(base + path, { ...init, headers: { ...(init.headers ?? {}), cookie } });
  const set = res.headers.getSetCookie?.() ?? [];
  if (set.length) cookie = set.map((c) => c.split(";")[0]).join("; ");
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function newUpload(): Promise<string> {
  cookie = "";
  const fd = new FormData();
  fd.set("consent", "true");
  fd.set("sample", "1");
  const up = await json("/api/upload", { method: "POST", body: fd });
  if (up.status !== 200) throw new Error(`upload failed: ${JSON.stringify(up.body)}`);
  return up.body.uploadId as string;
}

async function main() {
  mkdirSync("public/examples", { recursive: true });
  let uploadId = await newUpload();
  let live = 0;

  for (const p of CATALOGUE.filter((x) => x.inStock)) {
    // Rotate to a fresh session before the per-session cap, so warming never trips the guard.
    if (live >= 6) { uploadId = await newUpload(); live = 0; }
    const start = await json("/api/preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ uploadId, productId: p.id }) });
    if (start.status !== 200) { console.log(p.id, "start FAILED", start.status, JSON.stringify(start.body)); continue; }
    const id = start.body.previewId as string;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const s = await json(`/api/preview/${id}`, { method: "GET" });
      if (s.body.status === "success") {
        const img = await fetch(base + (s.body.imageUrl as string));
        writeFileSync(`public/examples/sample-${p.id}.jpg`, Buffer.from(await img.arrayBuffer()));
        if (!s.body.cached) live++;
        console.log(p.id, "saved", s.body.cached ? "(cached)" : "(live)");
        break;
      }
      if (s.body.status === "error") { console.log(p.id, "ERROR", JSON.stringify(s.body)); break; }
    }
  }
}
main();
