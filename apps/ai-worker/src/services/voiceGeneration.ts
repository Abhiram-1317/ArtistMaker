// ─────────────────────────────────────────────────────────────────────────────
// Voice generation service
// Orchestrates dialogue / narration TTS for movie scenes
// ─────────────────────────────────────────────────────────────────────────────

import path from "path";
import fs from "fs/promises";
import { generateVoice } from "../models/voiceModel.js";
import { env } from "../config/env.js";

export interface DialogueLine {
  lineId: string;
  character: string;
  text: string;
  /** Voice preset matching a character voice profile */
  speaker?: string;
  language?: string;
  speed?: number;
}

export interface VoiceoverRequest {
  projectId: string;
  sceneId: string;
  sceneNumber: number;
  lines: DialogueLine[];
}

export interface DialogueResult {
  lineId: string;
  character: string;
  success: boolean;
  audioPath?: string;
  audioDurationSec?: number;
  durationMs: number;
  error?: string;
}

export interface VoiceoverResult {
  sceneId: string;
  success: boolean;
  dialogues: DialogueResult[];
  totalDurationMs: number;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function generateVoiceover(
  req: VoiceoverRequest
): Promise<VoiceoverResult> {
  const start = Date.now();
  const outDir = path.resolve(
    env.OUTPUT_DIR,
    req.projectId,
    `scene-${req.sceneNumber}`,
    "dialogue"
  );
  await ensureDir(outDir);

  const dialogues: DialogueResult[] = [];

  for (let i = 0; i < req.lines.length; i++) {
    const line = req.lines[i];
    const audioPath = path.join(
      outDir,
      `line-${i.toString().padStart(3, "0")}-${line.character}.wav`
    );

    const result = await generateVoice({
      text: line.text,
      speaker: line.speaker,
      language: line.language ?? "en",
      speed: line.speed ?? 1.0,
      outputPath: audioPath,
    });

    dialogues.push({
      lineId: line.lineId,
      character: line.character,
      success: result.success,
      audioPath: result.success ? result.outputPath : undefined,
      audioDurationSec: result.audioDurationSec,
      durationMs: result.durationMs,
      error: result.error,
    });
  }

  const allSuccess = dialogues.every((d) => d.success);

  return {
    sceneId: req.sceneId,
    success: allSuccess,
    dialogues,
    totalDurationMs: Date.now() - start,
  };
}
