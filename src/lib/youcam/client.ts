import { z } from "zod";
import { env } from "@/lib/env";
import { parseTaskResponse, type ParsedTask } from "./adapter";

export class YoucamError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string, readonly transient = false) {
    super(message);
  }
}

const uploadInit = z.object({
  data: z.object({
    files: z
      .array(
        z.object({
          file_id: z.string(),
          requests: z.array(z.object({ url: z.string(), headers: z.record(z.string(), z.string()).optional() })).min(1),
        }),
      )
      .min(1),
  }),
});

const taskCreated = z.object({ data: z.object({ task_id: z.string() }) });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function call(path: string, init: RequestInit, attempts = 3): Promise<unknown> {
  const e = env();
  let last: YoucamError | undefined;
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(`${e.YOUCAM_BASE_URL}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${e.YOUCAM_API_KEY}`, "Content-Type": "application/json", ...init.headers },
    });
    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 200) };
    }
    if (res.ok) return body;
    const b = body as { error?: unknown; error_code?: unknown };
    const maybeCode = b?.error_code ?? b?.error;
    const code = typeof maybeCode === "string" ? maybeCode : undefined;
    const transient = res.status === 429 || res.status >= 500;
    last = new YoucamError(`YouCam ${res.status} on ${path}`, res.status, code, transient);
    if (!transient) throw last;
    await sleep(600 * 2 ** i);
  }
  throw last ?? new YoucamError("YouCam request failed", 500);
}

const MOCK_DELAY_MS = 5000;

/** Mock mode: a task id encodes its start time; the "result" is the bundled pre-generated example. */
function mockTask(taskId: string): ParsedTask {
  const started = Number(taskId.replace("mock-", ""));
  if (Date.now() - started < MOCK_DELAY_MS) return { status: "processing" };
  return { status: "success", resultUrl: "mock://pre-generated" };
}

/** Uploads bytes via YouCam's signed-URL flow and returns the provider file id. */
export async function uploadImage(bytes: Buffer, contentType: string, fileName: string): Promise<string> {
  if (env().YOUCAM_MOCK === "1") return `mock-file-${fileName}`;
  const init = uploadInit.parse(
    await call("/s2s/v2.0/file", {
      method: "POST",
      body: JSON.stringify({ files: [{ content_type: contentType, file_name: fileName, file_size: bytes.length }] }),
    }),
  );
  const file = init.data.files[0];
  const req = file.requests[0];
  const put = await fetch(req.url, {
    method: "PUT",
    headers: { "Content-Type": contentType, "Content-Length": String(bytes.length), ...req.headers },
    body: new Uint8Array(bytes),
  });
  if (!put.ok) throw new YoucamError(`Image upload failed (${put.status})`, put.status, undefined, put.status >= 500);
  return file.file_id;
}

/** One makeup effect object, shaped per the AI Makeup VTO docs (see effects.ts). */
export type MakeupEffect = { category: string } & Record<string, unknown>;

/** AI Makeup VTO: `effects` carries one effect entry; `src_file_id` is the uploaded selfie. */
export async function createMakeupTask(srcFileId: string, effect: MakeupEffect): Promise<string> {
  if (env().YOUCAM_MOCK === "1") return `mock-${Date.now()}`;
  const body = { src_file_id: srcFileId, version: "1.0", effects: [effect] };
  // Task creation is not idempotent: attempts=1 so a failure can never double-charge.
  const out = taskCreated.parse(await call("/s2s/v2.0/task/makeup-vto", { method: "POST", body: JSON.stringify(body) }, 1));
  return out.data.task_id;
}

export async function getMakeupTask(taskId: string): Promise<{ parsed: ParsedTask; raw: unknown }> {
  if (taskId.startsWith("mock-")) return { parsed: mockTask(taskId), raw: null };
  const raw = await call(`/s2s/v2.0/task/makeup-vto/${encodeURIComponent(taskId)}`, { method: "GET" });
  return { parsed: parseTaskResponse(raw), raw };
}
