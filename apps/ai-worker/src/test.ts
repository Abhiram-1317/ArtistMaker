// ─────────────────────────────────────────────────────────────────────────────
// Quick test for image generation
// Run: npx tsx src/test.ts
// Modes: --local (uses local GPU/CPU)  --api (uses HuggingFace free API)
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";

async function test() {
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
}

test().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
