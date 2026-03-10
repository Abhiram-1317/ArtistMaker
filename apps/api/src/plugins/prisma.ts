// ─────────────────────────────────────────────────────────────────────────────
// Prisma database plugin — decorates fastify.prisma
// ─────────────────────────────────────────────────────────────────────────────

import fp from "fastify-plugin";
import { PrismaClient } from "@genesis/database";
import type { FastifyInstance } from "fastify";

async function prismaPlugin(fastify: FastifyInstance): Promise<void> {
  const prisma = new PrismaClient({
    log:
      fastify.log.level === "debug"
        ? ["query", "info", "warn", "error"]
        : ["warn", "error"],
  });

  // Attempt to connect — log warning but don't crash if DB is unreachable
  try {
    await prisma.$connect();
    fastify.log.info("Database connection established");
  } catch (err) {
    fastify.log.warn(
      err,
      "Failed to connect to database — server will start but DB-dependent routes will fail",
    );
  }

  // Make prisma available on the fastify instance
  fastify.decorate("prisma", prisma);

  // Disconnect on server close
  fastify.addHook("onClose", async (instance) => {
    instance.log.info("Disconnecting from database...");
    await prisma.$disconnect();
  });
}

export default fp(prismaPlugin, {
  name: "prisma",
  dependencies: [],
});
