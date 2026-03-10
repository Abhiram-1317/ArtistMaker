// ─────────────────────────────────────────────────────────────────────────────
// Character CRUD + reference-image generation routes
// ─────────────────────────────────────────────────────────────────────────────
//  Nested:  /api/projects/:projectId/characters   (list, create)
//  Top:     /api/characters/:id                   (get, patch, delete, generate)
// ─────────────────────────────────────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const projectIdParamSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});

const characterIdParamSchema = z.object({
  id: z.string().min(1, "Character ID is required"),
});

const createCharacterSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or fewer"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must be 5000 characters or fewer"),
  appearancePrompt: z
    .string()
    .min(1, "Appearance prompt is required")
    .max(5000, "Appearance prompt must be 5000 characters or fewer"),
  personalityTraits: z
    .array(z.string().min(1).max(100))
    .max(20, "Maximum 20 personality traits")
    .optional()
    .default([]),
  voiceProfile: z.record(z.unknown()).optional(),
  ageRange: z
    .string()
    .max(50, "Age range must be 50 characters or fewer")
    .optional(),
});

const updateCharacterSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  appearancePrompt: z.string().min(1).max(5000).optional(),
  personalityTraits: z
    .array(z.string().min(1).max(100))
    .max(20)
    .optional(),
  voiceProfile: z.record(z.unknown()).nullable().optional(),
  ageRange: z.string().max(50).nullable().optional(),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function zodError(reply: FastifyReply, error: z.ZodError) {
  const issues = error.errors.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));
  return reply.status(400).send({
    error: "ValidationError",
    message: "Request validation failed",
    statusCode: 400,
    issues,
  });
}

// ── Nested routes: /api/projects/:projectId/characters ───────────────────────

export async function projectCharacterRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  // All character routes require authentication
  fastify.addHook("preHandler", fastify.authenticate);

  // ──────────────────────────────────────────────────────────────────────
  // GET / — list all characters for a project
  // ──────────────────────────────────────────────────────────────────────

  fastify.get("/", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = projectIdParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const { projectId } = params.data;
      const userId = request.user.id;

      // Verify project ownership
      const project = await fastify.prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true },
      });

      if (!project || project.userId !== userId) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Project not found",
          statusCode: 404,
        });
      }

      const characters = await fastify.prisma.character.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
      });

      return reply.send({
        data: characters,
        meta: { total: characters.length },
      });
    },
  });

  // ──────────────────────────────────────────────────────────────────────
  // POST / — create a new character for a project
  // ──────────────────────────────────────────────────────────────────────

  fastify.post("/", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = projectIdParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const body = createCharacterSchema.safeParse(request.body);
      if (!body.success) return zodError(reply, body.error);

      const { projectId } = params.data;
      const userId = request.user.id;

      // Verify project ownership
      const project = await fastify.prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true },
      });

      if (!project || project.userId !== userId) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Project not found",
          statusCode: 404,
        });
      }

      const {
        name,
        description,
        appearancePrompt,
        personalityTraits,
        voiceProfile,
        ageRange,
      } = body.data;

      const character = await fastify.prisma.character.create({
        data: {
          projectId,
          name,
          description,
          appearancePrompt,
          personalityTraits,
          voiceProfile: (voiceProfile ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          ageRange: ageRange ?? null,
        },
      });

      return reply.status(201).send({ data: character });
    },
  });
}

// ── Top-level routes: /api/characters/:id ────────────────────────────────────

export async function characterRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  // All character routes require authentication
  fastify.addHook("preHandler", fastify.authenticate);

  // ──────────────────────────────────────────────────────────────────────
  // GET /:id — get single character with details
  // ──────────────────────────────────────────────────────────────────────

  fastify.get("/:id", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = characterIdParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const { id } = params.data;
      const userId = request.user.id;

      const character = await fastify.prisma.character.findUnique({
        where: { id },
        include: {
          project: {
            select: { userId: true, title: true, id: true },
          },
        },
      });

      if (!character || character.project.userId !== userId) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Character not found",
          statusCode: 404,
        });
      }

      // Strip internal project.userId from response
      const { project, ...charData } = character;
      return reply.send({
        data: {
          ...charData,
          project: { id: project.id, title: project.title },
        },
      });
    },
  });

  // ──────────────────────────────────────────────────────────────────────
  // PATCH /:id — update character properties
  // ──────────────────────────────────────────────────────────────────────

  fastify.patch("/:id", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = characterIdParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const body = updateCharacterSchema.safeParse(request.body);
      if (!body.success) return zodError(reply, body.error);

      const { id } = params.data;
      const userId = request.user.id;
      const updates = body.data;

      // Check at least one field is provided
      const defined = Object.entries(updates).filter(
        ([, v]) => v !== undefined,
      );
      if (defined.length === 0) {
        return reply.status(400).send({
          error: "ValidationError",
          message: "At least one field must be provided to update",
          statusCode: 400,
        });
      }

      // Verify ownership via project
      const existing = await fastify.prisma.character.findUnique({
        where: { id },
        include: {
          project: { select: { userId: true } },
        },
      });

      if (!existing || existing.project.userId !== userId) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Character not found",
          statusCode: 404,
        });
      }

      // Build update data with only defined fields
      const data: Record<string, unknown> = {};
      if (updates.name !== undefined) data.name = updates.name;
      if (updates.description !== undefined)
        data.description = updates.description;
      if (updates.appearancePrompt !== undefined)
        data.appearancePrompt = updates.appearancePrompt;
      if (updates.personalityTraits !== undefined)
        data.personalityTraits = updates.personalityTraits;
      if (updates.voiceProfile !== undefined)
        data.voiceProfile =
          updates.voiceProfile === null
            ? null
            : (updates.voiceProfile as Prisma.InputJsonValue);
      if (updates.ageRange !== undefined) data.ageRange = updates.ageRange;

      const updated = await fastify.prisma.character.update({
        where: { id },
        data,
      });

      return reply.send({ data: updated });
    },
  });

  // ──────────────────────────────────────────────────────────────────────
  // DELETE /:id — delete character (conflict check with shots)
  // ──────────────────────────────────────────────────────────────────────

  fastify.delete("/:id", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = characterIdParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const { id } = params.data;
      const userId = request.user.id;

      // Fetch character with project ownership check
      const existing = await fastify.prisma.character.findUnique({
        where: { id },
        include: {
          project: { select: { userId: true, id: true } },
        },
      });

      if (!existing || existing.project.userId !== userId) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Character not found",
          statusCode: 404,
        });
      }

      // Check if character is referenced in any shots (via charactersInShot string[])
      const shotsUsingCharacter = await fastify.prisma.shot.findMany({
        where: {
          scene: { projectId: existing.project.id },
          charactersInShot: { has: existing.name },
        },
        select: {
          id: true,
          shotNumber: true,
          scene: { select: { sceneNumber: true, title: true } },
        },
      });

      if (shotsUsingCharacter.length > 0) {
        const references = shotsUsingCharacter.map((s) => ({
          shotId: s.id,
          shotNumber: s.shotNumber,
          sceneNumber: s.scene.sceneNumber,
          sceneTitle: s.scene.title,
        }));

        return reply.status(409).send({
          error: "Conflict",
          message: `Character "${existing.name}" is used in ${shotsUsingCharacter.length} shot(s). Remove the character from those shots before deleting.`,
          statusCode: 409,
          references,
        });
      }

      await fastify.prisma.character.delete({ where: { id } });

      return reply.status(204).send();
    },
  });

  // ──────────────────────────────────────────────────────────────────────
  // POST /:id/generate-references — trigger AI reference image generation
  // ──────────────────────────────────────────────────────────────────────

  fastify.post("/:id/generate-references", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = characterIdParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const { id } = params.data;
      const userId = request.user.id;

      // Verify ownership via project
      const character = await fastify.prisma.character.findUnique({
        where: { id },
        include: {
          project: { select: { userId: true } },
        },
      });

      if (!character || character.project.userId !== userId) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Character not found",
          statusCode: 404,
        });
      }

      // Require an appearance prompt for generation
      if (!character.appearancePrompt) {
        return reply.status(400).send({
          error: "ValidationError",
          message:
            "Character must have an appearance prompt before generating reference images",
          statusCode: 400,
        });
      }

      // ── Mock generation (placeholder for real AI pipeline) ────────────
      const jobId = randomUUID();
      const mockUrls = [
        `https://cdn.genesis.ai/refs/${id}/front-${jobId.slice(0, 8)}.png`,
        `https://cdn.genesis.ai/refs/${id}/side-${jobId.slice(0, 8)}.png`,
        `https://cdn.genesis.ai/refs/${id}/back-${jobId.slice(0, 8)}.png`,
        `https://cdn.genesis.ai/refs/${id}/expression-${jobId.slice(0, 8)}.png`,
      ];

      // Persist mock URLs on the character record
      await fastify.prisma.character.update({
        where: { id },
        data: { referenceImages: mockUrls },
      });

      return reply.status(202).send({
        data: {
          jobId,
          characterId: id,
          status: "queued",
          message:
            "Reference image generation has been queued. Images will be available shortly.",
          referenceImages: mockUrls,
        },
      });
    },
  });
}
