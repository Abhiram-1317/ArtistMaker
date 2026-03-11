// ─────────────────────────────────────────────────────────────────────────────
// Video generation service — HuggingFace Inference API (no GPU required!)
// Supports text-to-video and image-to-video via HF's free inference models
// ─────────────────────────────────────────────────────────────────────────────

import { PythonShell } from "python-shell";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export interface VideoGenerationConfig {
  prompt: string;
  negativePrompt?: string;
  numFrames?: number;
  fps?: number;
  seed?: number;
}

export interface ImageToVideoConfig {
  imagePath: string;
  numFrames?: number;
  fps?: number;
  seed?: number;
}

export interface VideoResult {
  success: boolean;
  outputPath: string;
  numFrames: number;
  fps: number;
  fileSize: number;
  duration: number;
  mode: string;
}

export class HFVideoGenerationService {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(
      __dirname,
      "../python/hf_video_generator.py"
    );
  }

  /**
   * Generate a video from a text prompt using HF Inference API
   */
  async textToVideo(config: VideoGenerationConfig): Promise<VideoResult> {
    const outputDir = path.join(__dirname, "../../output/videos");
    await fs.mkdir(outputDir, { recursive: true });

    const id = crypto.randomBytes(6).toString("hex");
    const outputPath = path.join(outputDir, `${Date.now()}_${id}.mp4`);

    const pythonConfig = {
      prompt: config.prompt,
      num_frames: config.numFrames ?? 16,
      fps: config.fps ?? 8,
      output_path: outputPath,
      mode: "text-to-video",
    };

    return this.runPython(pythonConfig);
  }

  /**
   * Generate a video from an input image using HF Inference API (SVD)
   */
  async imageToVideo(config: ImageToVideoConfig): Promise<VideoResult> {
    const outputDir = path.join(__dirname, "../../output/videos");
    await fs.mkdir(outputDir, { recursive: true });

    const id = crypto.randomBytes(6).toString("hex");
    const outputPath = path.join(outputDir, `${Date.now()}_${id}.mp4`);

    const pythonConfig = {
      prompt: "",
      image_path: config.imagePath,
      num_frames: config.numFrames ?? 25,
      fps: config.fps ?? 7,
      output_path: outputPath,
      mode: "image-to-video",
    };

    return this.runPython(pythonConfig);
  }

  private runPython(pythonConfig: Record<string, unknown>): Promise<VideoResult> {
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

      pyshell.on("message", (message: any) => {
        if (message.success) {
          resolve({
            success: true,
            outputPath: message.output_path,
            numFrames: message.num_frames,
            fps: message.fps,
            fileSize: message.file_size,
            duration: message.duration,
            mode: message.mode,
          });
        } else {
          reject(new Error(message.error || "Video generation failed"));
        }
      });

      pyshell.on("error", reject);
      pyshell.on("pythonError", (err) => {
        reject(new Error(`Python error: ${err.message}`));
      });
    });
  }
}
