// ─────────────────────────────────────────────────────────────────────────────
// Server entry point — bootstraps Fastify + starts Bull queue worker
// ─────────────────────────────────────────────────────────────────────────────

import { env } from "./config/env.js";
import { buildApp } from "./app.js";
import { startWorker, renderQueue } from "./queue/worker.js";
import { getGpuInfo } from "./config/gpu.js";

async function start(): Promise<void> {
  const app = await buildApp();

  // ── Start Bull queue worker ────────────────────────────────────────────

  startWorker();

  // ── Graceful shutdown ──────────────────────────────────────────────────

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully…`);
      try {
        await renderQueue.close();
        await app.close();
        app.log.info("AI Worker shut down");
        process.exit(0);
      } catch (err) {
        app.log.error(err, "Error during shutdown");
        process.exit(1);
      }
    });
  }

  // ── Start listening ────────────────────────────────────────────────────

  try {
    await app.listen({ port: env.WORKER_PORT, host: env.WORKER_HOST });

    // Log GPU info on startup
    const gpu = getGpuInfo();
    app.log.info("──────────────────────────────────────────────");
    app.log.info("  🎬 Project Genesis AI Worker");
    app.log.info(`  Port:       ${env.WORKER_PORT}`);
    app.log.info(`  GPU:        ${gpu.name}`);
    app.log.info(`  VRAM:       ${gpu.vramTotal} (${gpu.vramFree} free)`);
    app.log.info(`  CUDA:       ${gpu.cudaVersion}`);
    app.log.info(`  GPU Avail:  ${gpu.available}`);
    app.log.info(`  Concurrency: ${env.WORKER_CONCURRENCY}`);
    app.log.info("──────────────────────────────────────────────");
  } catch (err) {
    app.log.error(err, "Failed to start AI Worker");
    process.exit(1);
  }
}

start();
