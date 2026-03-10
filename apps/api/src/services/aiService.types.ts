// ─────────────────────────────────────────────────────────────────────────────
// AI Service — Type definitions for all AI generation operations
// ─────────────────────────────────────────────────────────────────────────────

/* ══════════════════════════════════════════════════════════════════════════════
 *  Progress callback
 * ══════════════════════════════════════════════════════════════════════════════ */

/** Called by AI operations to report progress (0–100). */
export type ProgressCallback = (
  progress: number,
  message: string,
) => void;

/* ══════════════════════════════════════════════════════════════════════════════
 *  Script generation
 * ══════════════════════════════════════════════════════════════════════════════ */

export interface ScriptGenerationConfig {
  prompt: string;
  genre: string;
  duration: number;        // target duration in seconds
  tone: string;            // e.g. "dramatic", "comedic", "suspenseful"
  style?: string;
  numScenes?: number;
}

export interface ScriptScene {
  sceneNumber: number;
  heading: string;         // INT./EXT. LOCATION - TIME
  action: string;
  dialogue: Array<{
    character: string;
    line: string;
    parenthetical?: string;
  }>;
  cameraDirections: string[];
  estimatedDuration: number; // seconds
}

export interface ScriptGenerationResult {
  title: string;
  logline: string;
  scenes: ScriptScene[];
  totalDuration: number;
  characterNames: string[];
  rawScreenplay: string;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Character generation
 * ══════════════════════════════════════════════════════════════════════════════ */

export interface CharacterGenerationConfig {
  description: string;
  style: string;           // e.g. "photorealistic", "anime", "stylized"
  age?: string;
  gender?: string;
  ethnicity?: string;
  clothing?: string;
  expression?: string;
  viewAngles?: Array<"front" | "side" | "three-quarter" | "back">;
}

export interface CharacterGenerationResult {
  characterId: string;
  imageUrls: Record<string, string>;   // viewAngle → url
  thumbnailUrl: string;
  referenceEmbedding: string;          // base64 encoded vector for consistency
  metadata: {
    style: string;
    dominantColors: string[];
  };
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Shot generation
 * ══════════════════════════════════════════════════════════════════════════════ */

export interface ShotGenerationConfig {
  prompt: string;
  shotType: string;           // "wide", "medium", "close-up", "extreme-close-up"
  cameraMovement: string;     // "static", "pan", "tilt", "dolly", "crane", "handheld"
  duration: number;           // seconds
  resolution: { width: number; height: number };
  fps: number;
  quality: "draft" | "standard" | "high" | "ultra";
  environment?: string;
  lighting?: string;
  timeOfDay?: string;
  weather?: string;
}

export interface ShotCharacterRef {
  characterId: string;
  referenceEmbedding: string;
  position?: string;          // "left", "center", "right"
  action?: string;
}

export interface ShotGenerationResult {
  shotId: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationMs: number;
  frameCount: number;
  metadata: {
    resolution: { width: number; height: number };
    fps: number;
    codec: string;
    fileSize: number;
  };
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Audio generation — dialogue, music, SFX
 * ══════════════════════════════════════════════════════════════════════════════ */

export interface DialogueGenerationConfig {
  text: string;
  voiceProfile: string;       // voice ID or description
  emotion?: string;
  speed?: number;             // 0.5–2.0, default 1.0
  pitch?: number;             // -12 to 12 semitones
}

export interface DialogueGenerationResult {
  audioUrl: string;
  durationMs: number;
  wordTimestamps: Array<{
    word: string;
    startMs: number;
    endMs: number;
  }>;
}

export interface MusicGenerationConfig {
  mood: string;
  genre: string;
  duration: number;           // seconds
  tempo?: number;             // BPM
  instruments?: string[];
  reference?: string;         // reference track description
}

export interface MusicGenerationResult {
  audioUrl: string;
  durationMs: number;
  bpm: number;
  key: string;
}

export interface SFXGenerationConfig {
  description: string;
  duration?: number;          // seconds, optional for one-shot sounds
  intensity?: number;         // 0.0–1.0
}

export interface SFXGenerationResult {
  audioUrl: string;
  durationMs: number;
  category: string;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Post-processing — upscale, frame interpolation
 * ══════════════════════════════════════════════════════════════════════════════ */

export interface UpscaleConfig {
  videoUrl: string;
  targetResolution: { width: number; height: number };
  model?: "standard" | "film" | "anime";
}

export interface UpscaleResult {
  videoUrl: string;
  originalResolution: { width: number; height: number };
  targetResolution: { width: number; height: number };
  fileSize: number;
}

export interface FrameInterpolationConfig {
  videoUrl: string;
  targetFPS: number;
  model?: "standard" | "film";
}

export interface FrameInterpolationResult {
  videoUrl: string;
  originalFPS: number;
  targetFPS: number;
  frameCount: number;
  fileSize: number;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Cost calculation
 * ══════════════════════════════════════════════════════════════════════════════ */

export type CostableConfig =
  | { operation: "script";     config: ScriptGenerationConfig }
  | { operation: "character";  config: CharacterGenerationConfig }
  | { operation: "shot";       config: ShotGenerationConfig; characterCount: number }
  | { operation: "dialogue";   config: DialogueGenerationConfig }
  | { operation: "music";      config: MusicGenerationConfig }
  | { operation: "sfx";        config: SFXGenerationConfig }
  | { operation: "upscale";    config: UpscaleConfig }
  | { operation: "interpolate"; config: FrameInterpolationConfig };

export interface CostEstimate {
  credits: number;
  breakdown: Record<string, number>;
}
