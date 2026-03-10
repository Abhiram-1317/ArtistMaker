// ─────────────────────────────────────────────────────────────────────────────
// Server entry point — bootstraps and starts the Fastify application
// ─────────────────────────────────────────────────────────────────────────────

// Load type augmentations before anything else
import "./types/index.js";

import { Server as SocketIOServer } from "socket.io";
import { env } from "./config/env.js";
import { buildApp } from "./app.js";
import { setupRenderSocket } from "./websocket/renderSocket.js";
import { setupCollaborationSocket } from "./websocket/collaborationSocket.js";

async function start(): Promise<void> {
  const app = await buildApp();

  // ── Socket.io setup (attach to Fastify's built-in HTTP server) ─────────

  const io = new SocketIOServer(app.server, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  setupRenderSocket(io);
  setupCollaborationSocket(io);

  // ── Graceful shutdown ──────────────────────────────────────────────────

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully…`);
      try {
        io.close();
        await app.close();
        app.log.info("Server closed");
        process.exit(0);
      } catch (err) {
        app.log.error(err, "Error during shutdown");
        process.exit(1);
      }
    });
  }

  // ── Start listening ────────────────────────────────────────────────────

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    app.log.info(`🎬 Project Genesis API running on http://0.0.0.0:${env.PORT}`);
    app.log.info(`🔌 WebSocket server ready on ws://0.0.0.0:${env.PORT}/render`);
    app.log.info(`🤝 Collaboration WebSocket ready on ws://0.0.0.0:${env.PORT}/collaboration`);
  } catch (err) {
    app.log.fatal(err, "Failed to start server");
    process.exit(1);
  }
}

start();
