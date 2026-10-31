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

const MESSAGES: Record<string, string> = {
  PHOTO_DETECTION_FAIL: "We couldn't find an ear in your photo. Try a side-profile shot with your ear visible and hair tucked back.",
  PHOTO_CHECK_INVALID: "The pose or size of your photo doesn't work for try-on. Use a side profile, well lit, with the ear unobstructed.",
  OBJECT_DETECTION_FAIL: "We couldn't read the earring image. It needs to be a clear front view of a single earring.",
  INPUT_ERROR: "That image format isn't supported. Use a JPG or PNG under 10 MB.",
  INPUT_MAIN_IMAGE_EMPTY: "A photo is required to try on an earring.",
  RUNTIME_ERROR: "The try-on service hit an unexpected problem. Please try again.",
  RATE_LIMIT: "The try-on service is busy right now. Wait a few seconds and try again.",
  NO_RESULT: "The try-on finished but returned no image. Please try again.",
};

export function humanError(code?: string): string {
  return (code && MESSAGES[code]) || "Something went wrong generating this preview. Please try again.";
}
