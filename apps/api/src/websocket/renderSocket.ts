// ─────────────────────────────────────────────────────────────────────────────
// WebSocket render namespace — real-time render progress via Socket.io
// ─────────────────────────────────────────────────────────────────────────────

import type { Server, Namespace, Socket } from "socket.io";
import { createVerifier } from "fast-jwt";
import { env } from "../config/env.js";
import type { JwtPayload } from "../types/index.js";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Socket.io event payloads — emitted to clients
 * ══════════════════════════════════════════════════════════════════════════════ */

export interface RenderProgressPayload {
  stage: string;
  progress: number;
  shotId?: string;
  message: string;
}

export interface RenderCompletePayload {
  shotId: string;
  videoUrl: string;
  thumbnailUrl: string;
}

export interface RenderErrorPayload {
  shotId?: string;
  error: string;
  message: string;
}

export interface RenderStatusPayload {
  projectStatus: string;
  overallProgress: number;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Socket auth data — attached after JWT verification
 * ══════════════════════════════════════════════════════════════════════════════ */

interface AuthenticatedSocket extends Socket {
  data: {
    user: JwtPayload;
    projectId: string;
  };
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  /render namespace setup
 * ══════════════════════════════════════════════════════════════════════════════ */

let renderNamespace: Namespace | null = null;

export function getRenderNamespace(): Namespace | null {
  return renderNamespace;
}

export function setupRenderSocket(io: Server): Namespace {
  const nsp = io.of("/render");
  renderNamespace = nsp;

  // ── JWT authentication middleware ────────────────────────────────────────
  const verify = createVerifier({ key: env.JWT_SECRET });

  nsp.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ??
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const payload = verify(token) as JwtPayload;
      (socket as AuthenticatedSocket).data.user = payload;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  // ── Connection handler ──────────────────────────────────────────────────
  nsp.on("connection", (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const user = authSocket.data.user;

    console.log(
      `🔌 [WebSocket] User ${user.id} connected to /render`,
    );

    // ── join:project — subscribe to a project's render room ─────────────
    socket.on(
      "join:project",
      async (data: { projectId: string }, ack?: (res: { ok: boolean; error?: string }) => void) => {
        const { projectId } = data;

        if (!projectId || typeof projectId !== "string") {
          ack?.({ ok: false, error: "projectId is required" });
          return;
        }

        // Store the projectId for cleanup
        authSocket.data.projectId = projectId;

        // Join the room for this project
        const room = `project:${projectId}`;
        await socket.join(room);

        console.log(
          `🔌 [WebSocket] User ${user.id} joined room ${room}`,
        );

        ack?.({ ok: true });
      },
    );

    // ── leave:project — unsubscribe from a project's render room ────────
    socket.on(
      "leave:project",
      async (data: { projectId: string }, ack?: (res: { ok: boolean }) => void) => {
        const { projectId } = data;
        const room = `project:${projectId}`;
        await socket.leave(room);

        console.log(
          `🔌 [WebSocket] User ${user.id} left room ${room}`,
        );

        ack?.({ ok: true });
      },
    );

    // ── disconnect — clean up ───────────────────────────────────────────
    socket.on("disconnect", (reason: string) => {
      console.log(
        `🔌 [WebSocket] User ${user.id} disconnected (${reason})`,
      );
    });
  });

  console.log("🔌 WebSocket /render namespace ready");
  return nsp;
}
