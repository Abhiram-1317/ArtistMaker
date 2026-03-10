import { z } from "zod";

const envSchema = z.object({
  // Required
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be at least 16 characters"),
  NEXTAUTH_URL: z.string().url().optional(),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // Demo mode
  DEMO_MODE: z.enum(["true", "false"]).optional().default("false"),

  // Node
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Optional services
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  REDIS_URL: z.string().optional(),

  // Public
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function validateEnv(): Env {
  if (validatedEnv) return validatedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    console.error(`❌ Environment validation failed:\n${formatted}`);

    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment configuration");
    }
  }

  validatedEnv = parsed.success ? parsed.data : (process.env as unknown as Env);
  return validatedEnv;
}
