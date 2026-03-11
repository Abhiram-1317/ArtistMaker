// ─────────────────────────────────────────────────────────────────────────────
// Quick test for image generation
// Run: npx tsx src/test.ts
// ─────────────────────────────────────────────────────────────────────────────

import { ImageGenerationService } from "./services/imageGeneration.js";

async function test() {
  console.log("=".repeat(50));
  console.log("  Project Genesis — Image Generation Test");
  console.log("=".repeat(50));

  const service = new ImageGenerationService();

  console.log("\nGenerating image...");
  console.log("Prompt: A lone astronaut standing on Mars, cinematic lighting");

  const start = Date.now();

  const imagePath = await service.generate({
    prompt:
      "A lone astronaut standing on Mars, cinematic lighting, highly detailed, 8k",
    negativePrompt: "blurry, low quality",
    width: 512,
    height: 512,
    numSteps: 4,
    guidanceScale: 0.0,
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\nImage generated in ${elapsed}s`);
  console.log(`Output: ${imagePath}`);
}

test().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
