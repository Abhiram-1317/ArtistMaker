// ─────────────────────────────────────────────────────────────────────────────
// Voice generation service
// Orchestrates dialogue / narration TTS for movie scenes
// ─────────────────────────────────────────────────────────────────────────────

import { PythonShell } from "python-shell";
import path from "path";
import fs from "fs/promises";

// ── Core voice config (used by VoiceGenerationService) ──────────────────────

export interface VoiceConfig {
  text: string;
  speakerReference?: string; // Path to reference audio for cloning
  language?: string;
  emotion?: string;
}

export class VoiceGenerationService {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(
      __dirname,
      "../python/voice_generator.py"
    );
  }

  async generate(config: VoiceConfig): Promise<string> {
    const outputDir = path.join(__dirname, "../../output/audio");
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(
      outputDir,
      `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`
    );

    const pythonConfig = {
      text: config.text,
      speaker_wav: config.speakerReference,
      language: config.language || "en",
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
          reject(new Error(message.error || "Voice generation failed"));
        }
      });

      pyshell.on("error", reject);
      pyshell.on("pythonError", (err) => {
        reject(new Error(`Python error: ${err.message}`));
      });
    });
  }

  async generateDialogue(
    lines: Array<{ text: string; characterVoice: string }>,
  ): Promise<string[]> {
    const audioFiles: string[] = [];

    for (const line of lines) {
      const audio = await this.generate({
        text: line.text,
        speakerReference: line.characterVoice,
      });
      audioFiles.push(audio);
    }

    return audioFiles;
  }
}

// ── Queue-compatible interfaces (used by worker.ts) ─────────────────────────

export interface DialogueLine {
  lineId: string;
  character: string;
  text: string;
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

export async function generateVoiceover(
  req: VoiceoverRequest
): Promise<VoiceoverResult> {
  const start = Date.now();
  const service = new VoiceGenerationService();
  const dialogues: DialogueResult[] = [];

  for (let i = 0; i < req.lines.length; i++) {
    const line = req.lines[i];
    const lineStart = Date.now();

    try {
      const audioPath = await service.generate({
        text: line.text,
        speakerReference: line.speaker,
        language: line.language ?? "en",
      });

      dialogues.push({
        lineId: line.lineId,
        character: line.character,
        success: true,
        audioPath,
        durationMs: Date.now() - lineStart,
      });
    } catch (err) {
      dialogues.push({
        lineId: line.lineId,
        character: line.character,
        success: false,
        durationMs: Date.now() - lineStart,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    sceneId: req.sceneId,
    success: dialogues.every((d) => d.success),
    dialogues,
    totalDurationMs: Date.now() - start,
  };
}
