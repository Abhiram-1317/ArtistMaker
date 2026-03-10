// ─────────────────────────────────────────────────────────────────────────────
// AI Worker — Fastify HTTP server
// Exposes endpoints for submitting generation jobs and checking status
// ─────────────────────────────────────────────────────────────────────────────

import Fastify from "fastify";
import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import { env } from "./config/env.js";
import { getGpuInfo, checkPythonAvailable, checkPyTorchCuda } from "./config/gpu.js";
import { renderQueue, enqueueJob, startWorker } from "./queue/worker.js";

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      ...(env.NODE_ENV !== "production" && {
        transport: {
          target: "pino-pretty",
          options: {
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
            colorize: true,
          },
        },
      }),
    },
    trustProxy: true,
  });

  // ── CORS ─────────────────────────────────────────────────────────────────

  await fastify.register(cors, {
    origin: env.API_URL,
    credentials: true,
    methods: ["GET", "POST"],
  });

  // ── Routes ───────────────────────────────────────────────────────────────

  // Health check + GPU status
  fastify.get("/health", async () => {
    const gpu = getGpuInfo();
    const pythonOk = checkPythonAvailable(env.PYTHON_PATH);
    const cudaOk = gpu.available ? checkPyTorchCuda(env.PYTHON_PATH) : false;
    const waiting = await renderQueue.getWaitingCount();
    const active = await renderQueue.getActiveCount();

    return {
      status: "ok",
      uptime: process.uptime(),
      gpu,
      python: pythonOk,
      pytorchCuda: cudaOk,
      queue: { waiting, active },
    };
  });

  // Submit a render-scene job
  fastify.post<{
    Body: {
      projectId: string;
      sceneId: string;
      sceneNumber: number;
      prompt: string;
      negativePrompt?: string;
      style?: string;
      durationSec?: number;
      width?: number;
      height?: number;
      seed?: number;
    };
  }>("/jobs/render-scene", async (request, reply) => {
    const body = request.body;
    const job = await enqueueJob({
      type: "render-scene",
      scene: {
        projectId: body.projectId,
        sceneId: body.sceneId,
        sceneNumber: body.sceneNumber,
        prompt: body.prompt,
        negativePrompt: body.negativePrompt,
        style: body.style,
        durationSec: body.durationSec,
        width: body.width,
        height: body.height,
        seed: body.seed,
      },
    });

    return reply.status(202).send({
      jobId: job.id,
      status: "queued",
    });
  });

  // Submit a full project render
  fastify.post<{
    Body: {
      projectId: string;
      scenes: Array<{
        sceneId: string;
        sceneNumber: number;
        prompt: string;
        negativePrompt?: string;
        style?: string;
        durationSec?: number;
        width?: number;
        height?: number;
        seed?: number;
      }>;
    };
  }>("/jobs/render-project", async (request, reply) => {
    const { projectId, scenes } = request.body;

    const job = await enqueueJob({
      type: "render-project",
      projectId,
      scenes: scenes.map((s) => ({ ...s, projectId })),
    });

    return reply.status(202).send({
      jobId: job.id,
      status: "queued",
      totalScenes: scenes.length,
    });
  });

  // Submit a voiceover job
  fastify.post<{
    Body: {
      projectId: string;
      sceneId: string;
      sceneNumber: number;
      lines: Array<{
        lineId: string;
        character: string;
        text: string;
        speaker?: string;
        language?: string;
        speed?: number;
      }>;
    };
  }>("/jobs/voiceover", async (request, reply) => {
    const body = request.body;

    const job = await enqueueJob({
      type: "voiceover",
      request: {
        projectId: body.projectId,
        sceneId: body.sceneId,
        sceneNumber: body.sceneNumber,
        lines: body.lines,
      },
    });

    return reply.status(202).send({
      jobId: job.id,
      status: "queued",
      totalLines: body.lines.length,
    });
  });

  // Submit a soundtrack job
  fastify.post<{
    Body: {
      projectId: string;
      sceneId: string;
      sceneNumber: number;
      prompt: string;
      durationSec?: number;
      mood?: string;
      genre?: string;
      temperature?: number;
    };
  }>("/jobs/soundtrack", async (request, reply) => {
    const body = request.body;

    const job = await enqueueJob({
      type: "soundtrack",
      request: {
        projectId: body.projectId,
        sceneId: body.sceneId,
        sceneNumber: body.sceneNumber,
        prompt: body.prompt,
        durationSec: body.durationSec,
        mood: body.mood,
        genre: body.genre,
        temperature: body.temperature,
      },
    });

    return reply.status(202).send({
      jobId: job.id,
      status: "queued",
    });
  });

  // Check job status
  fastify.get<{ Params: { jobId: string } }>(
    "/jobs/:jobId",
    async (request, reply) => {
      const { jobId } = request.params;
      const job = await renderQueue.getJob(jobId);

      if (!job) {
        return reply.status(404).send({ error: "Job not found" });
      }

      const state = await job.getState();
      const progress = job.progress();

      return {
        jobId: job.id,
        type: job.data.type,
        state,
        progress,
        createdAt: job.timestamp,
        processedAt: job.processedOn,
        finishedAt: job.finishedOn,
        failedReason: job.failedReason,
        result: state === "completed" ? job.returnvalue : undefined,
      };
    }
  );

  // List queue stats
  fastify.get("/queue/stats", async () => {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      renderQueue.getWaitingCount(),
      renderQueue.getActiveCount(),
      renderQueue.getCompletedCount(),
      renderQueue.getFailedCount(),
      renderQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  });

  return fastify;
}
