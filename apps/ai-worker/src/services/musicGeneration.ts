// ─────────────────────────────────────────────────────────────────────────────
// Music / soundtrack generation service
// Orchestrates background music generation for scenes
// ─────────────────────────────────────────────────────────────────────────────

import path from "path";
import fs from "fs/promises";
import { generateMusic } from "../models/musicModel.js";
import { env } from "../config/env.js";

export interface SoundtrackRequest {
  projectId: string;
  sceneId: string;
  sceneNumber: number;
  prompt: string;
  /** Duration of the soundtrack in seconds */
  durationSec?: number;
  /** Musical mood: epic, tense, romantic, peaceful, etc. */
  mood?: string;
  /** Genre: orchestral, electronic, ambient, rock, etc. */
  genre?: string;
  /** Temperature for sampling creativity (0.0 – 1.5) */
  temperature?: number;
}

export interface SoundtrackResult {
  sceneId: string;
  success: boolean;
  audioPath?: string;
  audioDurationSec?: number;
  totalDurationMs: number;
  error?: string;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function generateSoundtrack(
  req: SoundtrackRequest
): Promise<SoundtrackResult> {
  const start = Date.now();
  const outDir = path.resolve(
    env.OUTPUT_DIR,
    req.projectId,
    `scene-${req.sceneNumber}`
  );
  await ensureDir(outDir);

  const audioPath = path.join(outDir, "soundtrack.wav");

  // Build enriched music prompt
  const parts = [req.prompt];
  if (req.mood) parts.push(req.mood);
  if (req.genre) parts.push(req.genre);
  parts.push("high quality", "cinematic");
  const enrichedPrompt = parts.join(", ");

  const result = await generateMusic({
    prompt: enrichedPrompt,
    durationSec: req.durationSec ?? 10,
    temperature: req.temperature ?? 1.0,
    topK: 250,
    outputPath: audioPath,
  });

  return {
    sceneId: req.sceneId,
    success: result.success,
    audioPath: result.success ? result.outputPath : undefined,
    audioDurationSec: result.audioDurationSec,
    totalDurationMs: Date.now() - start,
    error: result.error,
  };
}
