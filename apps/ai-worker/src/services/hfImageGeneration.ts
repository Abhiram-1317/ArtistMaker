// ─────────────────────────────────────────────────────────────────────────────
// Image generation service — HuggingFace Inference API (no GPU required!)
// Uses HF's free API to generate images on their servers
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs/promises";
import path from "path";
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
  private apiUrl: string;
  private headers: Record<string, string>;

  constructor() {
    const token = process.env.HF_TOKEN;
    if (!token) {
      console.warn(
        "No HF_TOKEN set. Get a free token at https://huggingface.co/settings/tokens"
      );
    }
    this.apiUrl =
      "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";
    this.headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async generate(config: ImageGenerationConfig): Promise<string> {
    const outputDir = path.join(__dirname, "../../output/images");
    await fs.mkdir(outputDir, { recursive: true });

    const id = crypto.randomBytes(6).toString("hex");
    const outputPath = path.join(outputDir, `${Date.now()}_${id}.png`);

    const payload = {
      inputs: config.prompt,
      parameters: {
        negative_prompt:
          config.negativePrompt ||
          "blurry, low quality, distorted, deformed, ugly",
        width: config.width || 1024,
        height: config.height || 1024,
        ...(config.seed !== undefined && config.seed !== -1
          ? { seed: config.seed }
          : {}),
      },
    };

    // Call HuggingFace Inference API
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Model is loading — wait and retry
      if (response.status === 503) {
        const data = JSON.parse(errorText);
        const waitTime = Math.min((data.estimated_time || 20) * 1000, 120000);
        console.log(
          `Model is loading, waiting ${(waitTime / 1000).toFixed(0)}s...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.generate(config);
      }

      throw new Error(`HF API error (${response.status}): ${errorText}`);
    }

    // Response is the image binary
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, buffer);

    return outputPath;
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
