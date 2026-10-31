import { z } from "zod";

export type TaskStatus = "processing" | "success" | "error";

export interface ParsedTask {
  status: TaskStatus;
  resultUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

const looseObj = z.record(z.string(), z.unknown());

function pickUrl(results: unknown): string | undefined {
  if (!results) return undefined;
  if (typeof results === "string") return results;
  if (Array.isArray(results)) {
    for (const r of results) {
      const u = pickUrl(r);
      if (u) return u;
    }
    return undefined;
  }
  const parsed = looseObj.safeParse(results);
  if (!parsed.success) return undefined;
  for (const key of ["url", "download_url", "downloadUrl"]) {
    const v = parsed.data[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

/** Tolerates `results.url`, `results[].download_url` and a few other observed shapes. */
export function parseTaskResponse(raw: unknown): ParsedTask {
  const root = looseObj.safeParse(raw);
  if (!root.success) return { status: "error", errorCode: "BAD_RESPONSE", errorMessage: "Unreadable provider response" };
  const data = looseObj.safeParse(root.data.data ?? root.data);
  const d = data.success ? data.data : {};
  const rawStatus = String(d.task_status ?? d.status ?? "").toLowerCase();

  if (rawStatus === "success" || rawStatus === "succeeded" || rawStatus === "completed") {
    const resultUrl = pickUrl(d.results ?? d.result);
    if (!resultUrl) return { status: "error", errorCode: "NO_RESULT", errorMessage: "Provider reported success but returned no image" };
    return { status: "success", resultUrl };
  }
  if (rawStatus === "error" || rawStatus === "failed" || rawStatus === "fail") {
    const code = typeof d.error === "string" ? d.error : typeof d.error_code === "string" ? d.error_code : "RUNTIME_ERROR";
    const msg = typeof d.error_message === "string" ? d.error_message : undefined;
    return { status: "error", errorCode: code, errorMessage: msg };
  }
  return { status: "processing" };
}

