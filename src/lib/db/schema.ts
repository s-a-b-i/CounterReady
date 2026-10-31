import { sql } from "drizzle-orm";
import {
  boolean, customType, index, integer, jsonb, pgTable, real, text, timestamp, uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer | string }>({
  dataType: () => "bytea",
  toDriver: (v) => v,
  fromDriver: (v) => (typeof v === "string" ? Buffer.from(v.replace(/^\\x/, ""), "hex") : v),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  dropLengthCm: real("drop_length_cm").notNull(),
  weightG: real("weight_g").notNull(),
  fastening: text("fastening").notNull(),
  material: text("material").notNull(),
  hypoallergenicDeclared: boolean("hypoallergenic_declared").notNull().default(false),
  returnPolicy: text("return_policy").notNull(),
  returnWindowDays: integer("return_window_days").notNull(),
  finalSale: boolean("final_sale").notNull().default(false),
  styleTags: text("style_tags").array().notNull().default(sql`'{}'::text[]`),
  imageUrl: text("image_url").notNull(),
  referenceScaleCm: real("reference_scale_cm").notNull(),
  description: text("description").notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  preferences: jsonb("preferences").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const resultImages = pgTable("result_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  mime: text("mime").notNull(),
  bytes: bytea("bytes").notNull(),
});

export const tryons = pgTable(
  "tryons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id),
    taskId: text("task_id"),
    status: text("status").notNull().default("queued"), // queued|processing|success|error
    resultImageId: uuid("result_image_id").references(() => resultImages.id, { onDelete: "set null" }),
    unitsSpent: integer("units_spent").notNull().default(0),
    params: jsonb("params").$type<Record<string, unknown>>().notNull().default({}),
    inputHash: text("input_hash").notNull(),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tryons_hash_idx").on(t.inputHash), index("tryons_session_idx").on(t.sessionId)],
);

export const decisions = pgTable("decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  tryonId: uuid("tryon_id").references(() => tryons.id, { onDelete: "set null" }),
  verdict: text("verdict").notNull(), // buy|maybe|skip
  reason: text("reason").notNull().default(""),
  shareSlug: text("share_slug").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("decisions_slug_idx").on(t.shareSlug)]);

export const usageLedger = pgTable("usage_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  units: integer("units").notNull(),
  kind: text("kind").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
