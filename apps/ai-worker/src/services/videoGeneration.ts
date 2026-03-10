// ─────────────────────────────────────────────────────────────────────────────
// Video generation service
// Orchestrates the full pipeline: prompt → image → video → compositing
// ─────────────────────────────────────────────────────────────────────────────

import path from "path";
import fs from "fs/promises";
import { generateImage } from "../models/videoModel.js";
import { generateVideo } from "../models/videoModel.js";
import { env } from "../config/env.js";

export interface SceneRequest {
  projectId: string;
  sceneId: string;
  sceneNumber: number;
  prompt: string;
  negativePrompt?: string;
  style?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  seed?: number;
}

export interface SceneResult {
  sceneId: string;
  success: boolean;
  keyframePath?: string;
  videoPath?: string;
  totalDurationMs: number;
  error?: string;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Generates a single scene: first creates a keyframe image, then animates it
 * into a short video clip.
 */
export async function generateScene(req: SceneRequest): Promise<SceneResult> {
  const start = Date.now();
  const outDir = path.resolve(
    env.OUTPUT_DIR,
    req.projectId,
    `scene-${req.sceneNumber}`
  );
  await ensureDir(outDir);

  const keyframePath = path.join(outDir, "keyframe.png");
  const videoPath = path.join(outDir, "clip.mp4");

  // Build enriched prompt with style modifier
  const styledPrompt = req.style
    ? `${req.prompt}, ${req.style} style, cinematic lighting, high quality`
    : `${req.prompt}, cinematic lighting, high quality, detailed`;

  // Step 1: Generate keyframe image
  const imgResult = await generateImage({
    prompt: styledPrompt,
    negativePrompt:
      req.negativePrompt ??
      "blurry, low quality, distorted, watermark, text, ugly",
    width: req.width ?? 1024,
    height: req.height ?? 576,
    steps: 30,
    guidanceScale: 7.5,
    seed: req.seed,
    outputPath: keyframePath,
  });

  if (!imgResult.success) {
    return {
      sceneId: req.sceneId,
      success: false,
      totalDurationMs: Date.now() - start,
      error: `Image generation failed: ${imgResult.error}`,
    };
  }

  // Step 2: Animate keyframe into video
  const vidResult = await generateVideo({
    input: keyframePath,
    inputType: "image",
    width: req.width ?? 1024,
    height: req.height ?? 576,
    numFrames: (req.durationSec ?? 3) * 8, // 8 fps default
    fps: 8,
    seed: req.seed,
    outputPath: videoPath,
  });

  if (!vidResult.success) {
    return {
      sceneId: req.sceneId,
      success: false,
      keyframePath,
      totalDurationMs: Date.now() - start,
      error: `Video generation failed: ${vidResult.error}`,
    };
  }

  return {
    sceneId: req.sceneId,
    success: true,
    keyframePath,
    videoPath,
    totalDurationMs: Date.now() - start,
  };
}

/**
 * Generates all scenes for a project sequentially.
 * In the future this can run scenes in parallel on multi-GPU setups.
 */
export async function generateAllScenes(
  scenes: SceneRequest[]
): Promise<SceneResult[]> {
  const results: SceneResult[] = [];

  for (const scene of scenes) {
    const result = await generateScene(scene);
    results.push(result);

    // If a scene fails, continue with remaining scenes but log the error
    if (!result.success) {
      console.error(
        `Scene ${scene.sceneNumber} failed: ${result.error}`
      );
    }
  }

  return results;
}
