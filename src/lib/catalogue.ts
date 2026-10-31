import { CATEGORY_LABEL, type MakeupProduct, type Preferences } from "./consultation-types";

type Seed = Omit<MakeupProduct, "currency" | "isSampleProduct" | "imageUrl">;

/**
 * Manually maintained SAMPLE catalogue. It is not connected to any retailer's stock system.
 * Product images are illustrations generated from `previewHex` (see scripts/make-product-images.ts).
 */
const SEEDS: Seed[] = [
  // Lipstick
  { id: "cr-01", category: "lipstick", name: "Sample Bare Silk", shadeCode: "CR-01", price: 1200, finish: "matte", colourFamily: "nude", inStock: true, previewHex: "#c48a78" },
  { id: "cr-02", category: "lipstick", name: "Sample Petal Blush", shadeCode: "CR-02", price: 1400, finish: "gloss", colourFamily: "pink", inStock: true, previewHex: "#dd6f8a" },
  { id: "cr-03", category: "lipstick", name: "Sample Cherry Pop", shadeCode: "CR-03", price: 1900, finish: "matte", colourFamily: "red", inStock: true, previewHex: "#c3122f" },
  { id: "cr-04", category: "lipstick", name: "Sample Rosewood", shadeCode: "CR-04", price: 1650, finish: "satin", colourFamily: "pink", inStock: true, previewHex: "#a85467" },
  { id: "cr-05", category: "lipstick", name: "Sample Mocha Mood", shadeCode: "CR-05", price: 1500, finish: "matte", colourFamily: "brown", inStock: true, previewHex: "#86523f" },
  { id: "cr-06", category: "lipstick", name: "Sample Berry Velvet", shadeCode: "CR-06", price: 2300, finish: "matte", colourFamily: "berry", inStock: true, previewHex: "#7a1f45" },
  { id: "cr-07", category: "lipstick", name: "Sample Coral Glow", shadeCode: "CR-07", price: 1750, finish: "gloss", colourFamily: "red", inStock: false, previewHex: "#ee6c5a" },
  { id: "cr-08", category: "lipstick", name: "Sample Wine Satin", shadeCode: "CR-08", price: 2100, finish: "satin", colourFamily: "berry", inStock: true, previewHex: "#6b1c34" },
  // Blush
  { id: "bl-01", category: "blush", name: "Sample Peach Bloom", shadeCode: "BL-01", price: 1100, finish: "matte", colourFamily: "peach", inStock: true, previewHex: "#f08f78" },
  { id: "bl-02", category: "blush", name: "Sample Rose Flush", shadeCode: "BL-02", price: 1350, finish: "satin", colourFamily: "pink", inStock: true, previewHex: "#e8678a" },
  { id: "bl-03", category: "blush", name: "Sample Soft Apricot", shadeCode: "BL-03", price: 1500, finish: "shimmer", colourFamily: "peach", inStock: true, previewHex: "#f0956a" },
  { id: "bl-04", category: "blush", name: "Sample Berry Cheek", shadeCode: "BL-04", price: 1250, finish: "matte", colourFamily: "berry", inStock: true, previewHex: "#b03a62" },
  { id: "bl-05", category: "blush", name: "Sample Terracotta", shadeCode: "BL-05", price: 1450, finish: "matte", colourFamily: "brown", inStock: false, previewHex: "#b8553a" },
  { id: "bl-06", category: "blush", name: "Sample Pearl Pink", shadeCode: "BL-06", price: 1700, finish: "shimmer", colourFamily: "pink", inStock: true, previewHex: "#ee8fae" },
  // Eyeshadow (single shade)
  { id: "es-01", category: "eyeshadow", name: "Sample Plum Smoke", shadeCode: "ES-01", price: 1300, finish: "matte", colourFamily: "berry", inStock: true, previewHex: "#6f4a82" },
  { id: "es-02", category: "eyeshadow", name: "Sample Champagne Glow", shadeCode: "ES-02", price: 1600, finish: "shimmer", colourFamily: "gold", inStock: true, previewHex: "#d0a560" },
  { id: "es-03", category: "eyeshadow", name: "Sample Espresso", shadeCode: "ES-03", price: 1200, finish: "matte", colourFamily: "brown", inStock: true, previewHex: "#5b3a2e" },
  { id: "es-04", category: "eyeshadow", name: "Sample Rose Gold", shadeCode: "ES-04", price: 2000, finish: "metallic", colourFamily: "pink", inStock: true, previewHex: "#c07a78" },
  { id: "es-05", category: "eyeshadow", name: "Sample Smoky Charcoal", shadeCode: "ES-05", price: 1400, finish: "matte", colourFamily: "smoky", inStock: true, previewHex: "#454854" },
  { id: "es-06", category: "eyeshadow", name: "Sample Bronze Mirror", shadeCode: "ES-06", price: 2250, finish: "metallic", colourFamily: "gold", inStock: false, previewHex: "#a06a2c" },
];

export const CATALOGUE: MakeupProduct[] = SEEDS.map((s) => ({ ...s, currency: "PKR", imageUrl: `/products/${s.id}.svg`, isSampleProduct: true }));

export function getProduct(id: string): MakeupProduct | undefined {
  return CATALOGUE.find((p) => p.id === id);
}

export const BUDGET_MIN = 500;
export const BUDGET_MAX = 3000;
export const BUDGET_STEP = 100;

export function formatPkr(n: number): string {
  return `PKR ${n.toLocaleString("en-US")}`;
}

/** Colour families that actually exist in a category, so the shopper is never offered an empty choice. */
export function familiesIn(category: Preferences["category"], products: MakeupProduct[] = CATALOGUE) {
  return [...new Set(products.filter((p) => p.category === category).map((p) => p.colourFamily))];
}

type Check = (p: MakeupProduct, prefs: Preferences) => boolean;
const inCategory: Check = (p, f) => p.category === f.category;
const withinBudget: Check = (p, f) => p.price <= f.budget;
const matchesFinish: Check = (p, f) => f.finish === "any" || p.finish === f.finish;
const matchesFamily: Check = (p, f) => f.family === "any" || p.colourFamily === f.family;

/** Products that satisfy every preference. Stock is shown separately: out-of-stock items stay visible but cannot be picked. */
export function matchProducts(prefs: Preferences, products: MakeupProduct[] = CATALOGUE): MakeupProduct[] {
  return products.filter((p) => inCategory(p, prefs) && withinBudget(p, prefs) && matchesFinish(p, prefs) && matchesFamily(p, prefs));
}

/**
 * When nothing matches, say which filter is responsible instead of quietly widening the search.
 * A filter is "responsible" when relaxing just that one would bring products back.
 */
export function explainNoMatches(prefs: Preferences, products: MakeupProduct[] = CATALOGUE): string[] {
  if (matchProducts(prefs, products).length > 0) return [];
  const reasons: string[] = [];
  const noun = CATEGORY_LABEL[prefs.category].toLowerCase();
  const pool = products.filter((p) => inCategory(p, prefs));
  const without = (skip: "budget" | "finish" | "family") =>
    pool.filter((p) => (skip === "budget" || withinBudget(p, prefs)) && (skip === "finish" || matchesFinish(p, prefs)) && (skip === "family" || matchesFamily(p, prefs)));

  const byBudget = without("budget");
  if (byBudget.length) {
    const cheapest = Math.min(...byBudget.map((p) => p.price));
    reasons.push(`Your budget of ${formatPkr(prefs.budget)} is too low: the cheapest ${describe(prefs, noun)} costs ${formatPkr(cheapest)}.`);
  }
  const byFinish = without("finish");
  if (byFinish.length) reasons.push(`The ${prefs.finish} finish excludes everything else in ${noun} that fits your budget and colour family. Try another finish.`);
  const byFamily = without("family");
  if (byFamily.length) reasons.push(`No ${prefs.family} ${noun} shades fit your budget and finish. Try another colour family.`);
  if (!reasons.length) {
    // No single filter is to blame, so describe the combination in terms of what does exist.
    const inBudget = pool.filter((p) => withinBudget(p, prefs));
    const finish = prefs.finish === "any" ? null : prefs.finish;
    const family = prefs.family === "any" ? null : prefs.family;
    if (finish && family && !pool.some((p) => matchesFinish(p, prefs) && matchesFamily(p, prefs))) {
      reasons.push(`The catalogue has no ${finish} ${family} ${noun} shade at any price. Change the finish or the colour family.`);
    } else {
      const parts = [`Within ${formatPkr(prefs.budget)} there ${inBudget.length === 1 ? `is 1 ${noun} shade` : `are ${inBudget.length} ${noun} shades`}`];
      if (finish) parts.push(`${inBudget.filter((p) => matchesFinish(p, prefs)).length} ${finish}`);
      if (family) parts.push(`${inBudget.filter((p) => matchesFamily(p, prefs)).length} ${family}`);
      reasons.push(`${parts[0]}${parts.length > 1 ? ` (${parts.slice(1).join(", ")})` : ""}, but none satisfy all your filters together. Relax one of them.`);
    }
  }
  return reasons;
}

function describe(prefs: Preferences, noun: string): string {
  const parts = [prefs.finish !== "any" ? prefs.finish : null, prefs.family !== "any" ? prefs.family : null].filter(Boolean);
  return parts.length ? `${parts.join(" ")} ${noun}` : noun;
}
