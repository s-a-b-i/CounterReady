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
    const maybeCode = (body as { error?: unknown })?.error;
    const code = typeof maybeCode === "string" ? maybeCode : undefined;
    const transient = res.status === 429 || res.status >= 500;
    last = new YoucamError(`YouCam ${res.status} on ${path}`, res.status, code, transient);
    if (!transient) throw last;
    await sleep(600 * 2 ** i);
  }
  throw last ?? new YoucamError("YouCam request failed", 500);
}

/** Uploads bytes via YouCam's signed-URL flow and returns the provider file id. */
export async function uploadImage(bytes: Buffer, contentType: string, fileName: string): Promise<string> {
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

export interface EarringTaskInput {
  srcFileId: string;
  refFileId: string;
  earringScaleCm: number;
  isRightEar?: boolean;
}

export async function createEarringTask(input: EarringTaskInput): Promise<string> {
  const body = {
    src_file_id: input.srcFileId,
    ref_file_ids: [input.refFileId],
    source_info: { name: input.srcFileId },
    object_infos: [
      { name: input.refFileId, parameter: { earring_scale: input.earringScaleCm, earring_is_right_ear: input.isRightEar ?? true } },
    ],
  };
  // Task creation is not idempotent: attempts=1 so a failure can never double-charge.
  const out = taskCreated.parse(
    await call("/s2s/v2.0/task/2d-vto/earring", { method: "POST", body: JSON.stringify(body) }, 1),
  );
  return out.data.task_id;
}

export async function getEarringTask(taskId: string): Promise<{ parsed: ParsedTask; raw: unknown }> {
  const raw = await call(`/s2s/v2.0/task/2d-vto/earring/${encodeURIComponent(taskId)}`, { method: "GET" });
  return { parsed: parseTaskResponse(raw), raw };
}
