import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export const maxDuration = 120;

function runPython(
  pythonPath: string,
  scriptPath: string,
  input: string,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(pythonPath, [scriptPath], {
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    proc.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`Python exited ${code}: ${stderr}`));
    });

    proc.on("error", (err) => reject(err));

    proc.stdin.write(input + "\n");
    proc.stdin.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, numFrames = 24, fps = 8 } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: "A prompt of at least 3 characters is required." },
        { status: 400 },
      );
    }

    const token = process.env.HF_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "HF_TOKEN not configured on server." },
        { status: 500 },
      );
    }

    const videoDir = path.join(process.cwd(), "public", "generated", "videos");
    await mkdir(videoDir, { recursive: true });

    const filename = `vid_${Date.now()}.mp4`;
    const outputPath = path.join(videoDir, filename);

    // Try using the Python script if available
    const aiWorkerRoot = path.resolve(process.cwd(), "..", "ai-worker");
    const scriptPath = path.join(aiWorkerRoot, "src", "python", "hf_video_generator.py");
    const venvPython = path.join(aiWorkerRoot, ".venv", "Scripts", "python.exe");
    const hasPython = fs.existsSync(venvPython) && fs.existsSync(scriptPath);

    if (hasPython) {
      // Use Python script for proper Ken Burns video
      const input = JSON.stringify({
        prompt: prompt.trim(),
        output_path: outputPath,
        num_frames: numFrames,
        fps,
        mode: "text-to-video",
        zoom_end: 1.15,
        pan_x: 0.03,
        pan_y: 0.01,
      });

      const { stdout, stderr } = await runPython(venvPython, scriptPath, input);
      console.log("[VIDEO_GEN] stderr:", stderr);

      const result = JSON.parse(stdout.trim());
      if (!result.success) {
        return NextResponse.json(
          { error: "Video generation failed in Python" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        videoUrl: `/generated/videos/${filename}`,
        numFrames: result.num_frames,
        fps: result.fps,
        duration: result.duration,
        prompt: prompt.trim(),
      });
    }

    // Fallback: generate a keyframe image via HF API and return as image
    // (no Python available for video encoding)
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt.trim(),
          parameters: { width: 1024, height: 576 },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[VIDEO_GEN] HF API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Video generation failed: ${response.status}` },
        { status: 502 },
      );
    }

    // Save keyframe as image fallback
    const imgBuffer = Buffer.from(await response.arrayBuffer());
    const imgFilename = `vid_${Date.now()}_keyframe.png`;
    const imgDir = path.join(process.cwd(), "public", "generated", "images");
    await mkdir(imgDir, { recursive: true });
    await writeFile(path.join(imgDir, imgFilename), imgBuffer);

    return NextResponse.json({
      success: true,
      videoUrl: `/generated/images/${imgFilename}`,
      isKeyframeOnly: true,
      message: "Python not available — generated keyframe image only. Set up AI worker for video output.",
      prompt: prompt.trim(),
    });
  } catch (error) {
    console.error("[VIDEO_GEN] Error:", error);
    return NextResponse.json(
      { error: "Video generation failed. Please try again." },
      { status: 500 },
    );
  }
}
