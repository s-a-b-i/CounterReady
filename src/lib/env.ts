import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (Neon pooled connection string)"),
  YOUCAM_API_KEY: z.string().optional(),
  YOUCAM_BASE_URL: z.string().url().default("https://yce-api-01.makeupar.com"),
  YOUCAM_MOCK: z.enum(["0", "1"]).default("0"),
  MAX_UNITS_TOTAL: z.coerce.number().int().positive().default(850),
  MAX_PREVIEWS_PER_SESSION: z.coerce.number().int().positive().default(8),
  ADMIN_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${msg}`);
  }
  if (parsed.data.YOUCAM_MOCK === "0" && !parsed.data.YOUCAM_API_KEY) {
    throw new Error("Invalid environment: set YOUCAM_API_KEY or YOUCAM_MOCK=1");
  }
  cached = parsed.data;
  return cached;
}
