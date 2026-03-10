// ─────────────────────────────────────────────────────────────────────────────
// AI Service — Abstract interface, error classes, mock implementation, and
// dependency-injection factory.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from "node:crypto";
import type {
  ProgressCallback,
  ScriptGenerationConfig,
  ScriptGenerationResult,
  CharacterGenerationConfig,
  CharacterGenerationResult,
  ShotGenerationConfig,
  ShotCharacterRef,
  ShotGenerationResult,
  DialogueGenerationConfig,
  DialogueGenerationResult,
  MusicGenerationConfig,
  MusicGenerationResult,
  SFXGenerationConfig,
  SFXGenerationResult,
  UpscaleConfig,
  UpscaleResult,
  FrameInterpolationConfig,
  FrameInterpolationResult,
  CostableConfig,
  CostEstimate,
} from "./aiService.types.js";

// Re-export types for convenience
export type * from "./aiService.types.js";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Custom error hierarchy
 * ══════════════════════════════════════════════════════════════════════════════ */

export class AIServiceError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;

  constructor(message: string, code: string, retryable = false) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
    this.retryable = retryable;
  }
}

export class InsufficientCreditsError extends AIServiceError {
  public readonly required: number;
  public readonly available: number;

  constructor(required: number, available: number) {
    super(
      `Insufficient credits: need ${required}, have ${available}`,
      "INSUFFICIENT_CREDITS",
    );
    this.name = "InsufficientCreditsError";
    this.required = required;
    this.available = available;
  }
}

export class GenerationFailedError extends AIServiceError {
  public readonly operation: string;

  constructor(operation: string, reason: string, retryable = true) {
    super(
      `${operation} generation failed: ${reason}`,
      "GENERATION_FAILED",
      retryable,
    );
    this.name = "GenerationFailedError";
    this.operation = operation;
  }
}

export class InvalidConfigError extends AIServiceError {
  public readonly field: string;

  constructor(field: string, reason: string) {
    super(
      `Invalid configuration for "${field}": ${reason}`,
      "INVALID_CONFIG",
    );
    this.name = "InvalidConfigError";
    this.field = field;
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Abstract AI service — all providers must implement this contract
 * ══════════════════════════════════════════════════════════════════════════════ */

const noop: ProgressCallback = () => {};

export abstract class AIService {
  /* ── Script ──────────────────────────────────────────────────────────── */
  abstract generateScript(
    config: ScriptGenerationConfig,
    onProgress?: ProgressCallback,
  ): Promise<ScriptGenerationResult>;

  /* ── Character ───────────────────────────────────────────────────────── */
  abstract generateCharacter(
    config: CharacterGenerationConfig,
    onProgress?: ProgressCallback,
  ): Promise<CharacterGenerationResult>;

  /* ── Shot (video) ────────────────────────────────────────────────────── */
  abstract generateShot(
    config: ShotGenerationConfig,
    characters: ShotCharacterRef[],
    environment: string,
    onProgress?: ProgressCallback,
  ): Promise<ShotGenerationResult>;

  /* ── Audio ───────────────────────────────────────────────────────────── */
  abstract generateDialogue(
    config: DialogueGenerationConfig,
    onProgress?: ProgressCallback,
  ): Promise<DialogueGenerationResult>;

  abstract generateMusic(
    config: MusicGenerationConfig,
    onProgress?: ProgressCallback,
  ): Promise<MusicGenerationResult>;

  abstract generateSFX(
    config: SFXGenerationConfig,
    onProgress?: ProgressCallback,
  ): Promise<SFXGenerationResult>;

  /* ── Post-processing ─────────────────────────────────────────────────── */
  abstract upscaleVideo(
    config: UpscaleConfig,
    onProgress?: ProgressCallback,
  ): Promise<UpscaleResult>;

  abstract interpolateFrames(
    config: FrameInterpolationConfig,
    onProgress?: ProgressCallback,
  ): Promise<FrameInterpolationResult>;

  /* ── Cost (concrete — shared logic) ──────────────────────────────────── */
  calculateCost(input: CostableConfig): CostEstimate {
    const breakdown: Record<string, number> = {};

    switch (input.operation) {
      case "script": {
        const base = 5;
        const durationMul = Math.ceil(input.config.duration / 30);
        const scenes = input.config.numScenes ?? Math.ceil(input.config.duration / 15);
        breakdown["base"] = base;
        breakdown["duration"] = durationMul * 2;
        breakdown["scenes"] = scenes;
        break;
      }
      case "character": {
        breakdown["base"] = 10;
        const views = input.config.viewAngles?.length ?? 1;
        breakdown["views"] = (views - 1) * 3;
        break;
      }
      case "shot": {
        const { duration, resolution, quality } = input.config;
        const qualityMul = { draft: 1, standard: 2, high: 4, ultra: 8 }[quality];
        const resMul = resolution.width >= 3840 ? 4 : resolution.width >= 1920 ? 2 : 1;
        breakdown["base"] = 15;
        breakdown["duration"] = Math.ceil(duration) * 3;
        breakdown["quality"] = qualityMul * 5;
        breakdown["resolution"] = resMul * 5;
        breakdown["characters"] = input.characterCount * 5;
        break;
      }
      case "dialogue": {
        breakdown["base"] = 3;
        breakdown["text"] = Math.ceil(input.config.text.length / 100);
        break;
      }
      case "music": {
        breakdown["base"] = 8;
        breakdown["duration"] = Math.ceil(input.config.duration / 10) * 2;
        break;
      }
      case "sfx": {
        breakdown["base"] = 2;
        breakdown["duration"] = Math.ceil((input.config.duration ?? 1) / 5);
        break;
      }
      case "upscale": {
        const pixels = input.config.targetResolution.width * input.config.targetResolution.height;
        breakdown["base"] = 10;
        breakdown["resolution"] = Math.ceil(pixels / 2_073_600); // per 1080p-equivalent
        break;
      }
      case "interpolate": {
        breakdown["base"] = 8;
        breakdown["fps"] = Math.ceil(input.config.targetFPS / 30) * 3;
        break;
      }
    }

    const credits = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return { credits, breakdown };
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Mock AI Service — realistic fake data & configurable delays
 * ══════════════════════════════════════════════════════════════════════════════ */

const CDN = "https://cdn.genesis.ai";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Simulate progressive work, calling onProgress at each step. */
async function simulateProgress(
  totalMs: number,
  steps: number,
  onProgress: ProgressCallback,
  label: string,
): Promise<void> {
  const stepMs = totalMs / steps;
  for (let i = 1; i <= steps; i++) {
    await sleep(stepMs);
    const pct = Math.round((i / steps) * 100);
    onProgress(pct, `${label} — step ${i}/${steps}`);
  }
}

/** Retry wrapper for transient errors. */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  baseDelayMs: number,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err instanceof AIServiceError && !err.retryable) throw err;
      if (attempt < maxAttempts) {
        await sleep(baseDelayMs * Math.pow(2, attempt - 1));
      }
    }
  }
  throw lastError;
}

/* ── Sample screenplay content ────────────────────────────────────────────── */

const MOCK_SCENES = [
  {
    heading: "EXT. CITY SKYLINE - NIGHT",
    action:
      "The camera sweeps across a rain-soaked cityscape, neon lights reflecting in puddles on empty streets. A lone figure walks beneath the glow of a flickering sign.",
    dialogue: [
      { character: "NARRATOR", line: "Every city has its stories. Most are forgotten before dawn." },
    ],
    cameraDirections: ["AERIAL CRANE SHOT", "SLOW PUSH IN"],
  },
  {
    heading: "INT. DETECTIVE'S OFFICE - NIGHT",
    action:
      "A cluttered desk lit by a single desk lamp. Case files and coffee cups crowd every surface. DETECTIVE MILES CARTER leans back in a worn leather chair, studying a photograph.",
    dialogue: [
      { character: "CARTER", line: "This doesn't add up.", parenthetical: "muttering" },
      { character: "DISPATCH", line: "Detective Carter, we have a 10-31 on Fifth and Main." },
      { character: "CARTER", line: "On my way.", parenthetical: "grabbing coat" },
    ],
    cameraDirections: ["MEDIUM SHOT", "RACK FOCUS to photograph"],
  },
  {
    heading: "EXT. ALLEYWAY - NIGHT",
    action:
      "Steam rises from a manhole cover. Carter's flashlight cuts through the darkness, illuminating graffiti-covered walls and a shattered fire escape.",
    dialogue: [
      { character: "CARTER", line: "Someone was here. Recently." },
    ],
    cameraDirections: ["LOW ANGLE", "TRACKING SHOT following Carter"],
  },
  {
    heading: "INT. WAREHOUSE - CONTINUOUS",
    action:
      "Dust particles float in beams of moonlight streaming through broken skylights. Rows of abandoned shipping containers stretch into shadow.",
    dialogue: [
      { character: "UNKNOWN VOICE", line: "You shouldn't have come here, detective." },
      { character: "CARTER", line: "That's what they keep telling me." },
    ],
    cameraDirections: ["WIDE ESTABLISHING SHOT", "WHIP PAN to voice"],
  },
];

export class MockAIService extends AIService {
  /* ── Script ──────────────────────────────────────────────────────────── */
  async generateScript(
    config: ScriptGenerationConfig,
    onProgress: ProgressCallback = noop,
  ): Promise<ScriptGenerationResult> {
    if (!config.prompt) throw new InvalidConfigError("prompt", "Prompt is required");
    if (config.duration <= 0) throw new InvalidConfigError("duration", "Duration must be positive");

    return withRetry(async () => {
      onProgress(0, "Analyzing prompt…");

      const numScenes = config.numScenes ?? Math.min(Math.ceil(config.duration / 15), MOCK_SCENES.length);
      const scenesUsed = MOCK_SCENES.slice(0, numScenes);

      await simulateProgress(2000, 5, onProgress, "Generating screenplay");

      const scenes = scenesUsed.map((s, i) => ({
        sceneNumber: i + 1,
        heading: s.heading,
        action: s.action,
        dialogue: s.dialogue,
        cameraDirections: s.cameraDirections,
        estimatedDuration: Math.round(config.duration / numScenes),
      }));

      const characters = [
        ...new Set(scenes.flatMap((s) => s.dialogue.map((d) => d.character))),
      ];

      const rawScreenplay = scenes
        .map(
          (s) =>
            `${s.heading}\n\n${s.action}\n\n${s.dialogue
              .map(
                (d) =>
                  `        ${d.character}\n${d.parenthetical ? `    (${d.parenthetical})\n` : ""}  ${d.line}`,
              )
              .join("\n\n")}`,
        )
        .join("\n\n---\n\n");

      return {
        title: `Untitled ${config.genre} — ${config.tone}`,
        logline: `A ${config.tone} ${config.genre} story: ${config.prompt.slice(0, 120)}`,
        scenes,
        totalDuration: config.duration,
        characterNames: characters,
        rawScreenplay,
      };
    }, 3, 500);
  }

  /* ── Character ───────────────────────────────────────────────────────── */
  async generateCharacter(
    config: CharacterGenerationConfig,
    onProgress: ProgressCallback = noop,
  ): Promise<CharacterGenerationResult> {
    if (!config.description) throw new InvalidConfigError("description", "Description is required");

    return withRetry(async () => {
      onProgress(0, "Preparing character generation…");

      const charId = randomUUID();
      const views = config.viewAngles ?? ["front"];

      await simulateProgress(3000, 6, onProgress, "Generating character");

      const imageUrls: Record<string, string> = {};
      for (const view of views) {
        imageUrls[view] = `${CDN}/characters/${charId}/${view}.png`;
      }

      return {
        characterId: charId,
        imageUrls,
        thumbnailUrl: `${CDN}/characters/${charId}/thumb.png`,
        referenceEmbedding: Buffer.from(charId).toString("base64"),
        metadata: {
          style: config.style,
          dominantColors: ["#2a2a3a", "#a855f7", "#e0e0e0"],
        },
      };
    }, 3, 500);
  }

  /* ── Shot ─────────────────────────────────────────────────────────────── */
  async generateShot(
    config: ShotGenerationConfig,
    characters: ShotCharacterRef[],
    environment: string,
    onProgress: ProgressCallback = noop,
  ): Promise<ShotGenerationResult> {
    if (config.duration <= 0) throw new InvalidConfigError("duration", "Duration must be positive");
    if (config.resolution.width <= 0 || config.resolution.height <= 0) {
      throw new InvalidConfigError("resolution", "Width and height must be positive");
    }

    return withRetry(async () => {
      onProgress(0, "Initializing shot generation…");

      const shotId = randomUUID();
      const steps = config.quality === "ultra" ? 20 : config.quality === "high" ? 15 : 10;
      await simulateProgress(10000, steps, onProgress, "Rendering shot");

      const frameCount = Math.round(config.duration * config.fps);
      const bytesPerFrame = (config.resolution.width * config.resolution.height * 3) / 20; // rough compressed
      const fileSize = frameCount * bytesPerFrame;

      return {
        shotId,
        videoUrl: `${CDN}/shots/${shotId}.mp4`,
        thumbnailUrl: `${CDN}/shots/${shotId}_thumb.jpg`,
        durationMs: config.duration * 1000,
        frameCount,
        metadata: {
          resolution: config.resolution,
          fps: config.fps,
          codec: "h264",
          fileSize,
        },
      };
    }, 3, 1000);
  }

  /* ── Dialogue ────────────────────────────────────────────────────────── */
  async generateDialogue(
    config: DialogueGenerationConfig,
    onProgress: ProgressCallback = noop,
  ): Promise<DialogueGenerationResult> {
    if (!config.text) throw new InvalidConfigError("text", "Dialogue text is required");

    return withRetry(async () => {
      onProgress(0, "Synthesizing dialogue…");

      await simulateProgress(5000, 8, onProgress, "Generating dialogue audio");

      const words = config.text.split(/\s+/);
      const avgWordMs = 350 / (config.speed ?? 1);
      let cursor = 0;
      const wordTimestamps = words.map((word) => {
        const start = cursor;
        const end = cursor + avgWordMs;
        cursor = end + 50; // small gap
        return { word, startMs: Math.round(start), endMs: Math.round(end) };
      });

      const durationMs = Math.round(cursor);
      const audioId = randomUUID();

      return {
        audioUrl: `${CDN}/audio/dialogue/${audioId}.wav`,
        durationMs,
        wordTimestamps,
      };
    }, 3, 500);
  }

  /* ── Music ───────────────────────────────────────────────────────────── */
  async generateMusic(
    config: MusicGenerationConfig,
    onProgress: ProgressCallback = noop,
  ): Promise<MusicGenerationResult> {
    if (config.duration <= 0) throw new InvalidConfigError("duration", "Duration must be positive");

    return withRetry(async () => {
      onProgress(0, "Composing music…");

      await simulateProgress(5000, 8, onProgress, "Generating music");

      const audioId = randomUUID();
      const bpm = config.tempo ?? (config.mood === "tense" ? 140 : 100);
      const keys = ["C major", "A minor", "G major", "D minor", "F major", "E minor"];
      const key = keys[Math.floor(Math.random() * keys.length)];

      return {
        audioUrl: `${CDN}/audio/music/${audioId}.wav`,
        durationMs: config.duration * 1000,
        bpm,
        key,
      };
    }, 3, 500);
  }

  /* ── SFX ─────────────────────────────────────────────────────────────── */
  async generateSFX(
    config: SFXGenerationConfig,
    onProgress: ProgressCallback = noop,
  ): Promise<SFXGenerationResult> {
    if (!config.description) throw new InvalidConfigError("description", "Description is required");

    return withRetry(async () => {
      onProgress(0, "Generating sound effect…");

      await simulateProgress(3000, 5, onProgress, "Synthesizing SFX");

      const audioId = randomUUID();
      const durationMs = (config.duration ?? 2) * 1000;

      const categories: Record<string, string> = {
        explosion: "impact", gunshot: "impact", thunder: "weather",
        rain: "weather", footstep: "foley", door: "foley",
        car: "mechanical", engine: "mechanical", scream: "vocal",
      };
      const lower = config.description.toLowerCase();
      const category =
        Object.entries(categories).find(([k]) => lower.includes(k))?.[1] ??
        "ambient";

      return {
        audioUrl: `${CDN}/audio/sfx/${audioId}.wav`,
        durationMs,
        category,
      };
    }, 3, 500);
  }

  /* ── Upscale ─────────────────────────────────────────────────────────── */
  async upscaleVideo(
    config: UpscaleConfig,
    onProgress: ProgressCallback = noop,
  ): Promise<UpscaleResult> {
    if (!config.videoUrl) throw new InvalidConfigError("videoUrl", "Video URL is required");

    return withRetry(async () => {
      onProgress(0, "Upscaling video…");

      await simulateProgress(8000, 10, onProgress, "Upscaling");

      const videoId = randomUUID();
      // Guess original resolution from URL or default to 1080p
      const original = { width: 1920, height: 1080 };
      const pixels = config.targetResolution.width * config.targetResolution.height;

      return {
        videoUrl: `${CDN}/upscaled/${videoId}.mp4`,
        originalResolution: original,
        targetResolution: config.targetResolution,
        fileSize: pixels * 3,
      };
    }, 3, 1000);
  }

  /* ── Frame interpolation ─────────────────────────────────────────────── */
  async interpolateFrames(
    config: FrameInterpolationConfig,
    onProgress: ProgressCallback = noop,
  ): Promise<FrameInterpolationResult> {
    if (!config.videoUrl) throw new InvalidConfigError("videoUrl", "Video URL is required");
    if (config.targetFPS <= 0) throw new InvalidConfigError("targetFPS", "Target FPS must be positive");

    return withRetry(async () => {
      onProgress(0, "Interpolating frames…");

      await simulateProgress(6000, 8, onProgress, "Frame interpolation");

      const videoId = randomUUID();
      const originalFPS = 24;
      const ratio = config.targetFPS / originalFPS;
      const baseFrames = 240; // assume 10s at 24fps source

      return {
        videoUrl: `${CDN}/interpolated/${videoId}.mp4`,
        originalFPS,
        targetFPS: config.targetFPS,
        frameCount: Math.round(baseFrames * ratio),
        fileSize: Math.round(baseFrames * ratio * 50_000),
      };
    }, 3, 1000);
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Dependency injection — singleton factory
 * ══════════════════════════════════════════════════════════════════════════════ */

let _instance: AIService | null = null;

/**
 * Get the active AI service.  Defaults to MockAIService.
 * Call `setAIService()` at startup to swap in a real provider.
 */
export function getAIService(): AIService {
  if (!_instance) {
    _instance = new MockAIService();
  }
  return _instance;
}

/**
 * Replace the AI service singleton (e.g. with a real GPU-backed provider).
 */
export function setAIService(service: AIService): void {
  _instance = service;
}
