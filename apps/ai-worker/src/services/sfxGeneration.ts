// ─────────────────────────────────────────────────────────────────────────────
// Sound effects generation service
// Uses Meta's AudioGen via Python subprocess
// ─────────────────────────────────────────────────────────────────────────────

import { PythonShell } from "python-shell";
import path from "path";
import fs from "fs/promises";

export interface SFXConfig {
  description: string;
  duration?: number;
}

export interface SFXResult {
  success: boolean;
  outputPath?: string;
  durationSec?: number;
  error?: string;
}

export class SFXGenerationService {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(
      __dirname,
      "../python/sfx_generator.py"
    );
  }

  async generate(config: SFXConfig): Promise<string> {
    const outputDir = path.join(__dirname, "../../output/sfx");
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(
      outputDir,
      `sfx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`
    );

    const pythonConfig = {
      description: config.description,
      duration: config.duration || 5,
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
          reject(new Error(message.error || "SFX generation failed"));
        }
      });

      pyshell.on("error", reject);
      pyshell.on("pythonError", (err) => {
        reject(new Error(`Python error: ${err.message}`));
      });
    });
  }

  async generateSceneSFX(scene: any): Promise<string[]> {
    const sfxDescriptions = this.extractSFXFromScene(scene);
    const results: string[] = [];

    for (const desc of sfxDescriptions) {
      const outputPath = await this.generate({
        description: desc,
        duration: 3,
      });
      results.push(outputPath);
    }

    return results;
  }

  extractSFXFromScene(scene: any): string[] {
    const actions: string[] = [];
    const description: string = scene.description || "";

    const sfxPatterns: Record<string, string> = {
      "door|gate": "door opening and closing with a creak",
      "car|vehicle|drive": "car engine revving and driving",
      "rain|storm": "heavy rain with thunder",
      "gun|shoot|fire": "gunshot with echo",
      "explo": "loud explosion with debris",
      "walk|step|foot": "footsteps on hard floor",
      "wind|breeze": "gentle wind blowing",
      "water|ocean|wave": "ocean waves crashing on shore",
      "bird|chirp": "birds chirping in nature",
      "crowd|people": "crowd murmuring in background",
      "phone|ring|call": "phone ringing",
      "glass|break|shatter": "glass shattering",
      "knock": "knocking on wooden door",
      "scream|shout|yell": "person screaming in fear",
      "music|piano|guitar": "background ambient music playing",
    };

    const lowerDesc = description.toLowerCase();
    for (const [pattern, sfx] of Object.entries(sfxPatterns)) {
      if (new RegExp(pattern, "i").test(lowerDesc)) {
        actions.push(sfx);
      }
    }

    // If nothing matched, provide ambient sound
    if (actions.length === 0 && description.length > 0) {
      actions.push("ambient room tone with subtle background noise");
    }

    return actions;
  }
}

export async function generateSFX(config: SFXConfig): Promise<SFXResult> {
  const start = Date.now();
  const service = new SFXGenerationService();

  try {
    const outputPath = await service.generate(config);
    return {
      success: true,
      outputPath,
      durationSec: config.duration || 5,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
