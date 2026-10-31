import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluateBudget } from "@/lib/budget";
import { CATALOGUE, explainNoMatches, formatPkr, getProduct, matchProducts } from "@/lib/catalogue";
import type { Preferences } from "@/lib/consultation-types";
import { photoHash, previewHash } from "@/lib/hash";
import { sniffImageType } from "@/lib/images";
import { buildReceipt, receiptText } from "@/lib/receipt";
import { parseTaskResponse } from "@/lib/youcam/adapter";
import { humanError } from "@/lib/youcam/errors";
import { makeupEffect, tint } from "@/lib/youcam/effects";

const prefs = (p: Partial<Preferences> = {}): Preferences => ({ category: "lipstick", budget: 2000, finish: "any", family: "any", ...p });

describe("catalogue", () => {
  it("has twenty sample products across three categories, all flagged as sample data", () => {
    expect(CATALOGUE).toHaveLength(20);
    expect(new Set(CATALOGUE.map((p) => p.category))).toEqual(new Set(["lipstick", "blush", "eyeshadow"]));
    expect(CATALOGUE.every((p) => p.isSampleProduct && p.currency === "PKR")).toBe(true);
    expect(new Set(CATALOGUE.map((p) => p.shadeCode)).size).toBe(20);
    expect(new Set(CATALOGUE.map((p) => p.id)).size).toBe(20);
  });

  it("only returns products from the chosen category", () => {
    for (const category of ["lipstick", "blush", "eyeshadow"] as const) {
      const m = matchProducts(prefs({ category, budget: 3000 }));
      expect(m.length).toBeGreaterThan(3);
      expect(m.every((p) => p.category === category)).toBe(true);
    }
  });

  it("only uses finishes the preview API supports for each category", () => {
    const allowed = { lipstick: ["matte", "satin", "gloss"], blush: ["matte", "satin", "shimmer"], eyeshadow: ["matte", "shimmer", "metallic"] };
    for (const p of CATALOGUE) expect(allowed[p.category]).toContain(p.finish);
  });

  it("never returns products over budget", () => {
    const m = matchProducts(prefs({ budget: 1500 }));
    expect(m.length).toBeGreaterThan(0);
    expect(m.every((p) => p.price <= 1500)).toBe(true);
  });

  it("filters by finish and colour family", () => {
    expect(matchProducts(prefs({ finish: "satin" })).every((p) => p.finish === "satin")).toBe(true);
    expect(matchProducts(prefs({ family: "berry" })).every((p) => p.colourFamily === "berry")).toBe(true);
  });

  it("keeps out-of-stock products visible but flags them", () => {
    const coral = matchProducts(prefs({ budget: 3000 })).find((p) => p.shadeCode === "CR-07");
    expect(coral?.inStock).toBe(false);
    expect(matchProducts(prefs({ category: "blush", budget: 3000 })).find((p) => p.shadeCode === "BL-05")?.inStock).toBe(false);
  });
});

describe("explainNoMatches", () => {
  it("is empty when something matches", () => {
    expect(explainNoMatches(prefs())).toEqual([]);
  });

  it("blames the budget when it is the only blocker", () => {
    const r = explainNoMatches(prefs({ budget: 500 }));
    expect(r[0]).toMatch(/budget of PKR 500 is too low/);
    expect(r[0]).toMatch(/PKR 1,200/);
    expect(explainNoMatches(prefs({ category: "blush", budget: 500 }))[0]).toMatch(/cheapest blush costs PKR 1,100/);
  });

  it("blames the finish or colour family when relaxing it would help", () => {
    const r = explainNoMatches(prefs({ budget: 1300, finish: "gloss", family: "brown" }));
    expect(r.join(" ")).toMatch(/no gloss brown lipstick shade at any price/);
  });
});

describe("budget guard", () => {
  const base = { totalUnitsUsed: 0, sessionPreviews: 0, cost: 1, maxUnitsTotal: 850, maxPreviewsPerSession: 8 };
  it("allows under both caps", () => expect(evaluateBudget(base).ok).toBe(true));
  it("blocks at the session cap", () => {
    const d = evaluateBudget({ ...base, sessionPreviews: 8 });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.reason).toBe("SESSION_CAP");
  });
  it("blocks when the global cap would be exceeded", () => {
    const d = evaluateBudget({ ...base, totalUnitsUsed: 850 });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.reason).toBe("GLOBAL_CAP");
  });
  it("allows the very last unit", () => expect(evaluateBudget({ ...base, totalUnitsUsed: 849 }).ok).toBe(true));
});

describe("YouCam adapter", () => {
  it("parses the real recorded success response", () => {
    const raw = JSON.parse(readFileSync("fixtures/makeup-success.json", "utf8"));
    const r = parseTaskResponse(raw);
    expect(r.status).toBe("success");
    expect(r.resultUrl).toMatch(/^https:\/\//);
  });
  it("reports running and error states", () => {
    expect(parseTaskResponse({ status: 200, data: { task_status: "running" } }).status).toBe("processing");
    const e = parseTaskResponse({ status: 200, data: { task_status: "error", error: "error_face_angle_invalid" } });
    expect(e.status).toBe("error");
    expect(e.errorCode).toBe("error_face_angle_invalid");
  });
  it("treats success without an image as an error", () => {
    expect(parseTaskResponse({ data: { task_status: "success", results: {} } }).status).toBe("error");
  });
  it("maps provider codes to actionable messages", () => {
    expect(humanError("error_face_angle_invalid")).toMatch(/straight at the camera/);
    expect(humanError("something_new")).toMatch(/Something went wrong/);
  });
});

describe("effect mapping", () => {
  it("maps lipstick to lip_color with the catalogue finish as texture and previewHex as colour", () => {
    const p = getProduct("cr-04")!;
    const e = makeupEffect(p);
    expect(e.category).toBe("lip_color");
    expect((e.palettes as unknown[])[0]).toMatchObject({ color: p.previewHex, texture: "satin" });
  });
  it("adds the extra fields the API requires for gloss", () => {
    expect((makeupEffect(getProduct("cr-02")!).palettes as unknown[])[0]).toMatchObject({ texture: "gloss", gloss: 60, transparencyIntensity: 30 });
  });
  it("maps blush with a single-colour pattern and the fields each texture requires", () => {
    const satin = makeupEffect(getProduct("bl-02")!);
    expect(satin).toMatchObject({ category: "blush", pattern: { name: "1color1" } });
    expect((satin.palettes as unknown[])[0]).toMatchObject({ texture: "satin", glowStrength: 40 });
    const shimmer = (makeupEffect(getProduct("bl-03")!).palettes as Record<string, unknown>[])[0];
    expect(shimmer).toMatchObject({ texture: "shimmer", glowStrength: 40, shimmerDensity: 50 });
    expect(shimmer.shimmerColor).toMatch(/^#[0-9a-f]{6}$/);
  });
  it("maps eyeshadow to eye_shadow and adds shimmer and metallic fields", () => {
    expect(makeupEffect(getProduct("es-01")!)).toMatchObject({ category: "eye_shadow", pattern: { name: "1color1" } });
    expect((makeupEffect(getProduct("es-02")!).palettes as unknown[])[0]).toMatchObject({ texture: "shimmer", shimmerIntensity: 50 });
    expect((makeupEffect(getProduct("es-04")!).palettes as unknown[])[0]).toMatchObject({ texture: "metallic", shimmerIntensity: 50, metallicIntensity: 50 });
  });
  it("tint lightens a colour but keeps it valid hex", () => {
    expect(tint("#000000", 0.5)).toBe("#808080");
    expect(tint("#ffffff")).toBe("#ffffff");
  });
});

describe("hashing", () => {
  it("is stable per photo, product and effect, and changes when any of them change", () => {
    const d = photoHash(Buffer.from("selfie"));
    const a = previewHash(d, "cr-04", makeupEffect(getProduct("cr-04")!));
    expect(previewHash(d, "cr-04", makeupEffect(getProduct("cr-04")!))).toBe(a);
    expect(previewHash(d, "cr-03", makeupEffect(getProduct("cr-03")!))).not.toBe(a);
    expect(previewHash(photoHash(Buffer.from("other")), "cr-04", makeupEffect(getProduct("cr-04")!))).not.toBe(a);
  });
});

describe("comparison receipt", () => {
  const selected = getProduct("cr-04")!;
  const compared = ["cr-04", "cr-03", "cr-02"].map((id) => getProduct(id)!);

  it("matches the example rows", () => {
    const rows = buildReceipt({ prefs: prefs(), compared, selected, note: "Less bright than my second choice" });
    expect(Object.fromEntries(rows)).toEqual({
      "Product type": "Lipstick",
      Budget: "PKR 2,000",
      "Products compared": "Three",
      "Selected product": "Sample Rosewood",
      "Shade code": "CR-04",
      Finish: "Satin",
      "Listed price": "PKR 1,650",
      "Customer note": "“Less bright than my second choice”",
    });
  });

  it("omits the note row when blank", () => {
    expect(buildReceipt({ prefs: prefs(), compared, selected, note: "  " }).some(([k]) => k === "Customer note")).toBe(false);
  });

  it("renders plain text with the sample-data reminder", () => {
    const t = receiptText("Shop", buildReceipt({ prefs: prefs(), compared, selected }));
    expect(t).toMatch(/Shade code: CR-04/);
    expect(t).toMatch(/Sample catalogue data/);
  });

  it("formats PKR with thousands separators", () => expect(formatPkr(2300)).toBe("PKR 2,300"));
});

describe("magic-byte sniffing", () => {
  it("detects JPEG and PNG and rejects others", () => {
    expect(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe("image/jpeg");
    expect(sniffImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe("image/png");
    expect(sniffImageType(Buffer.from("GIF89a....."))).toBeNull();
    expect(sniffImageType(Buffer.from("<svg></svg>"))).toBeNull();
  });
});
