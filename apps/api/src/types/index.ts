// ─────────────────────────────────────────────────────────────────────────────
// Fastify type augmentations & shared types
// ─────────────────────────────────────────────────────────────────────────────

import type { PrismaClient } from "@genesis/database";
import type { FastifyRequest, FastifyReply } from "fastify";

// ── Fastify instance decorations ─────────────────────────────────────────────

declare module "fastify" {
  interface FastifyInstance {
    /** Prisma database client (added by prisma plugin) */
    prisma: PrismaClient;

    /** JWT authentication preHandler (added by auth plugin) */
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

// ── JWT payload ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  id: string;
  email: string;
  tier: string;
  iat?: number;
  exp?: number;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

// ── Common response types ────────────────────────────────────────────────────

export interface HealthResponse {
  status: "ok" | "error";
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptime: number;
  database: "connected" | "disconnected" | "error";
}

export interface PingResponse {
  message: "pong";
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
