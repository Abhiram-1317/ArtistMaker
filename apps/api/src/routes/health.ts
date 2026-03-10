// ─────────────────────────────────────────────────────────────────────────────
// Health check & ping routes
// ─────────────────────────────────────────────────────────────────────────────

import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import type { HealthResponse, PingResponse } from "../types/index.js";

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // ── GET /health ──────────────────────────────────────────────────────────

  fastify.get<{ Reply: HealthResponse }>("/health", {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            service: { type: "string" },
            version: { type: "string" },
            environment: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
            uptime: { type: "number" },
            database: {
              type: "string",
              enum: ["connected", "disconnected", "error"],
            },
          },
          required: [
            "status",
            "service",
            "version",
            "environment",
            "timestamp",
            "uptime",
            "database",
          ],
        },
      },
    },
    handler: async (_request, _reply) => {
      let dbStatus: HealthResponse["database"] = "disconnected";

      try {
        await fastify.prisma.$queryRaw`SELECT 1`;
        dbStatus = "connected";
      } catch {
        dbStatus = "error";
      }

      return {
        status: "ok" as const,
        service: "Project Genesis API",
        version: "1.0.0",
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
      };
    },
  });

  // ── GET /api/ping ────────────────────────────────────────────────────────

  fastify.get<{ Reply: PingResponse }>("/api/ping", {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string", enum: ["pong"] },
            timestamp: { type: "string", format: "date-time" },
          },
          required: ["message", "timestamp"],
        },
      },
    },
    handler: async (_request, _reply) => {
      return {
        message: "pong" as const,
        timestamp: new Date().toISOString(),
      };
    },
  });
}
