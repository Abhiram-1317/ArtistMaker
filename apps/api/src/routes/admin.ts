// ─────────────────────────────────────────────────────────────────────────────
// Admin routes — queue monitoring and management
// ─────────────────────────────────────────────────────────────────────────────

import type { FastifyInstance } from "fastify";
import { renderQueue, addRenderJob } from "../queues/renderQueue.js";

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  // ── GET /queues — queue dashboard overview ───────────────────────────────
  fastify.get(
    "/queues",
    { preHandler: [fastify.authenticate] },
    async (_request) => {
      const [waiting, active, completed, failed, delayed, paused] =
        await Promise.all([
          renderQueue.getWaitingCount(),
          renderQueue.getActiveCount(),
          renderQueue.getCompletedCount(),
          renderQueue.getFailedCount(),
          renderQueue.getDelayedCount(),
          renderQueue.getPausedCount(),
        ]);

      const recentFailed = await renderQueue.getFailed(0, 9);
      const recentCompleted = await renderQueue.getCompleted(0, 9);

      return {
        queue: "movie-render",
        counts: { waiting, active, completed, failed, delayed, paused },
        recentFailed: recentFailed.map((j) => ({
          id: j.id,
          type: j.data.type,
          failedReason: j.failedReason,
          attemptsMade: j.attemptsMade,
          finishedOn: j.finishedOn,
        })),
        recentCompleted: recentCompleted.map((j) => ({
          id: j.id,
          type: j.data.type,
          finishedOn: j.finishedOn,
        })),
      };
    },
  );

  // ── GET /queues/:jobId — single job status ───────────────────────────────
  fastify.get<{ Params: { jobId: string } }>(
    "/queues/:jobId",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const job = await renderQueue.getJob(request.params.jobId);
      if (!job) {
        return reply.status(404).send({ error: "Job not found" });
      }

      const state = await job.getState();

      return {
        id: job.id,
        type: job.data.type,
        state,
        progress: job.progress(),
        attemptsMade: job.attemptsMade,
        createdAt: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        data: job.data,
        returnvalue: job.returnvalue,
      };
    },
  );

  // ── POST /queues/test — enqueue a test render job ────────────────────────
  fastify.post(
    "/queues/test",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const user = request.user as { id: string; tier: string };

      const job = await addRenderJob(
        {
          type: "generate-shot",
          shotId: `test-${Date.now()}`,
          sceneId: "test-scene",
          projectId: "test-project",
          config: {
            quality: "draft",
            resolution: { width: 1280, height: 720 },
            fps: 24,
            shotType: "medium",
            cameraMovement: "static",
            duration: 3,
            prompt: "Test shot generation",
          },
        },
        (user.tier ?? "free") as "studio" | "pro" | "creator" | "free",
      );

      return {
        message: "Test job enqueued",
        jobId: job.id,
        type: job.data.type,
      };
    },
  );
}
