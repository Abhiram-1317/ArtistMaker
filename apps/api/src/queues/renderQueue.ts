// ─────────────────────────────────────────────────────────────────────────────
// Render Queue — Bull queue for movie generation jobs
// ─────────────────────────────────────────────────────────────────────────────

import Bull from "bull";
import { env } from "../config/env.js";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Job type discriminator
 * ══════════════════════════════════════════════════════════════════════════════ */

export type RenderJobType =
  | "generate-movie"
  | "generate-shot"
  | "generate-audio"
  | "compose-final";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Job data types
 * ══════════════════════════════════════════════════════════════════════════════ */

export interface GenerateMovieJobData {
  type: "generate-movie";
  projectId: string;
  userId: string;
  config: {
    quality: "draft" | "standard" | "high" | "ultra";
    resolution: { width: number; height: number };
    fps: number;
    includeAudio: boolean;
  };
  /** Full project snapshot for the AI worker (characters, scenes, shots) */
  project: {
    stylePreset?: string | null;
    resolution?: string;
    characters: Array<{
      id: string;
      name: string;
      description?: string | null;
      voiceProfile?: unknown;
    }>;
    scenes: Array<{
      id: string;
      sceneNumber: number;
      locationDescription?: string | null;
      timeOfDay?: string;
      weather?: string;
      mood?: string | null;
      durationSeconds?: number | null;
      dialogue?: unknown;
      description?: string | null;
      shots: Array<{
        id: string;
        shotNumber: number;
        shotType: string;
        cameraAngle: string;
        durationSeconds: number;
        description?: string | null;
        negativePrompt?: string | null;
        charactersInShot?: string[];
        sceneId: string;
      }>;
    }>;
  };
}

export interface GenerateShotJobData {
  type: "generate-shot";
  shotId: string;
  sceneId: string;
  projectId: string;
  parentJobId?: string;
  config: {
    quality: "draft" | "standard" | "high" | "ultra";
    resolution: { width: number; height: number };
    fps: number;
    shotType: string;
    cameraMovement: string;
    duration: number;
    prompt: string;
  };
}

export interface GenerateAudioJobData {
  type: "generate-audio";
  sceneId: string;
  projectId: string;
  parentJobId?: string;
  audioType: "dialogue" | "music" | "sfx" | "ambient";
  config: {
    duration: number;
    description: string;
    characterName?: string;
    dialogueText?: string;
  };
}

export interface ComposeFinalJobData {
  type: "compose-final";
  projectId: string;
  userId: string;
  parentJobId?: string;
  shotIds: string[];
  audioIds: string[];
  config: {
    resolution: { width: number; height: number };
    fps: number;
    format: "mp4" | "mov" | "webm";
    codec: "h264" | "h265" | "vp9";
  };
}

export type RenderJobData =
  | GenerateMovieJobData
  | GenerateShotJobData
  | GenerateAudioJobData
  | ComposeFinalJobData;

/* ══════════════════════════════════════════════════════════════════════════════
 *  Job result types
 * ══════════════════════════════════════════════════════════════════════════════ */

export interface GenerateShotResult {
  shotId: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationMs: number;
}

export interface GenerateAudioResult {
  audioId: string;
  audioUrl: string;
  durationMs: number;
}

export interface ComposeFinalResult {
  projectId: string;
  videoUrl: string;
  thumbnailUrl: string;
  totalDurationMs: number;
  fileSize: number;
}

export interface GenerateMovieResult {
  projectId: string;
  shots: GenerateShotResult[];
  audioTracks: GenerateAudioResult[];
  finalVideo?: ComposeFinalResult;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Priority levels by user tier
 * ══════════════════════════════════════════════════════════════════════════════ */

export const TIER_PRIORITY: Record<string, number> = {
  studio: 1,   // highest priority
  pro: 2,
  creator: 3,
  free: 5,     // lowest priority
};

export function getPriorityForTier(tier: string): number {
  return TIER_PRIORITY[tier] ?? 5;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Queue instance
 * ══════════════════════════════════════════════════════════════════════════════ */

export const renderQueue = new Bull<RenderJobData>("movie-render", env.REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // 5s → 25s → 125s
    },
    removeOnComplete: {
      count: 500,   // keep last 500 completed jobs
      age: 86400,   // keep for 24 hours
    },
    removeOnFail: {
      count: 200,
      age: 604800,  // keep failed for 7 days
    },
  },
  limiter: {
    max: 10,       // max 10 jobs per unit
    duration: 60000, // per minute
  },
  settings: {
    stalledInterval: 30000,  // check for stalled jobs every 30s
    maxStalledCount: 2,      // mark as failed after 2 stalled checks
  },
});

/* ══════════════════════════════════════════════════════════════════════════════
 *  Helper: add a render job with the right priority
 * ══════════════════════════════════════════════════════════════════════════════ */

export async function addRenderJob(
  data: RenderJobData,
  userTier: string = "free",
): Promise<Bull.Job<RenderJobData>> {
  const priority = getPriorityForTier(userTier);

  const job = await renderQueue.add(data.type, data, {
    priority,
    // Override defaults per job type
    ...(data.type === "generate-movie" && { timeout: 600000 }),  // 10 min
    ...(data.type === "generate-shot" && { timeout: 120000 }),   // 2 min
    ...(data.type === "generate-audio" && { timeout: 60000 }),   // 1 min
    ...(data.type === "compose-final" && { timeout: 300000 }),   // 5 min
  });

  return job;
}
