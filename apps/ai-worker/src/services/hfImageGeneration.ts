// ─────────────────────────────────────────────────────────────────────────────
// Image generation service — HuggingFace Inference API (no GPU required!)
// Uses HF's free API with FLUX.1-schnell for 1024x1024 high-quality images
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

export class HFImageGenerationService {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(
      __dirname,
      "../python/hf_image_generator.py"
    );
  }

  async generate(config: ImageGenerationConfig): Promise<string> {
    const outputDir = path.join(__dirname, "../../output/images");
    await fs.mkdir(outputDir, { recursive: true });

    const id = crypto.randomBytes(6).toString("hex");
    const outputPath = path.join(outputDir, `${Date.now()}_${id}.png`);

    const pythonConfig = {
      prompt: config.prompt,
      width: config.width || 1024,
      height: config.height || 1024,
      output_path: outputPath,
    };

    return new Promise((resolve, reject) => {
      const pyshell = new PythonShell(this.pythonScriptPath, {
        mode: "json" as const,
        pythonPath: process.env.PYTHON_PATH || "python",
        pythonOptions: ["-u"],
        env: { ...process.env },
      });

      pyshell.send(pythonConfig as any);
      pyshell.end((err) => {
        if (err && !err.message.includes("close")) {
          // Only reject on real send errors
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
    for (const config of configs) {
      const result = await this.generate(config);
      results.push(result);
    }
    return results;
  }
}
