// ─────────────────────────────────────────────────────────────────────────────
// Image generation service — TypeScript wrapper around Python SDXL pipeline
// ─────────────────────────────────────────────────────────────────────────────

import { PythonShell } from "python-shell";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export interface ImageGenerationConfig {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numSteps?: number;
  guidanceScale?: number;
  seed?: number;
}

export class ImageGenerationService {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(
      __dirname,
      "../python/image_generator.py"
    );
  }

  async generate(config: ImageGenerationConfig): Promise<string> {
    const outputDir = path.join(__dirname, "../../output/images");
    await fs.mkdir(outputDir, { recursive: true });

    const id = crypto.randomBytes(6).toString("hex");
    const outputPath = path.join(outputDir, `${Date.now()}_${id}.png`);

    const pythonConfig = {
      prompt: config.prompt,
      negative_prompt:
        config.negativePrompt ||
        "blurry, low quality, distorted, deformed, ugly",
      width: config.width || 512,
      height: config.height || 512,
      num_steps: config.numSteps || 4,
      guidance_scale: config.guidanceScale ?? 0.0,
      seed: config.seed ?? -1,
      output_path: outputPath,
    };

    return new Promise((resolve, reject) => {
      const pyshell = new PythonShell(this.pythonScriptPath, {
        mode: "json" as const,
        pythonPath: process.env.PYTHON_PATH || "python",
        pythonOptions: ["-u"],
      });

      // Send config to Python script via stdin
      pyshell.send(JSON.stringify(pythonConfig));
      pyshell.end((err) => {
        if (err && !err.message.includes("close")) {
          // Only reject on real send errors, not on expected close
        }
      });

      pyshell.on(
        "message",
        (message: { success: boolean; output_path: string; error?: string }) => {
          if (message.success) {
            resolve(message.output_path);
          } else {
            reject(new Error(message.error || "Image generation failed"));
          }
        }
      );

      pyshell.on("error", reject);

      pyshell.on("pythonError", (err) => {
        reject(new Error(`Python error: ${err.message}`));
      });
    });
  }

  async generateBatch(configs: ImageGenerationConfig[]): Promise<string[]> {
    const results: string[] = [];
    // Run sequentially to avoid GPU OOM
    for (const config of configs) {
      const result = await this.generate(config);
      results.push(result);
    }
    return results;
  }
}
