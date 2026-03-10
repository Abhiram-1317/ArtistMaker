// ─────────────────────────────────────────────────────────────────────────────
// E2E live-update verification — connects to the running API server at :3001
// and verifies the render page would receive live updates as jobs process.
// Run:  npx tsx src/test-live-render.ts
// Prereqs: Redis running, API server running on port 3001
// ─────────────────────────────────────────────────────────────────────────────

import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import { createSigner } from "fast-jwt";
import { addRenderJob, renderQueue } from "./queues/renderQueue.js";
import { attachQueueEvents } from "./queues/queueEvents.js";
import { startRenderWorker } from "./workers/renderWorker.js";

const JWT_SECRET = "dev-secret-change-me-in-production-to-something-longer";
const API_URL = "http://localhost:3001";
const PROJECT_ID = "live-render-test-" + Date.now().toString(36);

interface ProgressData {
  stage: string;
  progress: number;
  shotId?: string;
  message: string;
}

interface CompleteData {
  shotId: string;
  videoUrl: string;
  thumbnailUrl: string;
}

interface StatusData {
  projectStatus: string;
  overallProgress: number;
}

async function runTest(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🎬 Live Render Page Update Verification");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ── 1: Generate JWT ────────────────────────────────────────────────────
  console.log("1️⃣  Generating JWT token...");
  const sign = createSigner({ key: JWT_SECRET, expiresIn: 60000 });
  const token = sign({
    id: "test-user-render",
    email: "render@genesis.ai",
    tier: "pro",
  });
  console.log("   ✓ Token generated\n");

  // ── 2: Connect to running server's /render namespace ───────────────────
  console.log("2️⃣  Connecting to API server ws://localhost:3001/render...");

  const client: ClientSocket = ioClient(`${API_URL}/render`, {
    auth: { token },
    transports: ["websocket", "polling"],
    forceNew: true,
    timeout: 5000,
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Connection timeout — is the API server running?")),
      8000,
    );
    client.on("connect", () => {
      clearTimeout(timeout);
      console.log(`   ✓ Connected (socket: ${client.id})\n`);
      resolve();
    });
    client.on("connect_error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Connection failed: ${err.message}`));
    });
  });

  // ── 3: Join project room ───────────────────────────────────────────────
  console.log("3️⃣  Joining project room...");

  const joinResult = await new Promise<{ ok: boolean; error?: string }>(
    (resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Join timeout")),
        3000,
      );
      client.emit(
        "join:project",
        { projectId: PROJECT_ID },
        (res: { ok: boolean; error?: string }) => {
          clearTimeout(timeout);
          resolve(res);
        },
      );
    },
  );

  if (!joinResult.ok) throw new Error(`Join failed: ${joinResult.error}`);
  console.log(`   ✓ Joined room project:${PROJECT_ID}\n`);

  // ── 4: Start worker (shares Redis with server) ─────────────────────────
  console.log("4️⃣  Starting local Bull worker...");
  attachQueueEvents(renderQueue);
  startRenderWorker(2);
  console.log("   ✓ Worker ready\n");

  // ── 5: Collect events ──────────────────────────────────────────────────
  console.log("5️⃣  Enqueueing render job and collecting events...\n");

  const events: { event: string; data: unknown; time: string }[] = [];
  const logTime = () =>
    new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  // These mirror exactly what the render page listens for
  client.on("render:progress", (data: ProgressData) => {
    events.push({ event: "render:progress", data, time: logTime() });
    console.log(
      `   [${logTime()}] 📊 progress — stage="${data.stage}" ${data.progress}% ${data.shotId ?? ""} "${data.message}"`,
    );
  });

  client.on("render:complete", (data: CompleteData) => {
    events.push({ event: "render:complete", data, time: logTime() });
    console.log(
      `   [${logTime()}] ✅ complete — shot=${data.shotId} url=${data.videoUrl}`,
    );
  });

  client.on("render:error", (data: { error: string; message: string }) => {
    events.push({ event: "render:error", data, time: logTime() });
    console.log(`   [${logTime()}] ❌ error — ${data.message}`);
  });

  client.on("render:status", (data: StatusData) => {
    events.push({ event: "render:status", data, time: logTime() });
    console.log(
      `   [${logTime()}] 📈 status — ${data.projectStatus} ${data.overallProgress}%`,
    );
  });

  // ── 6: Enqueue a generate-shot job ─────────────────────────────────────
  const job = await addRenderJob(
    {
      type: "generate-shot",
      shotId: "render-page-test-shot-001",
      sceneId: "render-page-test-scene-001",
      projectId: PROJECT_ID,
      config: {
        quality: "draft",
        resolution: { width: 1920, height: 1080 },
        fps: 24,
        shotType: "wide",
        cameraMovement: "dolly",
        duration: 5,
        prompt: "Live render page verification test",
      },
    },
    "pro",
  );
  console.log(`   Job enqueued: ID=${job.id}\n`);

  // ── 7: Wait for completion ─────────────────────────────────────────────
  await job.finished();
  await new Promise((r) => setTimeout(r, 2000)); // let final events flush

  // ── 8: Verify results ──────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  📋 Live Update Verification Results");
  console.log("═══════════════════════════════════════════════════════════\n");

  const progress = events.filter((e) => e.event === "render:progress");
  const complete = events.filter((e) => e.event === "render:complete");
  const status = events.filter((e) => e.event === "render:status");
  const errors = events.filter((e) => e.event === "render:error");

  const checks = [
    {
      name: "Socket.io connected to running server",
      pass: client.connected,
    },
    {
      name: "Received render:progress events",
      pass: progress.length > 0,
      detail: `${progress.length} events`,
    },
    {
      name: "Progress includes stage names",
      pass: progress.some((e) => (e.data as ProgressData).stage?.length > 0),
    },
    {
      name: "Progress includes percentage updates",
      pass: progress.some((e) => (e.data as ProgressData).progress > 0),
    },
    {
      name: "Received render:complete event",
      pass: complete.length >= 1,
      detail: `${complete.length} events`,
    },
    {
      name: "Complete event has videoUrl + thumbnailUrl",
      pass: complete.some(
        (e) =>
          (e.data as CompleteData).videoUrl &&
          (e.data as CompleteData).thumbnailUrl,
      ),
    },
    {
      name: "No unexpected errors",
      pass: errors.length === 0,
      detail: errors.length > 0 ? `${errors.length} errors` : undefined,
    },
  ];

  let allPassed = true;
  for (const check of checks) {
    const icon = check.pass ? "✅" : "❌";
    const detail = check.detail ? ` (${check.detail})` : "";
    console.log(`  ${icon} ${check.name}${detail}`);
    if (!check.pass) allPassed = false;
  }

  console.log(
    `\n  Total events received: ${events.length} (${progress.length} progress, ${complete.length} complete, ${status.length} status)`,
  );

  console.log(
    `\n  ${allPassed ? "🎉 ALL CHECKS PASSED" : "⚠️  SOME CHECKS FAILED"} — Page ${allPassed ? "WILL show live updates" : "may have issues"} as jobs process!\n`,
  );

  // ── Cleanup ────────────────────────────────────────────────────────────
  client.disconnect();
  await renderQueue.obliterate({ force: true });
  await renderQueue.close();
  process.exit(allPassed ? 0 : 1);
}

runTest().catch((err) => {
  console.error("❌ Test failed:", err.message || err);
  process.exit(1);
});
