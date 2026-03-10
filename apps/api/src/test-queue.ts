// ─────────────────────────────────────────────────────────────────────────────
// Standalone queue smoke test — verifies Bull + Redis job processing end-to-end
// Run: npx tsx src/test-queue.ts
// ─────────────────────────────────────────────────────────────────────────────

import {
  renderQueue,
  addRenderJob,
  type RenderJobData,
  type GenerateShotResult,
} from "./queues/renderQueue.js";
import { queueEvents, attachQueueEvents } from "./queues/queueEvents.js";
import { startRenderWorker } from "./workers/renderWorker.js";

async function runTest(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🧪 Queue Smoke Test — Bull + Redis");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ── Step 1: Wire up events + worker ────────────────────────────────────
  console.log("1️⃣  Attaching queue events and starting worker...");
  attachQueueEvents(renderQueue);
  startRenderWorker(2);

  // Track events for verification
  const events: string[] = [];

  // Listen via the event bus (which uses global: Bull events internally)
  queueEvents.on("job:progress", (evt) => {
    events.push(`progress:${evt.jobId}:${evt.progress}%`);
    console.log(
      `   📊 Progress — Job ${evt.jobId} (${evt.jobType}): ${evt.progress}%`,
    );
  });

  queueEvents.on("job:completed", (evt) => {
    events.push(`completed:${evt.jobId}`);
    console.log(
      `   ✅ Completed — Job ${evt.jobId} (${evt.jobType})`,
    );
  });

  queueEvents.on("job:failed", (evt) => {
    events.push(`failed:${evt.jobId}`);
    console.log(
      `   ❌ Failed — Job ${evt.jobId} (${evt.jobType}): ${evt.error}`,
    );
  });

  console.log("   Worker ready.\n");

  // ── Step 2: Enqueue a generate-shot job ────────────────────────────────
  console.log("2️⃣  Enqueueing a generate-shot job...");
  const shotJob = await addRenderJob(
    {
      type: "generate-shot",
      shotId: "test-shot-001",
      sceneId: "test-scene-001",
      projectId: "test-project-001",
      config: {
        quality: "draft",
        resolution: { width: 1280, height: 720 },
        fps: 24,
        shotType: "medium",
        cameraMovement: "static",
        duration: 3,
        prompt: "A cinematic establishing shot of a futuristic city",
      },
    },
    "pro",
  );
  console.log(`   Job enqueued: ID=${shotJob.id}, type=${shotJob.data.type}\n`);

  // ── Step 3: Enqueue a generate-audio job ───────────────────────────────
  console.log("3️⃣  Enqueueing a generate-audio job...");
  const audioJob = await addRenderJob(
    {
      type: "generate-audio",
      sceneId: "test-scene-001",
      projectId: "test-project-001",
      audioType: "dialogue",
      config: {
        duration: 5,
        description: "Ambient city soundscape",
        characterName: "Narrator",
        dialogueText: "In the year 2077...",
      },
    },
    "creator",
  );
  console.log(`   Job enqueued: ID=${audioJob.id}, type=${audioJob.data.type}\n`);

  // ── Step 4: Wait for jobs to complete ──────────────────────────────────
  console.log("4️⃣  Waiting for jobs to process...\n");

  const [shotResult, audioResult] = await Promise.all([
    shotJob.finished() as Promise<GenerateShotResult>,
    audioJob.finished(),
  ]);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  📋 Results");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("  Shot Result:", JSON.stringify(shotResult, null, 2));
  console.log("  Audio Result:", JSON.stringify(audioResult, null, 2));

  // ── Step 5: Check queue stats ──────────────────────────────────────────
  const [waiting, active, completed, failed] = await Promise.all([
    renderQueue.getWaitingCount(),
    renderQueue.getActiveCount(),
    renderQueue.getCompletedCount(),
    renderQueue.getFailedCount(),
  ]);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  📈 Queue Stats");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`  Waiting:   ${waiting}`);
  console.log(`  Active:    ${active}`);
  console.log(`  Completed: ${completed}`);
  console.log(`  Failed:    ${failed}`);

  // ── Step 6: Verify ────────────────────────────────────────────────────
  const progressEvents = events.filter((e) => e.startsWith("progress:"));
  const completedEvents = events.filter((e) => e.startsWith("completed:"));
  const failedEvents = events.filter((e) => e.startsWith("failed:"));

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  ✅ Verification");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`  Progress events fired: ${progressEvents.length}`);
  console.log(`  Completed events fired: ${completedEvents.length}`);
  console.log(`  Failed events fired:   ${failedEvents.length}`);

  const allPassed =
    completed >= 2 &&
    failed === 0 &&
    completedEvents.length >= 2 &&
    shotResult.videoUrl.includes("cdn.genesis.ai") &&
    shotResult.thumbnailUrl.includes("cdn.genesis.ai");

  console.log(
    `\n  ${allPassed ? "🎉 ALL CHECKS PASSED" : "⚠️  SOME CHECKS FAILED"} — Queue system is ${allPassed ? "working correctly" : "not fully functional"}!`,
  );

  // ── Cleanup ────────────────────────────────────────────────────────────
  console.log("\n  Cleaning up...");
  await renderQueue.obliterate({ force: true });
  await renderQueue.close();
  console.log("  Done.\n");
  process.exit(allPassed ? 0 : 1);
}

runTest().catch((err) => {
  console.error("❌ Test failed with error:", err);
  process.exit(1);
});
