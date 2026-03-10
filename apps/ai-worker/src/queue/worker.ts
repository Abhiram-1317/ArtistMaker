// ─────────────────────────────────────────────────────────────────────────────
// Bull queue worker — processes render jobs from Redis
// ─────────────────────────────────────────────────────────────────────────────

import Bull from "bull";
import { env } from "../config/env.js";
import {
  generateScene,
  generateAllScenes,
  type SceneRequest,
} from "../services/videoGeneration.js";
import {
  generateVoiceover,
  type VoiceoverRequest,
} from "../services/voiceGeneration.js";
import {
  generateSoundtrack,
  type SoundtrackRequest,
} from "../services/musicGeneration.js";

// ── Job type definitions ─────────────────────────────────────────────────────

export type JobType = "render-scene" | "render-project" | "voiceover" | "soundtrack";

interface RenderSceneJob {
  type: "render-scene";
  scene: SceneRequest;
}

interface RenderProjectJob {
  type: "render-project";
  projectId: string;
  scenes: SceneRequest[];
}

interface VoiceoverJob {
  type: "voiceover";
  request: VoiceoverRequest;
}

interface SoundtrackJob {
  type: "soundtrack";
  request: SoundtrackRequest;
}

type WorkerJob = RenderSceneJob | RenderProjectJob | VoiceoverJob | SoundtrackJob;

// ── Queue setup ──────────────────────────────────────────────────────────────

export const renderQueue = new Bull<WorkerJob>("ai-render", env.REDIS_URL, {
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: 100, // keep last 100 completed jobs
    removeOnFail: 200,
    timeout: 600_000, // 10 min timeout per job
  },
  settings: {
    stalledInterval: 120_000, // check stalled every 2 min
    maxStalledCount: 1,
  },
});

// ── Worker processor ─────────────────────────────────────────────────────────

export function startWorker(): void {
  renderQueue.process(env.WORKER_CONCURRENCY, async (job) => {
    const { data } = job;

    console.log(
      `[worker] Processing job ${job.id} — type: ${data.type}`
    );

    switch (data.type) {
      case "render-scene": {
        await job.progress(10);
        const result = await generateScene(data.scene);
        await job.progress(100);
        return result;
      }

      case "render-project": {
        const total = data.scenes.length;
        const results = [];

        for (let i = 0; i < total; i++) {
          const scene = data.scenes[i];
          await job.progress(Math.round(((i) / total) * 100));
          const result = await generateScene(scene);
          results.push(result);

          // Log per-scene progress
          console.log(
            `[worker] Scene ${i + 1}/${total} — ${result.success ? "OK" : "FAILED"} (${result.totalDurationMs}ms)`
          );
        }

        await job.progress(100);
        return {
          projectId: data.projectId,
          scenes: results,
          allSucceeded: results.every((r) => r.success),
        };
      }

      case "voiceover": {
        await job.progress(10);
        const result = await generateVoiceover(data.request);
        await job.progress(100);
        return result;
      }

      case "soundtrack": {
        await job.progress(10);
        const result = await generateSoundtrack(data.request);
        await job.progress(100);
        return result;
      }

      default:
        throw new Error(`Unknown job type: ${(data as { type: string }).type}`);
    }
  });

  // ── Queue event listeners ────────────────────────────────────────────────

  renderQueue.on("completed", (job, result) => {
    console.log(
      `[worker] Job ${job.id} completed — type: ${job.data.type}`
    );

    // TODO: POST result back to API server for status update
    // fetch(`${env.API_URL}/api/jobs/${job.id}/complete`, { ... })
  });

  renderQueue.on("failed", (job, err) => {
    console.error(
      `[worker] Job ${job.id} failed — type: ${job.data.type} — ${err.message}`
    );
  });

  renderQueue.on("stalled", (job) => {
    console.warn(`[worker] Job ${job.id} stalled`);
  });

  renderQueue.on("error", (err) => {
    console.error("[worker] Queue error:", err.message);
  });

  console.log(
    `[worker] Started with concurrency=${env.WORKER_CONCURRENCY}`
  );
}

// ── Helper: add a job programmatically ───────────────────────────────────────

export async function enqueueJob(
  data: WorkerJob,
  opts?: Bull.JobOptions
): Promise<Bull.Job<WorkerJob>> {
  return renderQueue.add(data, {
    ...opts,
    // Priority: render-project is lower priority (takes longer)
    priority: data.type === "render-project" ? 10 : 5,
  });
}
