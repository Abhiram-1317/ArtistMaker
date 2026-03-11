// ─────────────────────────────────────────────────────────────────────────────
// Image generation service — Uses HuggingFace API (FLUX.1-schnell)
// Falls back to local Python pipeline if HF_TOKEN is not available
// ─────────────────────────────────────────────────────────────────────────────

import { execFile } from "child_process";
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
  private pythonPath: string;

  constructor() {
    // Use HuggingFace API-based generator (no local GPU needed)
    this.pythonScriptPath = path.join(
      __dirname,
      "../python/hf_image_generator.py"
    );
    this.pythonPath = process.env.PYTHON_PATH || "python";
  }

  async generate(config: ImageGenerationConfig): Promise<string> {
    const outputDir = path.join(__dirname, "../../output/images");
    await fs.mkdir(outputDir, { recursive: true });

    const id = crypto.randomBytes(6).toString("hex");
    const outputPath = path.join(outputDir, `${Date.now()}_${id}.png`);

    const pythonConfig = JSON.stringify({
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
    });

    return new Promise((resolve, reject) => {
      const child = execFile(
        this.pythonPath,
        ["-u", this.pythonScriptPath],
        { timeout: 120000, env: process.env },
        (error, stdout, stderr) => {
          if (stderr) {
            console.log(`[image-gen] stderr: ${stderr.trim()}`);
          }
          if (error) {
            return reject(new Error(`Image generation failed: ${error.message}`));
          }
          try {
            // Find the JSON line in stdout
            const lines = stdout.trim().split("\n");
            const jsonLine = lines.find(l => l.startsWith("{"));
            if (!jsonLine) {
              return reject(new Error("No JSON output from image generator"));
            }
            const result = JSON.parse(jsonLine);
            if (result.success) {
              resolve(result.output_path);
            } else {
              reject(new Error(result.error || "Image generation failed"));
            }
          } catch (parseErr) {
            reject(new Error(`Failed to parse image gen output: ${stdout}`));
          }
        }
      );

      // Send config via stdin
      child.stdin?.write(pythonConfig + "\n");
      child.stdin?.end();
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
