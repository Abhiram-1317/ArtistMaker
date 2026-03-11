// ─────────────────────────────────────────────────────────────────────────────
// Render routes — /api/render
// Queue movie generation jobs and check progress
// ─────────────────────────────────────────────────────────────────────────────

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { renderQueue, addRenderJob, getPriorityForTier } from "../queues/renderQueue.js";
import type { GenerateMovieJobData } from "../queues/renderQueue.js";
import { ProjectStatus } from "@genesis/database";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const generateParamSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});

const statusParamSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

// ── Routes ───────────────────────────────────────────────────────────────────

export async function renderRoutes(fastify: FastifyInstance): Promise<void> {
  // All render routes require authentication
  fastify.addHook("preHandler", fastify.authenticate);

  // ── Start movie generation ─────────────────────────────────────────────

  fastify.post<{
    Params: { projectId: string };
  }>("/:projectId/generate", async (request, reply) => {
    const { projectId } = generateParamSchema.parse(request.params);
    const userId = request.user.id;
    const userTier = request.user.tier;

    // Verify the project exists and belongs to the user
    const project = await fastify.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        characters: true,
        scenes: {
          orderBy: { sceneNumber: "asc" },
          include: {
            shots: { orderBy: { shotNumber: "asc" } },
          },
        },
      },
    });

    if (!project) {
      return reply.status(404).send({ error: "Project not found" });
    }

    if (project.userId !== userId) {
      return reply.status(403).send({ error: "Not authorized" });
    }

    if (project.status === ProjectStatus.RENDERING) {
      return reply
        .status(409)
        .send({ error: "Movie generation already in progress" });
    }

    // Update project status
    await fastify.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.RENDERING },
    });

    // Add job to the render queue — include full project snapshot
    // so the AI worker can process without DB access
    const jobData: GenerateMovieJobData = {
      type: "generate-movie",
      projectId,
      userId,
      config: {
        quality: "standard",
        resolution: { width: 1920, height: 1080 },
        fps: project.fps,
        includeAudio: true,
      },
      project: {
        stylePreset: project.stylePreset,
        resolution: project.resolution,
        characters: project.characters.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          voiceProfile: c.voiceProfile,
        })),
        scenes: project.scenes.map((s) => ({
          id: s.id,
          sceneNumber: s.sceneNumber,
          locationDescription: s.locationDescription,
          timeOfDay: s.timeOfDay,
          weather: s.weather,
          mood: s.mood,
          durationSeconds: s.durationSeconds,
          dialogue: s.dialogue,
          description: s.actionDescription,
          shots: s.shots.map((sh) => ({
            id: sh.id,
            shotNumber: sh.shotNumber,
            shotType: sh.shotType,
            cameraAngle: sh.cameraAngle,
            durationSeconds: sh.durationSeconds,
            description: sh.description,
            negativePrompt: sh.negativePrompt,
            charactersInShot: sh.charactersInShot,
            sceneId: sh.sceneId,
          })),
        })),
      },
    };

    const job = await addRenderJob(jobData, userTier);

    return reply.status(202).send({
      jobId: job.id,
      status: "queued",
      message: "Movie generation started",
    });
  });

  // ── Get render status ──────────────────────────────────────────────────

  fastify.get<{
    Params: { jobId: string };
  }>("/status/:jobId", async (request, reply) => {
    const { jobId } = statusParamSchema.parse(request.params);

    const job = await renderQueue.getJob(jobId);

    if (!job) {
      return reply.status(404).send({ error: "Job not found" });
    }

    const state = await job.getState();
    const progress = job.progress();
    const logs = await job.getState();

    return {
      jobId: job.id,
      state,
      progress,
      data: {
        projectId: job.data.projectId,
        type: job.data.type,
      },
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
      failedReason: job.failedReason,
      result: state === "completed" ? job.returnvalue : undefined,
    };
  });

  // ── Cancel render job ──────────────────────────────────────────────────

  fastify.delete<{
    Params: { jobId: string };
  }>("/status/:jobId", async (request, reply) => {
    const { jobId } = statusParamSchema.parse(request.params);

    const job = await renderQueue.getJob(jobId);

    if (!job) {
      return reply.status(404).send({ error: "Job not found" });
    }

    const state = await job.getState();

    if (state === "completed" || state === "failed") {
      return reply
        .status(400)
        .send({ error: `Cannot cancel a ${state} job` });
    }

    await job.remove();

    // Reset project status
    await fastify.prisma.project.update({
      where: { id: job.data.projectId },
      data: { status: ProjectStatus.DRAFT },
    });

    return { jobId, status: "cancelled" };
  });
}
