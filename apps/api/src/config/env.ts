// ─────────────────────────────────────────────────────────────────────────────
// Environment variable validation & typed config
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  /** PostgreSQL connection string */
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  /** Secret used to sign JWT tokens */
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),

  /** Port the API server listens on */
  PORT: z.coerce.number().int().positive().default(3001),

  /** Current runtime environment */
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  /** Frontend origin allowed by CORS */
  FRONTEND_URL: z.string().default("http://localhost:3000"),

  /** Redis connection URL for Bull job queues */
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),

  /** Stripe API keys */
  STRIPE_SECRET_KEY: z.string().default("sk_test_placeholder"),
  STRIPE_WEBHOOK_SECRET: z.string().default("whsec_placeholder"),
  STRIPE_SUCCESS_URL: z.string().default("http://localhost:3000/dashboard?purchase=success"),
  STRIPE_CANCEL_URL: z.string().default("http://localhost:3000/dashboard?purchase=cancelled"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    console.error("❌ Invalid environment variables:");
    for (const [key, errors] of Object.entries(formatted)) {
      console.error(`  ${key}: ${errors?.join(", ")}`);
    }
    process.exit(1);
  }

  const validated = result.data;

  // Warn about weak JWT secret in non-test environments
  if (validated.JWT_SECRET.length < 32 && validated.NODE_ENV !== "test") {
    console.warn(
      "⚠️  JWT_SECRET is shorter than 32 characters — use a stronger secret in production",
    );
  }

  return validated;
}

export const env = validateEnv();
