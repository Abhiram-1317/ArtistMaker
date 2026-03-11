// ─────────────────────────────────────────────────────────────────────────────
// Auth routes — /api/auth  (register + login → JWT)
// ─────────────────────────────────────────────────────────────────────────────

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  displayName: z.string().min(1).max(100),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // ── POST /api/auth/register ──────────────────────────────────────────────
  fastify.post("/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation failed", details: parsed.error.flatten() });
    }
    const { email, username, displayName, password } = parsed.data;

    const existing = await fastify.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return reply.status(409).send({ error: "Email or username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await fastify.prisma.user.create({
      data: { email, username, displayName, passwordHash, creditsBalance: 100 },
    });

    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      tier: user.subscriptionTier,
    });

    return { token, user: { id: user.id, email: user.email, displayName: user.displayName } };
  });

  // ── POST /api/auth/login ────────────────────────────────────────────────
  fastify.post("/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation failed" });
    }
    const { email, password } = parsed.data;

    const user = await fastify.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      tier: user.subscriptionTier,
    });

    return { token, user: { id: user.id, email: user.email, displayName: user.displayName } };
  });
}
