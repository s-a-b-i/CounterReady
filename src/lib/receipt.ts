import { formatPkr } from "./catalogue";
import { CATEGORY_LABEL, type MakeupProduct, type Preferences } from "./consultation-types";

const WORDS = ["Zero", "One", "Two", "Three"];

export interface ReceiptInput {
  prefs: Preferences;
  compared: MakeupProduct[];
  selected: MakeupProduct;
  note?: string;
}

/**
 * The comparison receipt: every line is either something the shopper chose (budget, note, favourite)
 * or a fact copied from the catalogue. Nothing here comes from the AI preview.
 */
export function buildReceipt({ prefs, compared, selected, note }: ReceiptInput): [string, string][] {
  const rows: [string, string][] = [
    ["Product type", CATEGORY_LABEL[selected.category]],
    ["Budget", formatPkr(prefs.budget)],
    ["Products compared", WORDS[compared.length] ?? String(compared.length)],
    ["Selected product", selected.name],
    ["Shade code", selected.shadeCode],
    ["Finish", selected.finish[0].toUpperCase() + selected.finish.slice(1)],
    ["Listed price", formatPkr(selected.price)],
  ];
  const n = note?.trim();
  if (n) rows.push(["Customer note", `“${n}”`]);
  return rows;
}

export function receiptText(shopName: string, rows: [string, string][]): string {
  return [`${shopName}: comparison receipt`, ...rows.map(([k, v]) => `${k}: ${v}`), "Sample catalogue data. Confirm availability and physical colour before purchase."].join("\n");
}
