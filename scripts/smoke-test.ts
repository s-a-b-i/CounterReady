/* Usage: npm run smoke -- path/to/selfie.jpg path/to/earring.png [scaleCm] */
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import { extname } from "node:path";

config({ path: ".env.local" });

const [selfiePath, earringPath, scaleArg] = process.argv.slice(2);
if (!selfiePath || !earringPath) {
  console.error("usage: npm run smoke -- <selfie> <earring> [scaleCm]");
  process.exit(1);
}

const mime = (p: string) => (extname(p).toLowerCase() === ".png" ? "image/png" : "image/jpeg");
const base = process.env.YOUCAM_BASE_URL ?? "https://yce-api-01.makeupar.com";
const headers = { Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`, "Content-Type": "application/json" };

type Json = { data?: { task_id?: string; task_status?: string; files?: { file_id: string; requests: { url: string; headers?: Record<string, string> }[] }[] } };

async function j(label: string, res: Response): Promise<Json> {
  const body = (await res.json().catch(() => ({}))) as Json;
  console.log(`\n== ${label} (${res.status})\n${JSON.stringify(body, null, 2)}`);
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
      body: JSON.stringify({ files: [{ content_type: mime(path), file_name: path.split(/[\\/]/).pop(), file_size: bytes.length }] }),
    }),
  );
  const f = init.data!.files![0];
  const put = await fetch(f.requests[0].url, {
    method: "PUT",
    headers: { "Content-Type": mime(path), ...f.requests[0].headers },
    body: bytes,
  });
  console.log(`PUT ${path} -> ${put.status}`);
  return f.file_id;
}

async function main() {
  const src = await upload(selfiePath);
  const ref = await upload(earringPath);
  const created = await j(
    "create earring task",
    await fetch(`${base}/s2s/v2.0/task/2d-vto/earring`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        src_file_id: src,
        ref_file_ids: [ref],
        source_info: { name: src },
        object_infos: [{ name: ref, parameter: { earring_scale: Number(scaleArg ?? 3), earring_is_right_ear: true } }],
      }),
    }),
  );
  const id = created.data!.task_id!;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const body = await j(`poll ${i}`, await fetch(`${base}/s2s/v2.0/task/2d-vto/earring/${id}`, { headers }));
    const s = body.data?.task_status;
    if (s === "success") {
      writeFileSync("fixtures/earring-success.json", JSON.stringify(body, null, 2));
      console.log("saved fixtures/earring-success.json");
      return;
    }
    if (s === "error") process.exit(1);
  }
  console.error("timed out");
  process.exit(1);
}
main();
