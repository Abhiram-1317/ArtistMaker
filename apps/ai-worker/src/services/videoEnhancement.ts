// ─────────────────────────────────────────────────────────────────────────────
// Video enhancement service — frame interpolation + upscaling
// Wraps Python scripts (RIFE / optical-flow and Real-ESRGAN) via PythonShell.
// ─────────────────────────────────────────────────────────────────────────────

import { PythonShell } from "python-shell";
import path from "path";
import fs from "fs/promises";

export class VideoEnhancementService {
  private interpolationScript: string;
  private upscalerScript: string;

  constructor() {
    this.interpolationScript = path.join(
      __dirname,
      "../python/frame_interpolation.py",
    );
    this.upscalerScript = path.join(
      __dirname,
      "../python/video_upscaler.py",
    );
  }

  /**
   * Interpolate frames to increase FPS (e.g. 8 fps → 24 fps).
   * Uses RIFE when available, otherwise falls back to optical-flow blending.
   */
  async interpolateFrames(
    videoPath: string,
    targetFps: number = 24,
  ): Promise<string> {
    const outputPath = videoPath.replace(/\.mp4$/i, `_${targetFps}fps.mp4`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
      const pyshell = new PythonShell(this.interpolationScript, {
        mode: "json",
        pythonPath: process.env.PYTHON_PATH || "python3",
        pythonOptions: ["-u"],
        env: { ...process.env },
      });

      pyshell.send(
        JSON.stringify({
          input_video: videoPath,
          output_video: outputPath,
          target_fps: targetFps,
        }),
      );

      pyshell.end((err) => {
        if (err && !err.message.includes("close")) {
          /* swallow benign close errors */
        }
      });

      pyshell.on("message", (msg: any) => {
        if (msg.success) {
          resolve(msg.output_path);
        } else {
          reject(new Error(msg.error || "Frame interpolation failed"));
        }
      });

      pyshell.on("error", reject);
      pyshell.on("pythonError", (err) => {
        reject(new Error(`Python error: ${err.message}`));
      });
    });
  }

  /**
   * Upscale video to a target resolution using Real-ESRGAN.
   */
  async upscale(
    videoPath: string,
    width: number = 1920,
    height: number = 1080,
  ): Promise<string> {
    const outputPath = videoPath.replace(
      /\.mp4$/i,
      `_${width}x${height}.mp4`,
    );
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
      const pyshell = new PythonShell(this.upscalerScript, {
        mode: "json",
        pythonPath: process.env.PYTHON_PATH || "python3",
        pythonOptions: ["-u"],
        env: { ...process.env },
      });

      pyshell.send(
        JSON.stringify({
          input_video: videoPath,
          output_video: outputPath,
          width,
          height,
          scale: width > 1024 ? 2 : 1,
        }),
      );

      pyshell.end((err) => {
        if (err && !err.message.includes("close")) {
          /* swallow benign close errors */
        }
      });

      pyshell.on("message", (msg: any) => {
        if (msg.success) {
          resolve(msg.output_path);
        } else {
          reject(new Error(msg.error || "Video upscaling failed"));
        }
      });

      pyshell.on("error", reject);
      pyshell.on("pythonError", (err) => {
        reject(new Error(`Python error: ${err.message}`));
      });
    });
  }
}
