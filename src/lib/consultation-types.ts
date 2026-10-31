export const CATEGORIES = ["lipstick", "blush", "eyeshadow"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = { lipstick: "Lipstick", blush: "Blush", eyeshadow: "Eyeshadow" };

/** Finishes differ by product type, because the preview API offers different textures for each. */
export const FINISHES_BY_CATEGORY = {
  lipstick: ["matte", "satin", "gloss"],
  blush: ["matte", "satin", "shimmer"],
  eyeshadow: ["matte", "shimmer", "metallic"],
} as const;
export const FINISHES = ["matte", "satin", "gloss", "shimmer", "metallic"] as const;
export const COLOUR_FAMILIES = ["nude", "pink", "peach", "red", "berry", "brown", "gold", "smoky"] as const;

export type Finish = (typeof FINISHES)[number];
export type ColourFamily = (typeof COLOUR_FAMILIES)[number];

/** One manually maintained sample makeup product. `previewHex` is rendering configuration, not a calibrated physical colour. */
export type MakeupProduct = {
  id: string;
  category: Category;
  name: string;
  shadeCode: string;
  price: number;
  currency: "PKR";
  finish: Finish;
  colourFamily: ColourFamily;
  inStock: boolean;
  imageUrl: string;
  previewHex: string;
  isSampleProduct: boolean;
};

export interface Preferences {
  category: Category;
  /** Maximum budget in PKR. */
  budget: number;
  finish: Finish | "any";
  family: ColourFamily | "any";
}

export const MAX_SHORTLIST = 3;

/** Application-level preview result, independent of YouCam's response schema. */
export type PreviewResult =
  | { status: "processing"; previewId: string }
  | { status: "success"; previewId: string; imageUrl: string; cached: boolean }
  | { status: "error"; previewId?: string; message: string; code?: string };

export type Step = "preferences" | "products" | "photo" | "compare" | "decide";
export const STEPS: { id: Step; label: string }[] = [
  { id: "preferences", label: "Budget" },
  { id: "products", label: "Shortlist" },
  { id: "photo", label: "Photo" },
  { id: "compare", label: "Compare" },
  { id: "decide", label: "Decide" },
];

export const SHOP = {
  name: "Rosewood Counter (sample shop)",
  contact: "WhatsApp +92 300 0000000 (sample number)",
};

export const REMINDER = "Please confirm availability and the physical shade in store before you buy. Digital previews are approximate.";

export const CONSENT_TEXT =
  "Your photo will be sent to Perfect Corp to generate a virtual makeup preview. Digital colours are approximate and may differ from the physical product.";
