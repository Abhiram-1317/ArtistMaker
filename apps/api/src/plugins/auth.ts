// ─────────────────────────────────────────────────────────────────────────────
// JWT authentication plugin — decorates fastify.authenticate
// ─────────────────────────────────────────────────────────────────────────────

import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { env } from "../config/env.js";

async function authPlugin(fastify: FastifyInstance): Promise<void> {
  // Register the JWT module
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: "7d",
    },
    verify: {
      maxAge: "7d",
    },
  });

  // Decorate with reusable authenticate handler
  fastify.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "Invalid or expired token",
          statusCode: 401,
        });
      }
    },
  );
}

export default fp(authPlugin, {
  name: "auth",
  dependencies: [],
});
