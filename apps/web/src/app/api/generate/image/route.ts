import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { prompt, width = 1024, height = 1024 } = await req.json();

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

    // Call HuggingFace Inference API (router endpoint)
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
          parameters: { width, height },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[IMAGE_GEN] HF API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Image generation failed: ${response.status}` },
        { status: 502 },
      );
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Save to public/generated/images/
    const filename = `img_${Date.now()}.png`;
    const dir = path.join(process.cwd(), "public", "generated", "images");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), imageBuffer);

    const imageUrl = `/generated/images/${filename}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      width,
      height,
      prompt: prompt.trim(),
    });
  } catch (error) {
    console.error("[IMAGE_GEN] Error:", error);
    return NextResponse.json(
      { error: "Image generation failed. Please try again." },
      { status: 500 },
    );
  }
}
