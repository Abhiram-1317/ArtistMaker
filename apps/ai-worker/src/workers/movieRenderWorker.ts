// ─────────────────────────────────────────────────────────────────────────────
// Movie Render Worker — full pipeline processor
// Listens to the "movie-render" Bull queue for "generate-movie" jobs
// and orchestrates character → shots → audio → final composition.
// ─────────────────────────────────────────────────────────────────────────────

import Bull from "bull";
import { env } from "../config/env.js";
import { AIOrchestrator } from "../services/aiOrchestrator.js";
import type { GeneratedCharacter, AudioTrackOutput } from "../services/aiOrchestrator.js";
import { VideoCompositionService } from "../services/videoComposition.js";
import path from "path";
import fs from "fs/promises";

// ── Types ────────────────────────────────────────────────────────────────────

interface GenerateMovieJob {
  projectId: string;
  userId: string;
  project: {
    stylePreset?: string;
    resolution?: string;
    characters: Array<{
      id: string;
      name: string;
      description?: string;
      voiceProfile?: any;
    }>;
    scenes: Array<{
      id: string;
      sceneNumber: number;
      locationDescription?: string;
      timeOfDay?: string;
      weather?: string;
      mood?: string;
      durationSeconds?: number;
      dialogue?: any;
      description?: string;
      shots: Array<{
        id: string;
        shotNumber: number;
        shotType: string;
        cameraAngle: string;
        durationSeconds: number;
        description?: string;
        negativePrompt?: string;
        charactersInShot?: string[];
        sceneId: string;
      }>;
    }>;
  };
}

interface MovieRenderResult {
  projectId: string;
  success: boolean;
  characters: GeneratedCharacter[];
  shots: Array<{
    shotId: string;
    videoPath: string;
    thumbnailPath: string;
  }>;
  audioTracks: AudioTrackOutput[];
  finalVideoPath?: string;
}

// ── Queue & worker setup ─────────────────────────────────────────────────────

const movieRenderQueue = new Bull<GenerateMovieJob>(
  "movie-render",
  env.REDIS_URL,
  {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: 100,
      removeOnFail: 200,
      timeout: 1_800_000, // 30 min for full movie
    },
    settings: {
      stalledInterval: 120_000,
      maxStalledCount: 2,
    },
  },
);

export { movieRenderQueue };

// ── Progress helper ──────────────────────────────────────────────────────────

async function emitProgress(
  job: Bull.Job<GenerateMovieJob>,
  stage: string,
  stageProgress: number,
  overallPercent: number,
): Promise<void> {
  await job.progress(Math.round(overallPercent));
  job.log(`[${stage}] ${Math.round(stageProgress)}%`);
}

// ── Processing logic ─────────────────────────────────────────────────────────

async function processMovieJob(
  job: Bull.Job<GenerateMovieJob>,
): Promise<MovieRenderResult> {
  const { projectId, project } = job.data;
  const orchestrator = new AIOrchestrator();

  console.log(`\n🎬 [movie-render] Starting generation for project ${projectId}`);

  // ── STEP 1: Generate characters (0% → 10%) ────────────────────────────

  console.log("\n👤 Generating characters…");
  await emitProgress(job, "characters", 0, 0);

  const generatedCharacters: GeneratedCharacter[] = [];

  for (let i = 0; i < project.characters.length; i++) {
    const char = project.characters[i];

    const generated = await orchestrator.generateCharacter({
      id: char.id,
      name: char.name,
      description: char.description || char.name,
      voiceDescription:
        typeof char.voiceProfile === "string"
          ? char.voiceProfile
          : `Default voice for ${char.name}`,
      style: project.stylePreset,
    });

    generatedCharacters.push(generated);

    const charPct = ((i + 1) / project.characters.length) * 100;
    await emitProgress(job, "characters", charPct, charPct * 0.1);
  }

  // ── STEP 2: Generate all shots (10% → 70%) ────────────────────────────

  console.log("\n🎥 Generating video shots…");
  await emitProgress(job, "shots", 0, 10);

  const allShots = project.scenes.flatMap((s) =>
    s.shots.map((shot) => ({ ...shot, scene: s })),
  );
  const totalShots = allShots.length;

  const generatedShots: Array<{
    shotId: string;
    videoPath: string;
    thumbnailPath: string;
  }> = [];

  for (let i = 0; i < totalShots; i++) {
    const shot = allShots[i];
    const scene = shot.scene;

    console.log(`  Shot ${i + 1}/${totalShots}`);

    const generated = await orchestrator.generateShot(
      {
        shotNumber: shot.shotNumber,
        sceneNumber: scene.sceneNumber,
        shotType: shot.shotType,
        cameraAngle: shot.cameraAngle,
        locationDescription: scene.locationDescription || "",
        description: shot.description,
        negativePrompt: shot.negativePrompt,
        timeOfDay: scene.timeOfDay,
        weather: scene.weather,
        style: project.stylePreset,
        resolution: project.resolution,
        durationSeconds: shot.durationSeconds,
        charactersInShot: shot.charactersInShot,
      },
      generatedCharacters,
    );

    generatedShots.push({
      shotId: shot.id,
      videoPath: generated.videoPath,
      thumbnailPath: generated.thumbnailPath,
    });

    const shotPct = ((i + 1) / totalShots) * 100;
    await emitProgress(job, "shots", shotPct, 10 + shotPct * 0.6);
  }

  // ── STEP 3: Generate audio (70% → 85%) ────────────────────────────────

  console.log("\n🎵 Generating audio…");
  await emitProgress(job, "audio", 0, 70);

  const allAudioTracks: AudioTrackOutput[] = [];

  for (let i = 0; i < project.scenes.length; i++) {
    const scene = project.scenes[i];

    const audioTracks = await orchestrator.generateSceneAudio(
      scene,
      generatedCharacters,
    );

    allAudioTracks.push(...audioTracks);

    const audioPct = ((i + 1) / project.scenes.length) * 100;
    await emitProgress(job, "audio", audioPct, 70 + audioPct * 0.15);
  }

  // ── STEP 4: Final composition via FFmpeg (85% → 100%) ─────────────────

  console.log("\n🎞️ Composing final movie…");
  await emitProgress(job, "composition", 0, 85);

  const outputDir = path.join(env.OUTPUT_DIR, projectId);
  await fs.mkdir(outputDir, { recursive: true });

  // Save manifest for debugging / re-composition
  const manifest = {
    projectId,
    shots: generatedShots,
    audioTracks: allAudioTracks,
    generatedAt: new Date().toISOString(),
  };
  await fs.writeFile(
    path.join(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  // Compose final video with FFmpeg
  let finalVideoPath: string | undefined;
  try {
    const compositor = new VideoCompositionService();
    finalVideoPath = await compositor.composeMovie(
      generatedShots,
      allAudioTracks,
      outputDir,
    );
  } catch (compErr) {
    console.warn(`[worker] FFmpeg composition failed, returning individual assets: ${compErr instanceof Error ? compErr.message : compErr}`);
  }

  await emitProgress(job, "composition", 100, 100);

  console.log(`\n✅ Movie generation complete for project ${projectId}`);

  return {
    projectId,
    success: true,
    characters: generatedCharacters,
    shots: generatedShots,
    audioTracks: allAudioTracks,
    finalVideoPath,
  };
}

// ── Start worker ─────────────────────────────────────────────────────────────

export function startMovieRenderWorker(): void {
  movieRenderQueue.process("generate-movie", 1, async (job) => {
    return await processMovieJob(job);
  });

  movieRenderQueue.on("completed", (job, result) => {
    console.log(
      `[movie-render] ✅ Job ${job.id} completed — project ${result.projectId}`,
    );
  });

  movieRenderQueue.on("failed", (job, err) => {
    console.error(
      `[movie-render] ❌ Job ${job.id} failed — ${err.message}`,
    );
  });

  movieRenderQueue.on("stalled", (job) => {
    console.warn(`[movie-render] ⚠️  Job ${job.id} stalled`);
  });

  movieRenderQueue.on("error", (err) => {
    console.error("[movie-render] Queue error:", err.message);
  });

  console.log("[movie-render] 🎬 Worker started (concurrency=1)");
}

// ── Enqueue helper ───────────────────────────────────────────────────────────

export async function enqueueMovieRender(
  data: GenerateMovieJob,
  opts?: Bull.JobOptions,
): Promise<Bull.Job<GenerateMovieJob>> {
  return movieRenderQueue.add("generate-movie", data, {
    priority: 1,
    ...opts,
  });
}
