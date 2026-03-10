// ─────────────────────────────────────────────────────────────────────────────
// Redis connection utility for Bull queues
// ─────────────────────────────────────────────────────────────────────────────

import Redis from "ioredis";
import { env } from "./env.js";

/**
 * Create a new Redis connection for Bull.
 * Bull requires a factory so each queue / worker can have its own connection.
 */
export function createRedisConnection(): Redis {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // required by Bull
    enableReadyCheck: false,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

  redis.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });

  return redis;
}

/**
 * Redis connection options object for Bull queue constructor.
 * Uses the REDIS_URL directly — Bull will parse it.
 */
export function getRedisConfig(): { redis: string } {
  return { redis: env.REDIS_URL };
}
