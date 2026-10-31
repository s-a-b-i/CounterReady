import type { MakeupProduct } from "@/lib/consultation-types";
import type { MakeupEffect } from "./client";

type Palette = Record<string, string | number>;

/** A lighter tint of a hex colour, used as the shimmer particle colour the API requires for shimmer/metallic textures. */
export function tint(hex: string, amount = 0.55): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function lipstickPalette(p: Pick<MakeupProduct, "finish" | "previewHex">): Palette {
  return p.finish === "gloss"
    ? { color: p.previewHex, texture: "gloss", colorIntensity: 70, gloss: 60, transparencyIntensity: 30 }
    : { color: p.previewHex, texture: p.finish, colorIntensity: 70 };
}

function blushPalette(p: Pick<MakeupProduct, "finish" | "previewHex">): Palette {
  const base: Palette = { color: p.previewHex, texture: p.finish, colorIntensity: 80 };
  if (p.finish === "satin") return { ...base, glowStrength: 40 };
  if (p.finish === "shimmer") return { ...base, glowStrength: 40, shimmerColor: tint(p.previewHex), shimmerDensity: 50 };
  return base;
}

function eyeshadowPalette(p: Pick<MakeupProduct, "finish" | "previewHex">): Palette {
  const base: Palette = { color: p.previewHex, texture: p.finish, colorIntensity: 80 };
  if (p.finish === "shimmer") return { ...base, shimmerColor: tint(p.previewHex), shimmerIntensity: 50 };
  if (p.finish === "metallic") return { ...base, shimmerColor: tint(p.previewHex), shimmerIntensity: 50, metallicIntensity: 50 };
  return base;
}

/**
 * Maps a catalogue product to the YouCam effect for its category. The catalogue's finish picks the provider texture
 * and `previewHex` is the colour. The same settings are used for every preview of a product, so results are comparable.
 * Single-colour patterns only (`1color1`), because each catalogue item is one shade.
 */
export function makeupEffect(p: Pick<MakeupProduct, "category" | "finish" | "previewHex">): MakeupEffect {
  switch (p.category) {
    case "lipstick":
      return { category: "lip_color", shape: { name: "original" }, style: { type: "full" }, palettes: [lipstickPalette(p)] };
    case "blush":
      return { category: "blush", pattern: { name: "1color1" }, palettes: [blushPalette(p)] };
    case "eyeshadow":
      return { category: "eye_shadow", pattern: { name: "1color1" }, palettes: [eyeshadowPalette(p)] };
  }
}
