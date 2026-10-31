import { customType, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer | string }>({
  dataType: () => "bytea",
  toDriver: (v) => v,
  fromDriver: (v) => (typeof v === "string" ? Buffer.from(v.replace(/^\\x/, ""), "hex") : v),
});

/** Anonymous visitor (httpOnly cookie). Holds no personal data. */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Generated previews. YouCam result URLs expire, so the compressed image is kept here. */
export const resultImages = pgTable("result_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  mime: text("mime").notNull(),
  bytes: bytea("bytes").notNull(),
});

/** A selfie that was sent to YouCam. We keep only the provider file id and a hash, never the photo. */
export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  fileId: text("file_id").notNull(),
  photoHash: text("photo_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per makeup preview request (one shade on one uploaded photo). */
export const previews = pgTable(
  "previews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    inputHash: text("input_hash").notNull(),
    taskId: text("task_id"),
    status: text("status").notNull().default("queued"), // queued|processing|success|error
    resultImageId: uuid("result_image_id").references(() => resultImages.id, { onDelete: "set null" }),
    unitsSpent: integer("units_spent").notNull().default(0),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("previews_hash_idx").on(t.inputHash), index("previews_session_idx").on(t.sessionId)],
);

export const usageLedger = pgTable("usage_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  units: integer("units").notNull(),
  kind: text("kind").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
