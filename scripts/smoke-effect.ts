/* Usage: npm run smoke:effect -- <selfie> <effect JSON> [out.jpg]
 * Live AI Makeup VTO round trip with one effect (costs 1 unit). Prints each step and saves the real response as a fixture. */
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import { extname } from "node:path";

config({ path: ".env.local" });

const [selfiePath, effectJson, outPath = "fixtures/inputs/effect-result.jpg"] = process.argv.slice(2);
if (!selfiePath || !effectJson) {
  console.error("usage: npm run smoke:effect -- <selfie> <effect JSON> [out]");
  process.exit(1);
}

const mime = (p: string) => (extname(p).toLowerCase() === ".png" ? "image/png" : "image/jpeg");
const base = process.env.YOUCAM_BASE_URL ?? "https://yce-api-01.makeupar.com";
const headers = { Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`, "Content-Type": "application/json" };

type Json = { data?: { task_id?: string; task_status?: string; error?: string; results?: { url?: string }; files?: { file_id: string; requests: { url: string; headers?: Record<string, string> }[] }[] } };

async function j(label: string, res: Response): Promise<Json> {
  const body = (await res.json().catch(() => ({}))) as Json;
  console.log(`\n== ${label} (${res.status})\n${JSON.stringify(body, null, 2).slice(0, 1500)}`);
  if (!res.ok) process.exit(1);
  return body;
}

async function upload(path: string): Promise<string> {
  const bytes = readFileSync(path);
  const init = await j(
    `init upload ${path}`,
    await fetch(`${base}/s2s/v2.0/file`, {
      method: "POST",
      headers,
      body: JSON.stringify({ files: [{ content_type: mime(path), file_name: path.split(/[\/]/).pop(), file_size: bytes.length }] }),
    }),
  );
  const f = init.data!.files![0];
  const put = await fetch(f.requests[0].url, { method: "PUT", headers: { "Content-Type": mime(path), ...f.requests[0].headers }, body: bytes });
  console.log(`PUT ${path} -> ${put.status}`);
  return f.file_id;
}

async function main() {
  const src = await upload(selfiePath);
  const created = await j(
    "create makeup-vto task",
    await fetch(`${base}/s2s/v2.0/task/makeup-vto`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        src_file_id: src,
        version: "1.0",
        effects: [JSON.parse(effectJson)],
      }),
    }),
  );
  const taskId = created.data!.task_id!;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${base}/s2s/v2.0/task/makeup-vto/${encodeURIComponent(taskId)}`, { headers });
    const body = (await res.json()) as Json;
    console.log(`poll ${i + 1}: ${res.status} ${body.data?.task_status ?? ""}`);
    if (body.data?.task_status === "success") {
      writeFileSync("fixtures/makeup-success.json", JSON.stringify(body, null, 2));
      const img = await fetch(body.data.results!.url!);
      writeFileSync(outPath, Buffer.from(await img.arrayBuffer()));
      console.log("saved", outPath, "and fixtures/makeup-success.json");
      return;
    }
    if (body.data?.task_status === "error") {
      console.log(JSON.stringify(body, null, 2));
      process.exit(2);
    }
  }
  console.log("timed out");
  process.exit(3);
}
main();
