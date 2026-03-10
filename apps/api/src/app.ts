// ─────────────────────────────────────────────────────────────────────────────
// Fastify application factory
// ─────────────────────────────────────────────────────────────────────────────

import Fastify from "fastify";
import cors from "@fastify/cors";
import compress from "@fastify/compress";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance, FastifyError } from "fastify";
import { env } from "./config/env.js";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import { registerRoutes } from "./routes/index.js";
import { startRenderWorker } from "./workers/renderWorker.js";
import { attachQueueEvents, queueEvents } from "./queues/queueEvents.js";
import { renderQueue } from "./queues/renderQueue.js";

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
    requestTimeout: 30_000,
    disableRequestLogging: false,
  });

  // ── CORS ─────────────────────────────────────────────────────────────────

  await fastify.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // ── Plugins ──────────────────────────────────────────────────────────────

  // Response compression (gzip / brotli)
  await fastify.register(compress, {
    global: true,
    encodings: ["br", "gzip", "deflate"],
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,            // 100 req/min default
    timeWindow: "1 minute",
    allowList: ["127.0.0.1"],
    keyGenerator: (request) => {
      return request.ip;
    },
  });

  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);

  // ── Routes ───────────────────────────────────────────────────────────────

  await fastify.register(registerRoutes);

  // ── Job queue worker ──────────────────────────────────────────────────────

  attachQueueEvents(renderQueue);
  startRenderWorker();

  // ── Global error handler ─────────────────────────────────────────────────

  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode ?? 500;

    request.log.error(
      {
        err: error,
        request: {
          method: request.method,
          url: request.url,
          params: request.params,
          query: request.query,
        },
      },
      "Request error",
    );

    reply.status(statusCode).send({
      error: error.name || "InternalServerError",
      message:
        env.NODE_ENV === "production" && statusCode >= 500
          ? "Internal server error"
          : error.message,
      statusCode,
    });
  });

  // ── 404 handler ──────────────────────────────────────────────────────────

  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: "NotFound",
      message: `Route ${request.method} ${request.url} not found`,
      statusCode: 404,
    });
  });

  return fastify;
}
