// Quick smoke test for the AI service
// Run: npx tsx src/test-ai-service.ts

import {
  getAIService,
  AIServiceError,
  InvalidConfigError,
  type ProgressCallback,
} from "./services/aiService.js";

const ai = getAIService();

async function run(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🧪 AI Service Smoke Test");
  console.log("═══════════════════════════════════════════════════════════\n");

  const log: ProgressCallback = (pct, msg) =>
    console.log(`     [${pct}%] ${msg}`);

  let passed = 0;
  let failed = 0;

  // ── 1. Script generation ───────────────────────────────────────────────
  try {
    console.log("1️⃣  generateScript...");
    const script = await ai.generateScript(
      { prompt: "A noir detective story", genre: "thriller", duration: 60, tone: "dramatic" },
      log,
    );
    console.log(`   ✅ title="${script.title}" scenes=${script.scenes.length} chars=${script.characterNames.join(", ")}\n`);
    passed++;
  } catch (e) { console.log(`   ❌ ${e}\n`); failed++; }

  // ── 2. Character generation ────────────────────────────────────────────
  try {
    console.log("2️⃣  generateCharacter...");
    const char = await ai.generateCharacter(
      { description: "Grizzled detective in a trench coat", style: "photorealistic", viewAngles: ["front", "side"] },
      log,
    );
    console.log(`   ✅ id=${char.characterId} views=${Object.keys(char.imageUrls).join(", ")}\n`);
    passed++;
  } catch (e) { console.log(`   ❌ ${e}\n`); failed++; }

  // ── 3. Shot generation ─────────────────────────────────────────────────
  try {
    console.log("3️⃣  generateShot...");
    const shot = await ai.generateShot(
      { prompt: "Rain-soaked alley", shotType: "wide", cameraMovement: "dolly", duration: 5, resolution: { width: 1920, height: 1080 }, fps: 24, quality: "standard" },
      [],
      "urban night",
      log,
    );
    console.log(`   ✅ id=${shot.shotId} dur=${shot.durationMs}ms frames=${shot.frameCount}\n`);
    passed++;
  } catch (e) { console.log(`   ❌ ${e}\n`); failed++; }

  // ── 4. Dialogue generation ─────────────────────────────────────────────
  try {
    console.log("4️⃣  generateDialogue...");
    const dlg = await ai.generateDialogue(
      { text: "This doesn't add up. I need to see the evidence.", voiceProfile: "deep-male" },
      log,
    );
    console.log(`   ✅ dur=${dlg.durationMs}ms words=${dlg.wordTimestamps.length}\n`);
    passed++;
  } catch (e) { console.log(`   ❌ ${e}\n`); failed++; }

  // ── 5. Music generation ────────────────────────────────────────────────
  try {
    console.log("5️⃣  generateMusic...");
    const music = await ai.generateMusic(
      { mood: "tense", genre: "cinematic", duration: 30 },
      log,
    );
    console.log(`   ✅ dur=${music.durationMs}ms bpm=${music.bpm} key=${music.key}\n`);
    passed++;
  } catch (e) { console.log(`   ❌ ${e}\n`); failed++; }

  // ── 6. SFX generation ──────────────────────────────────────────────────
  try {
    console.log("6️⃣  generateSFX...");
    const sfx = await ai.generateSFX(
      { description: "Thunder rumbling in the distance", duration: 4 },
      log,
    );
    console.log(`   ✅ dur=${sfx.durationMs}ms category=${sfx.category}\n`);
    passed++;
  } catch (e) { console.log(`   ❌ ${e}\n`); failed++; }

  // ── 7. Cost calculation ────────────────────────────────────────────────
  try {
    console.log("7️⃣  calculateCost...");
    const costs = [
      ai.calculateCost({ operation: "script", config: { prompt: "x", genre: "thriller", duration: 60, tone: "dramatic" } }),
      ai.calculateCost({ operation: "shot", config: { prompt: "x", shotType: "wide", cameraMovement: "static", duration: 5, resolution: { width: 3840, height: 2160 }, fps: 24, quality: "ultra" }, characterCount: 2 }),
      ai.calculateCost({ operation: "character", config: { description: "x", style: "photorealistic", viewAngles: ["front", "side", "three-quarter"] } }),
    ];
    for (const c of costs) {
      console.log(`     credits=${c.credits} breakdown=${JSON.stringify(c.breakdown)}`);
    }
    console.log("   ✅ Cost calculations passed\n");
    passed++;
  } catch (e) { console.log(`   ❌ ${e}\n`); failed++; }

  // ── 8. Error handling ──────────────────────────────────────────────────
  try {
    console.log("8️⃣  Error handling...");
    try {
      await ai.generateScript({ prompt: "", genre: "x", duration: 30, tone: "x" });
      console.log("   ❌ Should have thrown\n"); failed++;
    } catch (e) {
      if (e instanceof InvalidConfigError) {
        console.log(`   ✅ InvalidConfigError: ${e.message} (field=${e.field})\n`);
        passed++;
      } else {
        throw e;
      }
    }
  } catch (e) { console.log(`   ❌ Wrong error type: ${e}\n`); failed++; }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  ${failed === 0 ? "🎉 ALL" : "⚠️ "} ${passed}/${passed + failed} CHECKS PASSED`);
  console.log("═══════════════════════════════════════════════════════════\n");
  process.exit(failed === 0 ? 0 : 1);
}

run();
