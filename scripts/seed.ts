import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";

config({ path: ".env.local" });

type Seed = {
  slug: string; name: string; brand: string; priceCents: number; dropLengthCm: number; weightG: number;
  fastening: string; material: string; hypoallergenicDeclared: boolean; returnPolicy: string;
  returnWindowDays: number; finalSale: boolean; styleTags: string[]; referenceScaleCm: number;
  description: string; shape: "stud" | "hoop" | "drop" | "bar" | "cluster" | "huggie" | "chain" | "disc";
  color: string;
};

const products: Seed[] = [
  { slug: "lune-pearl-stud", name: "Lune Pearl Stud", brand: "Maison Alder", priceCents: 4800, dropLengthCm: 0.8, weightG: 1.1, fastening: "post", material: "925 sterling silver, freshwater pearl", hypoallergenicDeclared: true, returnPolicy: "Free returns within 60 days", returnWindowDays: 60, finalSale: false, styleTags: ["minimal", "everyday", "office"], referenceScaleCm: 0.8, description: "A quiet pearl stud that sits flat against the lobe.", shape: "stud", color: "#EDE6D8" },
  { slug: "solenne-gold-huggie", name: "Solenne Huggie", brand: "Maison Alder", priceCents: 7200, dropLengthCm: 1.4, weightG: 2.0, fastening: "hook", material: "14k gold vermeil", hypoallergenicDeclared: false, returnPolicy: "Free returns within 30 days", returnWindowDays: 30, finalSale: false, styleTags: ["minimal", "everyday"], referenceScaleCm: 1.4, description: "A slim huggie hoop with a hinged closure.", shape: "huggie", color: "#C9A55C" },
  { slug: "aurelia-chandelier", name: "Aurelia Chandelier", brand: "Verre & Co", priceCents: 3900, dropLengthCm: 8.5, weightG: 14.5, fastening: "post", material: "Gold-tone alloy, glass crystals", hypoallergenicDeclared: false, returnPolicy: "Final sale, no returns", returnWindowDays: 0, finalSale: true, styleTags: ["glam", "evening", "wedding"], referenceScaleCm: 8.5, description: "A dramatic long drop for a night out. Heavy and bold.", shape: "cluster", color: "#D4B36A" },
  { slug: "oriel-thread-drop", name: "Oriel Thread Drop", brand: "Fenwick Atelier", priceCents: 6400, dropLengthCm: 6.0, weightG: 2.8, fastening: "hook", material: "Rhodium-plated brass, silk thread", hypoallergenicDeclared: false, returnPolicy: "Returns within 14 days, buyer pays shipping", returnWindowDays: 14, finalSale: false, styleTags: ["evening", "statement"], referenceScaleCm: 6.0, description: "A feather-light tassel drop that moves with you.", shape: "chain", color: "#B9B2A6" },
  { slug: "calla-flat-disc", name: "Calla Disc", brand: "Fenwick Atelier", priceCents: 11800, dropLengthCm: 2.6, weightG: 3.9, fastening: "post", material: "18k recycled gold plate over titanium", hypoallergenicDeclared: true, returnPolicy: "Free returns within 45 days", returnWindowDays: 45, finalSale: false, styleTags: ["minimal", "office", "everyday"], referenceScaleCm: 2.6, description: "A brushed disc on a titanium post.", shape: "disc", color: "#BFA063" },
  { slug: "marais-hoop-large", name: "Marais Large Hoop", brand: "Verre & Co", priceCents: 8900, dropLengthCm: 5.0, weightG: 6.2, fastening: "hook", material: "Sterling silver", hypoallergenicDeclared: false, returnPolicy: "Returns within 30 days", returnWindowDays: 30, finalSale: false, styleTags: ["statement", "everyday"], referenceScaleCm: 5.0, description: "An oversized hoop with a polished finish.", shape: "hoop", color: "#CFCFCB" },
  { slug: "ember-clip-bar", name: "Ember Clip Bar", brand: "Studio Quill", priceCents: 2900, dropLengthCm: 3.2, weightG: 2.4, fastening: "clip-on", material: "Enamelled brass", hypoallergenicDeclared: false, returnPolicy: "Free returns within 30 days", returnWindowDays: 30, finalSale: false, styleTags: ["statement", "no-piercing"], referenceScaleCm: 3.2, description: "A clip-on bar for unpierced ears.", shape: "bar", color: "#8E3B2E" },
  { slug: "sora-crystal-screwback", name: "Sora Crystal Studs", brand: "Studio Quill", priceCents: 5400, dropLengthCm: 1.0, weightG: 1.6, fastening: "screw-back", material: "Titanium, lab-grown crystal", hypoallergenicDeclared: true, returnPolicy: "Returns within 21 days", returnWindowDays: 21, finalSale: false, styleTags: ["everyday", "sparkle"], referenceScaleCm: 1.0, description: "Secure screw-back studs for active days.", shape: "stud", color: "#DCE4EA" },
];

function svg(p: Seed): string {
  const c = p.color;
  const body: Record<Seed["shape"], string> = {
    stud: `<circle cx="256" cy="256" r="46" fill="${c}" stroke="#16130F" stroke-opacity=".15" stroke-width="3"/>`,
    huggie: `<path d="M180 256a76 76 0 1 1 152 0" fill="none" stroke="${c}" stroke-width="18" stroke-linecap="round"/>`,
    hoop: `<circle cx="256" cy="256" r="140" fill="none" stroke="${c}" stroke-width="16"/>`,
    drop: `<path d="M256 140 l60 120 a60 60 0 1 1 -120 0z" fill="${c}"/>`,
    bar: `<rect x="236" y="110" width="40" height="290" rx="20" fill="${c}"/>`,
    cluster: `<circle cx="256" cy="110" r="24" fill="${c}"/><circle cx="210" cy="220" r="30" fill="${c}"/><circle cx="302" cy="220" r="30" fill="${c}"/><circle cx="256" cy="320" r="40" fill="${c}"/><circle cx="256" cy="420" r="26" fill="${c}"/>`,
    chain: `<circle cx="256" cy="100" r="16" fill="${c}"/><path d="M256 116V300" stroke="${c}" stroke-width="6"/><path d="M226 300h60l16 120h-92z" fill="${c}" opacity=".85"/>`,
    disc: `<circle cx="256" cy="200" r="22" fill="${c}"/><circle cx="256" cy="290" r="80" fill="${c}"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1024" height="1024"><rect width="512" height="512" fill="#F7F3EC"/>${body[p.shape]}</svg>`;
}

async function main() {
  const { db, tables } = await import("../src/lib/db");
  mkdirSync("public/products", { recursive: true });
  for (const p of products) writeFileSync(`public/products/${p.slug}.svg`, svg(p));

  await db.delete(tables.products);
  await db.insert(tables.products).values(
    products.map(({ shape: _shape, color: _color, ...rest }) => ({ ...rest, currency: "USD", imageUrl: `/products/${rest.slug}.svg` })),
  );
  console.log(`seeded ${products.length} products`);
  process.exit(0);
}
main();
