// ─────────────────────────────────────────────────────────────────────────────
// End-to-end WebSocket test — verifies Socket.io /render namespace receives
// real-time events when Bull jobs process.
// Run: npx tsx src/test-websocket.ts
// ─────────────────────────────────────────────────────────────────────────────

import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import { createSigner } from "fast-jwt";
import { setupRenderSocket } from "./websocket/renderSocket.js";
import { renderQueue, addRenderJob } from "./queues/renderQueue.js";
import { attachQueueEvents } from "./queues/queueEvents.js";
import { startRenderWorker } from "./workers/renderWorker.js";

const JWT_SECRET = "dev-secret-change-me-in-production-to-something-longer";
const PORT = 9876; // test port to avoid conflicts
const PROJECT_ID = "test-ws-project-001";

async function runTest(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🧪 WebSocket End-to-End Test");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ── Step 1: Create HTTP + Socket.io server ─────────────────────────────
  console.log("1️⃣  Starting Socket.io server...");

  const httpServer = createServer();
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
    transports: ["websocket"],
  });

  setupRenderSocket(io);

  await new Promise<void>((resolve) => {
    httpServer.listen(PORT, () => resolve());
  });
  console.log(`   Server listening on port ${PORT}\n`);

  // ── Step 2: Wire up Bull queue + worker ────────────────────────────────
  console.log("2️⃣  Starting Bull worker...");
  attachQueueEvents(renderQueue);
  startRenderWorker(2);
  console.log("   Worker ready.\n");

  // ── Step 3: Generate a JWT token for test client ───────────────────────
  console.log("3️⃣  Generating JWT token...");
  const sign = createSigner({ key: JWT_SECRET, expiresIn: 60000 });
  const token = sign({ id: "test-user-001", email: "test@genesis.ai", tier: "pro" });
  console.log("   Token generated.\n");

  // ── Step 4: Connect Socket.io client ───────────────────────────────────
  console.log("4️⃣  Connecting WebSocket client to /render...");

  const client: ClientSocket = ioClient(`http://localhost:${PORT}/render`, {
    auth: { token },
    transports: ["websocket"],
    forceNew: true,
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Connection timeout")),
      5000,
    );
    client.on("connect", () => {
      clearTimeout(timeout);
      console.log(`   Connected! Socket ID: ${client.id}\n`);
      resolve();
    });
    client.on("connect_error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Connection failed: ${err.message}`));
    });
  });

  // ── Step 5: Join project room ──────────────────────────────────────────
  console.log("5️⃣  Joining project room...");

  const joinResult = await new Promise<{ ok: boolean; error?: string }>(
    (resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Join timeout")),
        3000,
      );
      client.emit("join:project", { projectId: PROJECT_ID }, (res: { ok: boolean; error?: string }) => {
        clearTimeout(timeout);
        resolve(res);
      });
    },
  );

  if (!joinResult.ok) {
    throw new Error(`Join failed: ${joinResult.error}`);
  }
  console.log(`   Joined room project:${PROJECT_ID}\n`);

  // ── Step 6: Listen for WebSocket events ────────────────────────────────
  console.log("6️⃣  Enqueueing job and listening for events...\n");

  const receivedEvents: { event: string; data: unknown }[] = [];

  client.on("render:progress", (data) => {
    receivedEvents.push({ event: "render:progress", data });
    const d = data as { stage: string; progress: number; shotId?: string; message: string };
    console.log(
      `   📊 render:progress — ${d.stage} ${d.progress}% ${d.shotId ?? ""} "${d.message}"`,
    );
  });

  client.on("render:complete", (data) => {
    receivedEvents.push({ event: "render:complete", data });
    const d = data as { shotId: string; videoUrl: string };
    console.log(
      `   ✅ render:complete — shot=${d.shotId} url=${d.videoUrl}`,
    );
  });

  client.on("render:error", (data) => {
    receivedEvents.push({ event: "render:error", data });
    const d = data as { error: string; message: string };
    console.log(`   ❌ render:error — ${d.error}: ${d.message}`);
  });

  client.on("render:status", (data) => {
    receivedEvents.push({ event: "render:status", data });
    const d = data as { projectStatus: string; overallProgress: number };
    console.log(
      `   📈 render:status — ${d.projectStatus} ${d.overallProgress}%`,
    );
  });

  // ── Step 7: Enqueue a generate-shot job for this project ───────────────
  const job = await addRenderJob(
    {
      type: "generate-shot",
      shotId: "ws-test-shot-001",
      sceneId: "ws-test-scene-001",
      projectId: PROJECT_ID,
      config: {
        quality: "draft",
        resolution: { width: 1280, height: 720 },
        fps: 24,
        shotType: "medium",
        cameraMovement: "static",
        duration: 3,
        prompt: "WebSocket test shot",
      },
    },
    "pro",
  );

  console.log(`   Job enqueued: ID=${job.id}\n`);

  // ── Step 8: Wait for job to complete + events to arrive ────────────────
  await job.finished();

  // Give Socket.io a moment to deliver the final events
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // ── Step 9: Verification ───────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  📋 Verification");
  console.log("═══════════════════════════════════════════════════════════\n");

  const progressEvents = receivedEvents.filter((e) => e.event === "render:progress");
  const completeEvents = receivedEvents.filter((e) => e.event === "render:complete");
  const statusEvents = receivedEvents.filter((e) => e.event === "render:status");
  const errorEvents = receivedEvents.filter((e) => e.event === "render:error");

  console.log(`  render:progress events: ${progressEvents.length}`);
  console.log(`  render:complete events: ${completeEvents.length}`);
  console.log(`  render:status  events: ${statusEvents.length}`);
  console.log(`  render:error   events: ${errorEvents.length}`);
  console.log(`  Total events received: ${receivedEvents.length}`);

  const allPassed =
    progressEvents.length > 0 &&
    completeEvents.length >= 1 &&
    errorEvents.length === 0;

  console.log(
    `\n  ${allPassed ? "🎉 ALL CHECKS PASSED" : "⚠️  SOME CHECKS FAILED"} — WebSocket ${allPassed ? "is working correctly" : "has issues"}!`,
  );

  // ── Cleanup ────────────────────────────────────────────────────────────
  console.log("\n  Cleaning up...");
  client.disconnect();
  io.close();
  httpServer.close();
  await renderQueue.obliterate({ force: true });
  await renderQueue.close();
  console.log("  Done.\n");
  process.exit(allPassed ? 0 : 1);
}

runTest().catch((err) => {
  console.error("❌ Test failed with error:", err);
  process.exit(1);
});
