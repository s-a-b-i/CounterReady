import { describe, expect, it } from "vitest";
import fixture from "../../fixtures/earring-success.json";
import { evaluateBudget } from "@/lib/budget";
import { fitToBrief, matchesBrief } from "@/lib/fit";
import { tryonHash } from "@/lib/hash";
import { sniffImageType } from "@/lib/images";
import { humanError, parseTaskResponse } from "@/lib/youcam/adapter";

describe("response adapter", () => {
  it("parses the real success fixture (results.url)", () => {
    const p = parseTaskResponse(fixture);
    expect(p.status).toBe("success");
    expect(p.resultUrl).toMatch(/^https:\/\//);
  });
  it("tolerates results[].download_url", () => {
    const p = parseTaskResponse({ data: { task_status: "success", results: [{ download_url: "https://x/y.png" }] } });
    expect(p).toEqual({ status: "success", resultUrl: "https://x/y.png" });
  });
  it("treats running as processing and maps errors", () => {
    expect(parseTaskResponse({ data: { task_status: "running", results: null } }).status).toBe("processing");
    const e = parseTaskResponse({ data: { task_status: "error", error: "PHOTO_DETECTION_FAIL" } });
    expect(e.status).toBe("error");
    expect(humanError(e.errorCode)).toMatch(/ear/);
  });
  it("flags success without a result image", () => {
    expect(parseTaskResponse({ data: { task_status: "success", results: {} } }).errorCode).toBe("NO_RESULT");
  });
});

describe("cache hash", () => {
  const a = Buffer.from("selfie");
  it("is stable and key-order independent", () => {
    expect(tryonHash(a, "p1", 2, { x: 1, y: 2 })).toBe(tryonHash(a, "p1", 2, { y: 2, x: 1 }));
  });
  it("changes with any input", () => {
    const base = tryonHash(a, "p1", 2);
    expect(tryonHash(Buffer.from("other"), "p1", 2)).not.toBe(base);
    expect(tryonHash(a, "p2", 2)).not.toBe(base);
    expect(tryonHash(a, "p1", 3)).not.toBe(base);
    expect(tryonHash(a, "p1", 2, { left: true })).not.toBe(base);
  });
});

describe("budget guard", () => {
  const base = { totalUnitsUsed: 0, sessionTryons: 0, cost: 1, maxUnitsTotal: 850, maxTryonsPerSession: 6 };
  it("allows within caps", () => expect(evaluateBudget(base).ok).toBe(true));
  it("blocks at the per-session cap", () => {
    const d = evaluateBudget({ ...base, sessionTryons: 6 });
    expect(d.ok === false && d.reason).toBe("SESSION_CAP");
  });
  it("blocks when the global cap would be exceeded", () => {
    expect(evaluateBudget({ ...base, totalUnitsUsed: 850 }).ok).toBe(false);
    expect(evaluateBudget({ ...base, totalUnitsUsed: 849 }).ok).toBe(true);
  });
});

describe("fit to brief", () => {
  const heavy = { priceCents: 3900, dropLengthCm: 8.5, fastening: "post", material: "Gold-tone alloy", returnWindowDays: 0, finalSale: true, styleTags: ["glam"] };
  const stud = { priceCents: 4800, dropLengthCm: 0.8, fastening: "post", material: "925 sterling silver", returnWindowDays: 60, finalSale: false, styleTags: ["minimal"] };
  it("counts met criteria out of applicable ones", () => {
    const r = fitToBrief(stud, { budget: 60, maxDropCm: 3, fastening: "post", material: "silver" });
    expect(r.met).toBe(5);
    expect(r.applicable).toBe(5);
  });
  it("marks final sale and long drops as misses", () => {
    const r = fitToBrief(heavy, { budget: 60, maxDropCm: 3 });
    expect(r.criteria.find((c) => c.key === "returns")?.status).toBe("miss");
    expect(r.criteria.find((c) => c.key === "length")?.status).toBe("miss");
  });
  it("ignores unset criteria", () => {
    expect(fitToBrief(stud, {}).applicable).toBe(1); // returns always applies
  });
  it("filters the catalogue", () => {
    expect(matchesBrief(heavy, { maxDropCm: 3 })).toBe(false);
    expect(matchesBrief(stud, { maxDropCm: 3, occasion: "minimal" })).toBe(true);
  });
});

describe("magic byte sniffing", () => {
  it("detects jpeg and png, rejects others", () => {
    expect(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe("image/png");
    expect(sniffImageType(Buffer.from("GIF89a....."))).toBeNull();
  });
});

import { rowWinners } from "@/lib/fit";

describe("compare row winners", () => {
  const mk = (id: string, o: object) => ({ id, priceCents: 5000, dropLengthCm: 2, weightG: 3, fastening: "post", material: "silver", returnWindowDays: 30, finalSale: false, styleTags: [], ...o });
  const a = mk("a", { priceCents: 3000, weightG: 8, dropLengthCm: 7, finalSale: true });
  const b = mk("b", { priceCents: 6000, weightG: 1, dropLengthCm: 2.5, returnWindowDays: 60 });
  it("picks cheapest, lightest, longest returns", () => {
    expect([...rowWinners("price", [a, b], {})]).toEqual(["a"]);
    expect([...rowWinners("weight", [a, b], {})]).toEqual(["b"]);
    expect([...rowWinners("returns", [a, b], {})]).toEqual(["b"]);
  });
  it("judges drop length against the brief limit", () => {
    expect([...rowWinners("drop", [a, b], { maxDropCm: 3 })]).toEqual(["b"]);
  });
  it("only highlights fastening when the brief asks", () => {
    expect(rowWinners("fastening", [a, b], {}).size).toBe(0);
    expect(rowWinners("fastening", [a, b], { fastening: "post" }).size).toBe(2);
  });
});
