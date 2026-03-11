// ─────────────────────────────────────────────────────────────────────────────
// Music / soundtrack generation service
// Orchestrates background music generation for scenes
// ─────────────────────────────────────────────────────────────────────────────

import { PythonShell } from "python-shell";
import path from "path";
import fs from "fs/promises";

// ── Core music config (used by MusicGenerationService) ──────────────────────

export interface MusicConfig {
  description: string;
  duration?: number;
  temperature?: number;
  modelSize?: "small" | "medium" | "large";
  continuationFrom?: string; // Audio file to continue from
}

export class MusicGenerationService {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(
      __dirname,
      "../python/music_generator.py"
    );
  }

  async generate(config: MusicConfig): Promise<string> {
    const outputDir = path.join(__dirname, "../../output/music");
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(
      outputDir,
      `music_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`
    );

    const pythonConfig = {
      description: config.description,
      duration: config.duration || 30,
      temperature: config.temperature || 1.0,
      model_size: config.modelSize || "medium",
      continuation_from: config.continuationFrom,
      output_path: outputPath,
    };

    return new Promise((resolve, reject) => {
      const pyshell = new PythonShell(this.pythonScriptPath, {
        mode: "json",
        pythonPath: process.env.PYTHON_PATH || "python3",
        pythonOptions: ["-u"],
        env: { ...process.env },
      });

      pyshell.send(JSON.stringify(pythonConfig));
      pyshell.end((err) => {
        if (err && !err.message.includes("close")) {
          // Only reject on real send errors
        }
      });

      pyshell.on("message", (message: any) => {
        if (message.success) {
          resolve(message.output_path);
        } else {
          reject(new Error(message.error || "Music generation failed"));
        }
      });

      pyshell.on("error", reject);
      pyshell.on("pythonError", (err) => {
        reject(new Error(`Python error: ${err.message}`));
      });
    });
  }

  async generateSceneMusic(scene: any): Promise<string> {
    const description = this.buildMusicDescription(scene);

    return await this.generate({
      description,
      duration: scene.durationSeconds,
      temperature: 1.0,
    });
  }

  private buildMusicDescription(scene: any): string {
    const parts: string[] = [];

    const moodMap: Record<string, string> = {
      tense: "suspenseful, dramatic orchestral music with rising tension",
      peaceful: "calm, serene ambient music with soft piano",
      exciting: "upbeat, energetic electronic music with driving beat",
      melancholic: "sad, emotional piano music with strings",
      epic: "grand, cinematic orchestral music with powerful brass",
      romantic: "gentle, romantic music with soft strings and piano",
      mysterious: "mysterious, dark ambient music with subtle tension",
      action: "intense, fast-paced action music with heavy drums",
    };

    if (scene.mood && moodMap[scene.mood]) {
      parts.push(moodMap[scene.mood]);
    }

    if (scene.genre) {
      parts.push(`in ${scene.genre} style`);
    }

    const timeMap: Record<string, string> = {
      night: "with dark, mysterious tones",
      dawn: "with hopeful, rising melodies",
      day: "with bright, clear tones",
      dusk: "with warm, fading harmonies",
    };

    if (scene.timeOfDay && timeMap[scene.timeOfDay]) {
      parts.push(timeMap[scene.timeOfDay]);
    }

    return parts.join(", ") || "cinematic background music";
  }
}

// ── Queue-compatible interfaces (used by worker.ts) ─────────────────────────

export interface SoundtrackRequest {
  projectId: string;
  sceneId: string;
  sceneNumber: number;
  prompt: string;
  durationSec?: number;
  mood?: string;
  genre?: string;
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

export async function generateSoundtrack(
  req: SoundtrackRequest
): Promise<SoundtrackResult> {
  const start = Date.now();
  const service = new MusicGenerationService();

  // Build enriched music prompt
  const parts = [req.prompt];
  if (req.mood) parts.push(req.mood);
  if (req.genre) parts.push(req.genre);
  parts.push("high quality", "cinematic");
  const enrichedPrompt = parts.join(", ");

  try {
    const audioPath = await service.generate({
      description: enrichedPrompt,
      duration: req.durationSec ?? 10,
      temperature: req.temperature ?? 1.0,
    });

    return {
      sceneId: req.sceneId,
      success: true,
      audioPath,
      totalDurationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      sceneId: req.sceneId,
      success: false,
      totalDurationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
