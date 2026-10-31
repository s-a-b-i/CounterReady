export interface Brief {
  budget?: number; // whole currency units
  maxDropCm?: number;
  fastening?: "any" | "post" | "hook" | "screw-back" | "clip-on";
  material?: string; // "any" or a keyword such as "gold"
  occasion?: string; // "any" or a style tag
}

export interface FitProduct {
  priceCents: number;
  dropLengthCm: number;
  fastening: string;
  material: string;
  returnWindowDays: number;
  finalSale: boolean;
  styleTags: string[];
}

export type CriterionStatus = "met" | "partial" | "miss" | "n/a";

export interface Criterion {
  key: "budget" | "length" | "fastening" | "material" | "returns";
  label: string;
  status: CriterionStatus;
  note: string;
}

export interface FitResult {
  criteria: Criterion[];
  met: number;
  applicable: number;
}

const money = (cents: number) => `$${(cents / 100).toFixed(0)}`;

/**
 * SmallPrint's own, deliberately simple logic: each of five brief criteria is met, partly met,
 * missed or not applicable. No weighted "AI score" is invented; the UI shows the counts as-is.
 */
export function fitToBrief(p: FitProduct, b: Brief): FitResult {
  const criteria: Criterion[] = [];

  if (b.budget === undefined) criteria.push({ key: "budget", label: "Budget", status: "n/a", note: "No budget set" });
  else if (p.priceCents <= b.budget * 100) criteria.push({ key: "budget", label: "Budget", status: "met", note: `${money(p.priceCents)} is within $${b.budget}` });
  else if (p.priceCents <= b.budget * 100 * 1.2) criteria.push({ key: "budget", label: "Budget", status: "partial", note: `${money(p.priceCents)} is slightly over $${b.budget}` });
  else criteria.push({ key: "budget", label: "Budget", status: "miss", note: `${money(p.priceCents)} is over $${b.budget}` });

  if (b.maxDropCm === undefined) criteria.push({ key: "length", label: "Drop length", status: "n/a", note: "No length limit set" });
  else if (p.dropLengthCm <= b.maxDropCm) criteria.push({ key: "length", label: "Drop length", status: "met", note: `${p.dropLengthCm} cm is within ${b.maxDropCm} cm` });
  else if (p.dropLengthCm <= b.maxDropCm * 1.25) criteria.push({ key: "length", label: "Drop length", status: "partial", note: `${p.dropLengthCm} cm is a little over ${b.maxDropCm} cm` });
  else criteria.push({ key: "length", label: "Drop length", status: "miss", note: `${p.dropLengthCm} cm is over ${b.maxDropCm} cm` });

  if (!b.fastening || b.fastening === "any") criteria.push({ key: "fastening", label: "Fastening", status: "n/a", note: "Any fastening" });
  else if (p.fastening === b.fastening) criteria.push({ key: "fastening", label: "Fastening", status: "met", note: `${p.fastening} as requested` });
  else criteria.push({ key: "fastening", label: "Fastening", status: "miss", note: `${p.fastening}, not ${b.fastening}` });

  if (!b.material || b.material === "any") criteria.push({ key: "material", label: "Material", status: "n/a", note: "Any material" });
  else if (p.material.toLowerCase().includes(b.material.toLowerCase())) criteria.push({ key: "material", label: "Material", status: "met", note: `Listed as ${p.material}` });
  else criteria.push({ key: "material", label: "Material", status: "miss", note: `Listed as ${p.material}` });

  if (p.finalSale) criteria.push({ key: "returns", label: "Returns", status: "miss", note: "Final sale, no returns" });
  else if (p.returnWindowDays >= 30) criteria.push({ key: "returns", label: "Returns", status: "met", note: `${p.returnWindowDays}-day return window` });
  else criteria.push({ key: "returns", label: "Returns", status: "partial", note: `Only a ${p.returnWindowDays}-day return window` });

  const applicable = criteria.filter((c) => c.status !== "n/a").length;
  const met = criteria.filter((c) => c.status === "met").length;
  return { criteria, met, applicable };
}

/** Catalogue filter used by the brief step: hard constraints only (budget, length, fastening). */
export function matchesBrief(p: FitProduct, b: Brief): boolean {
  if (b.budget !== undefined && p.priceCents > b.budget * 100) return false;
  if (b.maxDropCm !== undefined && p.dropLengthCm > b.maxDropCm) return false;
  if (b.fastening && b.fastening !== "any" && p.fastening !== b.fastening) return false;
  if (b.material && b.material !== "any" && !p.material.toLowerCase().includes(b.material.toLowerCase())) return false;
  if (b.occasion && b.occasion !== "any" && !p.styleTags.includes(b.occasion)) return false;
  return true;
}

/** Everyday weight references for the "weight feel" meter. */
export const WEIGHT_REFERENCES: { label: string; grams: number }[] = [
  { label: "a paperclip", grams: 1 },
  { label: "a grape", grams: 5 },
  { label: "a AA battery", grams: 23 },
];

export function weightFeel(grams: number): string {
  if (grams <= 2) return "Barely there";
  if (grams <= 4) return "Light";
  if (grams <= 8) return "Noticeable";
  return "Heavy: you'll feel it";
}

export type CompareRow = "price" | "drop" | "weight" | "returns" | "fastening" | "material";

interface WinnerProduct extends FitProduct {
  id: string;
  weightG: number;
}

/** Which products "win" a row of the compare table, judged against the shopper's own brief. */
export function rowWinners(row: CompareRow, products: WinnerProduct[], b: Brief): Set<string> {
  if (products.length < 2) return new Set();
  const best = (score: (p: WinnerProduct) => number): Set<string> => {
    const top = Math.max(...products.map(score));
    return new Set(products.filter((p) => score(p) === top).map((p) => p.id));
  };
  switch (row) {
    case "price": return best((p) => -p.priceCents);
    case "weight": return best((p) => -p.weightG);
    case "returns": return best((p) => (p.finalSale ? -1 : p.returnWindowDays));
    case "drop":
      if (b.maxDropCm === undefined) return best((p) => -p.dropLengthCm);
      return best((p) => (p.dropLengthCm <= b.maxDropCm! ? -Math.abs(b.maxDropCm! - p.dropLengthCm) : -1000 - p.dropLengthCm));
    case "fastening":
      if (!b.fastening || b.fastening === "any") return new Set();
      return new Set(products.filter((p) => p.fastening === b.fastening).map((p) => p.id));
    case "material":
      if (!b.material || b.material === "any") return new Set();
      return new Set(products.filter((p) => p.material.toLowerCase().includes(b.material!.toLowerCase())).map((p) => p.id));
  }
}
