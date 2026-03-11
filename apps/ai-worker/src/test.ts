// ─────────────────────────────────────────────────────────────────────────────
// Quick test for image and video generation
// Run: npx tsx src/test.ts [--api|--local] [--video] [--i2v <image_path>]
// Modes: --local (uses local GPU/CPU)  --api (uses HuggingFace free API)
//        --video (generate a text-to-video clip)
//        --i2v <path> (image-to-video: animate an existing image)
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";

async function testImage() {
  const useApi = process.argv.includes("--api") || !process.argv.includes("--local");

  console.log("=".repeat(50));
  console.log("  Project Genesis — Image Generation Test");
  console.log(`  Mode: ${useApi ? "HuggingFace API (free, no GPU)" : "Local (GPU/CPU)"}`);
  console.log("=".repeat(50));

  const prompt = "A lone astronaut standing on Mars, cinematic lighting, highly detailed, 8k";

  console.log(`\nGenerating image...`);
  console.log(`Prompt: ${prompt}`);

  const start = Date.now();
  let imagePath: string;

  if (useApi) {
    const { HFImageGenerationService } = await import("./services/hfImageGeneration.js");
    const service = new HFImageGenerationService();
    imagePath = await service.generate({
      prompt,
      negativePrompt: "blurry, low quality",
      width: 1024,
      height: 1024,
    });
  } else {
    const { ImageGenerationService } = await import("./services/imageGeneration.js");
    const service = new ImageGenerationService();
    imagePath = await service.generate({
      prompt,
      negativePrompt: "blurry, low quality",
      width: 512,
      height: 512,
      numSteps: 4,
      guidanceScale: 0.0,
    });
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\nImage generated in ${elapsed}s`);
  console.log(`Output: ${imagePath}`);
  return imagePath;
}

async function testVideo() {
  console.log("=".repeat(50));
  console.log("  Project Genesis — Video Generation Test");
  console.log("  Mode: HuggingFace API (free, no GPU)");
  console.log("=".repeat(50));

  const prompt = "A lone astronaut walking on Mars, dust particles floating, cinematic, smooth motion";

  console.log(`\nGenerating text-to-video...`);
  console.log(`Prompt: ${prompt}`);

  const start = Date.now();

  const { HFVideoGenerationService } = await import("./services/hfVideoGeneration.js");
  const service = new HFVideoGenerationService();

  const result = await service.textToVideo({
    prompt,
    numFrames: 16,
    fps: 8,
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\nVideo generated in ${elapsed}s`);
  console.log(`Output: ${result.outputPath}`);
  console.log(`Frames: ${result.numFrames} @ ${result.fps}fps`);
  console.log(`Size: ${(result.fileSize / 1024).toFixed(1)} KB`);
}

async function testImageToVideo(imagePath: string) {
  console.log("=".repeat(50));
  console.log("  Project Genesis — Image-to-Video Test");
  console.log("  Mode: HuggingFace API (free, no GPU)");
  console.log("=".repeat(50));

  console.log(`\nAnimating image: ${imagePath}`);

  const start = Date.now();

  const { HFVideoGenerationService } = await import("./services/hfVideoGeneration.js");
  const service = new HFVideoGenerationService();

  const result = await service.imageToVideo({
    imagePath,
    numFrames: 25,
    fps: 7,
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\nVideo generated in ${elapsed}s`);
  console.log(`Output: ${result.outputPath}`);
  console.log(`Frames: ${result.numFrames} @ ${result.fps}fps`);
  console.log(`Size: ${(result.fileSize / 1024).toFixed(1)} KB`);
}

async function main() {
  const isVideo = process.argv.includes("--video");
  const i2vIndex = process.argv.indexOf("--i2v");
  const isI2V = i2vIndex !== -1;

  if (isVideo) {
    await testVideo();
  } else if (isI2V) {
    const imagePath = process.argv[i2vIndex + 1];
    if (!imagePath) {
      console.error("Usage: --i2v <image_path>");
      process.exit(1);
    }
    await testImageToVideo(imagePath);
  } else {
    await testImage();
  }
}

main().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
