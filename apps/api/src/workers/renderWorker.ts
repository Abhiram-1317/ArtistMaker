// ─────────────────────────────────────────────────────────────────────────────
// Render Worker — processes movie generation jobs from the Bull queue,
// using the AI service for all generation operations.
// ─────────────────────────────────────────────────────────────────────────────

import type Bull from "bull";
import { randomUUID } from "node:crypto";
import {
  renderQueue,
  addRenderJob,
  type RenderJobData,
  type GenerateMovieJobData,
  type GenerateShotJobData,
  type GenerateAudioJobData,
  type ComposeFinalJobData,
  type GenerateMovieResult,
  type GenerateShotResult,
  type GenerateAudioResult,
  type ComposeFinalResult,
} from "../queues/renderQueue.js";
import { queueEvents } from "../queues/queueEvents.js";
import {
  emitRenderProgress,
  emitRenderComplete,
  emitRenderError,
  emitRenderStatus,
} from "../websocket/renderEmitter.js";
import {
  getAIService,
  AIServiceError,
  type AIService,
  type ScriptGenerationResult,
  type CharacterGenerationResult,
  type ShotCharacterRef,
  type ProgressCallback,
  type CostEstimate,
} from "../services/aiService.js";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Helpers
 * ══════════════════════════════════════════════════════════════════════════════ */

/** Generate a mock CDN-style URL */
function mockUrl(prefix: string, id: string, ext: string): string {
  return `https://cdn.genesis.ai/${prefix}/${id}.${ext}`;
}

/** Build a progress callback that maps an AI service 0–100 range into a
 *  slice of the overall job progress and emits WebSocket events. */
function makeProgressCb(
  job: Bull.Job,
  projectId: string,
  stage: string,
  rangeStart: number,
  rangeEnd: number,
  shotId?: string,
): ProgressCallback {
  return (pct: number, message: string) => {
    const overall = Math.round(rangeStart + (pct / 100) * (rangeEnd - rangeStart));
    job.progress(overall).catch(() => {});
    emitRenderProgress(projectId, { stage, progress: overall, shotId, message });
    emitRenderStatus(projectId, { projectStatus: "generating", overallProgress: overall });
  };
}

/** Process items in parallel batches of `size`. */
async function batchParallel<T, R>(
  items: T[],
  size: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const batchResults = await Promise.all(
      batch.map((item, bi) => fn(item, i + bi)),
    );
    results.push(...batchResults);
  }
  return results;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Cost tracker — accumulates credits as generation progresses
 * ══════════════════════════════════════════════════════════════════════════════ */

class CostTracker {
  private _spent = 0;
  private _estimates: CostEstimate[] = [];

  get totalSpent(): number { return this._spent; }

  addEstimate(estimate: CostEstimate): void {
    this._estimates.push(estimate);
  }

  commit(estimate: CostEstimate): void {
    this._spent += estimate.credits;
  }

  get estimatedTotal(): number {
    return this._estimates.reduce((s, e) => s + e.credits, 0);
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Processor: generate-movie
 *  Orchestrates the full movie generation pipeline using AI service.
 *
 *  Progress budget:
 *    0- 5%  Initializing + script generation
 *    5-20%  Character generation
 *   20-30%  Scene breakdown / shot planning
 *   30-80%  Shot generation (batched ×4)
 *   80-90%  Audio generation (dialogue + music + SFX)
 *   90-100% Final composition
 * ══════════════════════════════════════════════════════════════════════════════ */

async function processGenerateMovie(
  job: Bull.Job<GenerateMovieJobData>,
): Promise<GenerateMovieResult> {
  const { projectId, userId, config } = job.data;
  const ai: AIService = getAIService();
  const costs = new CostTracker();

  console.log(`🎬 [generate-movie] Starting for project ${projectId}`);

  // Notify clients
  emitRenderProgress(projectId, {
    stage: "script analysis",
    progress: 0,
    message: "Starting movie generation…",
  });
  emitRenderStatus(projectId, { projectStatus: "generating", overallProgress: 0 });

  try {
    // ── Step 1: Script Generation (0–5%) ─────────────────────────────────

    const scriptConfig = {
      prompt: `Project ${projectId} screenplay`,
      genre: "cinematic",
      duration: 60,
      tone: "dramatic",
    };
    const scriptCost = ai.calculateCost({ operation: "script", config: scriptConfig });
    costs.addEstimate(scriptCost);

    const script: ScriptGenerationResult = await ai.generateScript(
      scriptConfig,
      makeProgressCb(job, projectId, "script analysis", 0, 5),
    );
    costs.commit(scriptCost);

    await job.progress(5);
    emitRenderProgress(projectId, {
      stage: "script analysis",
      progress: 5,
      message: `Script ready — "${script.title}" with ${script.scenes.length} scenes`,
    });

    // ── Step 2: Character Generation (5–20%) ─────────────────────────────

    const uniqueCharacters = script.characterNames;
    const characterResults: CharacterGenerationResult[] = [];

    for (let ci = 0; ci < uniqueCharacters.length; ci++) {
      const charName = uniqueCharacters[ci];
      const charConfig = {
        description: charName,
        style: "photorealistic",
        viewAngles: ["front" as const, "three-quarter" as const],
      };
      const charCost = ai.calculateCost({ operation: "character", config: charConfig });
      costs.addEstimate(charCost);

      const rangeStart = 5 + (ci / uniqueCharacters.length) * 15;
      const rangeEnd = 5 + ((ci + 1) / uniqueCharacters.length) * 15;

      const charResult = await ai.generateCharacter(
        charConfig,
        makeProgressCb(job, projectId, "character generation", rangeStart, rangeEnd),
      );
      characterResults.push(charResult);
      costs.commit(charCost);

      emitRenderProgress(projectId, {
        stage: "character generation",
        progress: Math.round(rangeEnd),
        message: `Character "${charName}" generated (${ci + 1}/${uniqueCharacters.length})`,
      });
    }

    await job.progress(20);

    // ── Step 3: Scene Breakdown & Shot Planning (20–30%) ─────────────────

    emitRenderProgress(projectId, {
      stage: "scene planning",
      progress: 20,
      message: "Breaking down scenes and planning shots…",
    });

    // Build character references for shot generation
    const charRefsByName: Record<string, ShotCharacterRef> = {};
    for (let ci = 0; ci < uniqueCharacters.length; ci++) {
      charRefsByName[uniqueCharacters[ci]] = {
        characterId: characterResults[ci].characterId,
        referenceEmbedding: characterResults[ci].referenceEmbedding,
      };
    }

    // Plan shots from each script scene
    interface PlannedShot {
      shotId: string;
      sceneIndex: number;
      sceneHeading: string;
      prompt: string;
      shotType: string;
      cameraMovement: string;
      duration: number;
      characters: ShotCharacterRef[];
      environment: string;
    }

    const plannedShots: PlannedShot[] = [];
    for (let si = 0; si < script.scenes.length; si++) {
      const scene = script.scenes[si];
      const sceneChars = scene.dialogue.map((d) => d.character);
      const refs = sceneChars
        .map((name) => charRefsByName[name])
        .filter(Boolean);

      // Each scene gets 2-3 shots based on its camera directions
      const numShots = Math.max(2, Math.min(scene.cameraDirections.length, 3));
      for (let shi = 0; shi < numShots; shi++) {
        plannedShots.push({
          shotId: `shot-${randomUUID().slice(0, 8)}`,
          sceneIndex: si,
          sceneHeading: scene.heading,
          prompt: `${scene.heading}. ${scene.action.slice(0, 120)}`,
          shotType: shi === 0 ? "wide" : shi === 1 ? "medium" : "close-up",
          cameraMovement: scene.cameraDirections[shi] ?? "static",
          duration: Math.round(scene.estimatedDuration / numShots),
          characters: refs,
          environment: scene.heading,
        });
      }

      const planProgress = 20 + ((si + 1) / script.scenes.length) * 10;
      await job.progress(Math.round(planProgress));
      emitRenderProgress(projectId, {
        stage: "scene planning",
        progress: Math.round(planProgress),
        message: `Scene ${si + 1}/${script.scenes.length} planned — ${numShots} shots`,
      });
    }

    await job.progress(30);
    emitRenderProgress(projectId, {
      stage: "scene planning",
      progress: 30,
      message: `${plannedShots.length} shots planned across ${script.scenes.length} scenes`,
    });

    // ── Step 4: Shot Generation (30–80%) — batches of 4 ──────────────────

    const shotResults: GenerateShotResult[] = await batchParallel(
      plannedShots,
      4,
      async (planned, idx) => {
        const shotConfig = {
          prompt: planned.prompt,
          shotType: planned.shotType,
          cameraMovement: planned.cameraMovement,
          duration: planned.duration,
          resolution: config.resolution,
          fps: config.fps,
          quality: config.quality,
          environment: planned.environment,
        };
        const shotCost = ai.calculateCost({
          operation: "shot",
          config: shotConfig,
          characterCount: planned.characters.length,
        });
        costs.addEstimate(shotCost);

        const rangeStart = 30 + (idx / plannedShots.length) * 50;
        const rangeEnd = 30 + ((idx + 1) / plannedShots.length) * 50;

        emitRenderProgress(projectId, {
          stage: "scene rendering",
          progress: Math.round(rangeStart),
          shotId: planned.shotId,
          message: `Rendering shot ${idx + 1}/${plannedShots.length} — ${planned.shotType}`,
        });

        const aiResult = await ai.generateShot(
          shotConfig,
          planned.characters,
          planned.environment,
          makeProgressCb(job, projectId, "scene rendering", rangeStart, rangeEnd, planned.shotId),
        );
        costs.commit(shotCost);

        const result: GenerateShotResult = {
          shotId: planned.shotId,
          videoUrl: aiResult.videoUrl,
          thumbnailUrl: aiResult.thumbnailUrl,
          durationMs: aiResult.durationMs,
        };

        emitRenderComplete(projectId, {
          shotId: result.shotId,
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl,
        });

        return result;
      },
    );

    await job.progress(80);
    emitRenderProgress(projectId, {
      stage: "scene rendering",
      progress: 80,
      message: `All ${shotResults.length} shots rendered`,
    });

    // ── Step 5: Audio Generation (80–90%) ────────────────────────────────

    emitRenderProgress(projectId, {
      stage: "audio synthesis",
      progress: 80,
      message: "Generating audio tracks…",
    });

    const audioResults: GenerateAudioResult[] = [];

    // 5a: Dialogue for scenes that have it
    const scenesWithDialogue = script.scenes.filter((s) => s.dialogue.length > 0);
    for (let di = 0; di < scenesWithDialogue.length; di++) {
      const scene = scenesWithDialogue[di];
      for (const dlg of scene.dialogue) {
        const dlgConfig = {
          text: dlg.line,
          voiceProfile: dlg.character.toLowerCase(),
          emotion: dlg.parenthetical,
        };
        const dlgCost = ai.calculateCost({ operation: "dialogue", config: dlgConfig });
        costs.addEstimate(dlgCost);

        const dlgResult = await ai.generateDialogue(
          dlgConfig,
          makeProgressCb(job, projectId, "audio synthesis", 80, 85),
        );
        costs.commit(dlgCost);

        audioResults.push({
          audioId: `dlg-${randomUUID().slice(0, 8)}`,
          audioUrl: dlgResult.audioUrl,
          durationMs: dlgResult.durationMs,
        });
      }
    }

    // 5b: Background music
    const musicConfig = { mood: "dramatic", genre: "cinematic", duration: script.totalDuration };
    const musicCost = ai.calculateCost({ operation: "music", config: musicConfig });
    costs.addEstimate(musicCost);

    const musicResult = await ai.generateMusic(
      musicConfig,
      makeProgressCb(job, projectId, "audio synthesis", 85, 88),
    );
    costs.commit(musicCost);

    audioResults.push({
      audioId: `music-${randomUUID().slice(0, 8)}`,
      audioUrl: musicResult.audioUrl,
      durationMs: musicResult.durationMs,
    });

    // 5c: Sound effects
    const sfxConfig = { description: "Ambient cinematic atmosphere", duration: script.totalDuration };
    const sfxCost = ai.calculateCost({ operation: "sfx", config: sfxConfig });
    costs.addEstimate(sfxCost);

    const sfxResult = await ai.generateSFX(
      sfxConfig,
      makeProgressCb(job, projectId, "audio synthesis", 88, 90),
    );
    costs.commit(sfxCost);

    audioResults.push({
      audioId: `sfx-${randomUUID().slice(0, 8)}`,
      audioUrl: sfxResult.audioUrl,
      durationMs: sfxResult.durationMs,
    });

    await job.progress(90);
    emitRenderProgress(projectId, {
      stage: "audio synthesis",
      progress: 90,
      message: `${audioResults.length} audio tracks generated`,
    });

    // ── Step 6: Final Composition (90–100%) ──────────────────────────────

    emitRenderProgress(projectId, {
      stage: "final composition",
      progress: 90,
      message: "Composing final video…",
    });

    const composeJob = await addRenderJob(
      {
        type: "compose-final",
        projectId,
        userId,
        parentJobId: job.id.toString(),
        shotIds: shotResults.map((s) => s.shotId),
        audioIds: audioResults.map((a) => a.audioId),
        config: {
          resolution: config.resolution,
          fps: config.fps,
          format: "mp4",
          codec: "h264",
        },
      },
      "studio",
    );

    const finalResult = await composeJob.finished() as ComposeFinalResult;

    await job.progress(100);

    const result: GenerateMovieResult = {
      projectId,
      shots: shotResults,
      audioTracks: audioResults,
      finalVideo: finalResult,
    };

    // WebSocket: done
    emitRenderStatus(projectId, { projectStatus: "completed", overallProgress: 100 });
    emitRenderProgress(projectId, {
      stage: "final composition",
      progress: 100,
      message: `Movie complete! ${shotResults.length} shots, ${audioResults.length} audio tracks. Credits used: ${costs.totalSpent}`,
    });

    console.log(
      `🎬 [generate-movie] Completed project ${projectId} — ${costs.totalSpent} credits spent`,
    );
    return result;

  } catch (err) {
    // ── Error handling ───────────────────────────────────────────────────
    const message = err instanceof Error ? err.message : String(err);
    const errorName = err instanceof AIServiceError ? err.code : "GENERATION_FAILED";
    const isRetryable = err instanceof AIServiceError && err.retryable;

    console.error(`🎬 [generate-movie] Failed for project ${projectId}: ${message}`);

    emitRenderError(projectId, { error: errorName, message });
    emitRenderStatus(projectId, { projectStatus: "failed", overallProgress: 0 });

    // Re-throw so Bull can handle retry if applicable
    if (isRetryable) throw err;
    // For non-retryable errors, wrap to prevent Bull retries
    const wrapped = new Error(message);
    wrapped.name = errorName;
    throw wrapped;
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Processor: generate-shot
 *  Uses AI service to generate a single shot.
 * ══════════════════════════════════════════════════════════════════════════════ */

async function processGenerateShot(
  job: Bull.Job<GenerateShotJobData>,
): Promise<GenerateShotResult> {
  const { shotId, sceneId, projectId, config } = job.data;
  const ai: AIService = getAIService();

  console.log(`📸 [generate-shot] Processing shot ${shotId} in scene ${sceneId}`);

  emitRenderProgress(projectId, {
    stage: "generating-shot",
    progress: 0,
    shotId,
    message: `Generating shot ${shotId}…`,
  });

  try {
    const shotConfig = {
      prompt: config.prompt,
      shotType: config.shotType,
      cameraMovement: config.cameraMovement,
      duration: config.duration,
      resolution: config.resolution,
      fps: config.fps,
      quality: config.quality,
    };

    const progressCb = makeProgressCb(job, projectId, "generating-shot", 0, 100, shotId);
    const aiResult = await ai.generateShot(shotConfig, [], sceneId, progressCb);

    const result: GenerateShotResult = {
      shotId,
      videoUrl: aiResult.videoUrl,
      thumbnailUrl: aiResult.thumbnailUrl,
      durationMs: aiResult.durationMs,
    };

    emitRenderComplete(projectId, {
      shotId: result.shotId,
      videoUrl: result.videoUrl,
      thumbnailUrl: result.thumbnailUrl,
    });

    console.log(`📸 [generate-shot] Completed shot ${shotId}`);
    return result;

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitRenderError(projectId, { shotId, error: "SHOT_GENERATION_FAILED", message });
    throw err;
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Processor: generate-audio
 *  Uses AI service for dialogue, music, or SFX.
 * ══════════════════════════════════════════════════════════════════════════════ */

async function processGenerateAudio(
  job: Bull.Job<GenerateAudioJobData>,
): Promise<GenerateAudioResult> {
  const { sceneId, projectId, audioType, config } = job.data;
  const ai: AIService = getAIService();
  const audioId = `audio-${randomUUID().slice(0, 8)}`;

  console.log(`🎵 [generate-audio] Processing ${audioType} for scene ${sceneId}`);

  const progressCb = makeProgressCb(job, projectId, "generating-audio", 0, 100);

  try {
    let audioUrl: string;
    let durationMs: number;

    switch (audioType) {
      case "dialogue": {
        const result = await ai.generateDialogue(
          {
            text: config.dialogueText ?? config.description,
            voiceProfile: config.characterName ?? "default",
          },
          progressCb,
        );
        audioUrl = result.audioUrl;
        durationMs = result.durationMs;
        break;
      }
      case "music": {
        const result = await ai.generateMusic(
          { mood: "dramatic", genre: "cinematic", duration: config.duration },
          progressCb,
        );
        audioUrl = result.audioUrl;
        durationMs = result.durationMs;
        break;
      }
      case "sfx": {
        const result = await ai.generateSFX(
          { description: config.description, duration: config.duration },
          progressCb,
        );
        audioUrl = result.audioUrl;
        durationMs = result.durationMs;
        break;
      }
      case "ambient":
      default: {
        const result = await ai.generateSFX(
          { description: config.description || "Ambient atmosphere", duration: config.duration },
          progressCb,
        );
        audioUrl = result.audioUrl;
        durationMs = result.durationMs;
        break;
      }
    }

    const result: GenerateAudioResult = { audioId, audioUrl, durationMs };
    console.log(`🎵 [generate-audio] Completed ${audioType} for scene ${sceneId}`);
    return result;

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitRenderError(projectId, { error: "AUDIO_GENERATION_FAILED", message });
    throw err;
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Processor: compose-final
 *  Collects all shot videos + audio tracks and produces the final movie.
 * ══════════════════════════════════════════════════════════════════════════════ */

async function processComposeFinal(
  job: Bull.Job<ComposeFinalJobData>,
): Promise<ComposeFinalResult> {
  const { projectId, shotIds, audioIds, config } = job.data;
  console.log(
    `🎞️  [compose-final] Composing ${shotIds.length} shots + ${audioIds.length} audio for project ${projectId}`,
  );

  emitRenderProgress(projectId, {
    stage: "final composition",
    progress: 90,
    message: "Stitching video tracks…",
  });

  // Composition uses sequential phases (no AI service call yet — placeholder)
  const phases = [
    { label: "stitching-video", weight: 30 },
    { label: "mixing-audio", weight: 40 },
    { label: "encoding", weight: 30 },
  ];
  let done = 0;
  for (const phase of phases) {
    const steps = 2;
    for (let i = 1; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 800));
      done += phase.weight / steps;
      const progress = Math.round(done);
      await job.progress(progress);
      queueEvents.emitProgress(job.id.toString(), "compose-final", progress, {
        projectId,
        phase: phase.label,
      });
      emitRenderProgress(projectId, {
        stage: "final composition",
        progress: 90 + Math.round(done / 10),
        message: `${phase.label.replace("-", " ")}… ${Math.round(done)}%`,
      });
    }
  }

  const result: ComposeFinalResult = {
    projectId,
    videoUrl: mockUrl("movies", projectId, config.format),
    thumbnailUrl: mockUrl("thumbnails", `movie-${projectId}`, "webp"),
    totalDurationMs: shotIds.length * 4000,
    fileSize: 1024 * 1024 * 50,
  };

  console.log(`🎞️  [compose-final] Completed project ${projectId}`);
  return result;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Main dispatch processor
 * ══════════════════════════════════════════════════════════════════════════════ */

function processJob(job: Bull.Job<RenderJobData>) {
  switch (job.data.type) {
    case "generate-movie":
      return processGenerateMovie(job as Bull.Job<GenerateMovieJobData>);
    case "generate-shot":
      return processGenerateShot(job as Bull.Job<GenerateShotJobData>);
    case "generate-audio":
      return processGenerateAudio(job as Bull.Job<GenerateAudioJobData>);
    case "compose-final":
      return processComposeFinal(job as Bull.Job<ComposeFinalJobData>);
    default:
      throw new Error(`Unknown job type: ${(job.data as RenderJobData).type}`);
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Start the worker
 * ══════════════════════════════════════════════════════════════════════════════ */

export function startRenderWorker(concurrency: number = 3): void {
  renderQueue.process("generate-movie", 1, (job) =>
    processJob(job),
  );
  renderQueue.process("generate-shot", concurrency, (job) =>
    processJob(job),
  );
  renderQueue.process("generate-audio", concurrency, (job) =>
    processJob(job),
  );
  renderQueue.process("compose-final", 1, (job) =>
    processJob(job),
  );

  // Global error handling
  renderQueue.on("error", (error: Error) => {
    console.error("[RenderWorker] Queue error:", error.message);
  });

  renderQueue.on("failed", (job: Bull.Job<RenderJobData>, error: Error) => {
    console.error(
      `[RenderWorker] Job ${job.id} (${job.data.type}) failed after ${job.attemptsMade} attempts:`,
      error.message,
    );

    const projectId = job.data.projectId;
    emitRenderError(projectId, {
      shotId: "shotId" in job.data ? (job.data as { shotId: string }).shotId : undefined,
      error: error.name,
      message: error.message,
    });
    emitRenderStatus(projectId, {
      projectStatus: "failed",
      overallProgress: 0,
    });
  });

  console.log(
    `🔧 Render worker started (concurrency: ${concurrency})`,
  );
}
