// ─────────────────────────────────────────────────────────────────────────────
// @genesis/database — Prisma Client singleton & re-exports
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";

// Re-export the generated client class
export { PrismaClient } from "@prisma/client";

// Re-export every generated model type
export type {
  User,
  Project,
  Script,
  Character,
  Scene,
  Shot,
  AudioTrack,
  RenderJob,
  Template,
  Analytics,
  ViewEvent,
} from "@prisma/client";

// Re-export every enum so consumers can reference them by value
export {
  SubscriptionTier,
  ProjectStatus,
  Genre,
  SceneStatus,
  ShotStatus,
  ShotType,
  CameraAngle,
  CameraMovement,
  TimeOfDay,
  Weather,
  AudioTrackType,
  RenderJobType,
  RenderJobStatus,
  TemplateCategory,
} from "@prisma/client";

// ── Singleton ────────────────────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * A singleton Prisma Client instance.
 *
 * - In development the instance is cached on `globalThis` so that
 *   hot-reload (Next.js / tsx --watch) doesn't exhaust DB connections.
 * - In production a single instance is created per process.
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

