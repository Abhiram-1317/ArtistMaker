// ─────────────────────────────────────────────────────────────────────────────
// Environment configuration for AI worker
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  WORKER_PORT: z.coerce.number().default(3002),
  WORKER_HOST: z.string().default("0.0.0.0"),

  REDIS_URL: z.string().default("redis://localhost:6379"),

  MODELS_DIR: z.string().default("./models"),
  OUTPUT_DIR: z.string().default("./output"),
  PYTHON_PATH: z.string().default("python"),

  CUDA_VISIBLE_DEVICES: z.string().default("0"),
  WORKER_CONCURRENCY: z.coerce.number().min(1).default(1),

  VIDEO_MODEL: z.string().default("sd-xl"),
  VOICE_MODEL: z.string().default("coqui-tts"),
  MUSIC_MODEL: z.string().default("musicgen-small"),

  API_URL: z.string().default("http://localhost:3001"),

  HF_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid AI worker environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
