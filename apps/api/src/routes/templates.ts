// ─────────────────────────────────────────────────────────────────────────────
// Template routes — /api/templates
// ─────────────────────────────────────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { Genre, TemplateCategory } from "@genesis/database";
import type { Prisma } from "@prisma/client";
import { setCacheHeaders } from "../utils/api-helpers.js";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const genreValues = Object.values(Genre) as [string, ...string[]];
const categoryValues = Object.values(TemplateCategory) as [string, ...string[]];

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z
    .enum(categoryValues)
    .optional()
    .transform((v) => v as TemplateCategory | undefined),
  genre: z
    .enum(genreValues)
    .optional()
    .transform((v) => v as Genre | undefined),
  search: z.string().max(200).optional(),
  sort: z.enum(["popular", "rating", "newest"]).default("popular"),
  isPremium: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(categoryValues),
  description: z.string().max(2000).optional(),
  promptTemplate: z.string().max(5000).optional(),
  genre: z.enum(genreValues).optional(),
  stylePreset: z.string().max(200).optional(),
  characterTemplates: z.unknown().optional(),
  sceneTemplates: z.unknown().optional(),
  settingsTemplate: z.unknown().optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

const rateSchema = z.object({
  rating: z.number().min(1).max(5),
});

const idParamSchema = z.object({
  id: z.string().min(1, "Template ID is required"),
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

// ── Route plugin ─────────────────────────────────────────────────────────────

export async function templateRoutes(fastify: FastifyInstance): Promise<void> {
  // ────────────────────────────────────────────────────────────────────────
  // GET / — list templates with filters & sorting
  // ────────────────────────────────────────────────────────────────────────

  fastify.get("/", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listQuerySchema.safeParse(request.query);
      if (!parsed.success) return zodError(reply, parsed.error);

      const { page, limit, category, genre, search, sort, isPremium } = parsed.data;
      const skip = (page - 1) * limit;

      const where: Prisma.TemplateWhereInput = { isPublic: true };
      if (category) where.category = category;
      if (genre) where.genre = genre;
      if (isPremium !== undefined) where.isPremium = isPremium;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { tags: { hasSome: [search.toLowerCase()] } },
        ];
      }

      const orderBy: Prisma.TemplateOrderByWithRelationInput =
        sort === "rating"
          ? { rating: "desc" }
          : sort === "newest"
            ? { createdAt: "desc" }
            : { usageCount: "desc" };

      const [templates, total] = await Promise.all([
        fastify.prisma.template.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            createdBy: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
          },
        }),
        fastify.prisma.template.count({ where }),
      ]);

      // Cache template listings for 5 minutes
      setCacheHeaders(reply, 300, 600);

      return reply.send({
        data: templates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      });
    },
  });

  // ────────────────────────────────────────────────────────────────────────
  // GET /:id — get single template
  // ────────────────────────────────────────────────────────────────────────

  fastify.get("/:id", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const template = await fastify.prisma.template.findUnique({
        where: { id: params.data.id },
        include: {
          createdBy: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      });

      if (!template) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Template not found",
          statusCode: 404,
        });
      }

      return reply.send({ data: template });
    },
  });

  // ────────────────────────────────────────────────────────────────────────
  // POST /:id/use — create a project from a template
  // ────────────────────────────────────────────────────────────────────────

  fastify.post("/:id/use", {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const template = await fastify.prisma.template.findUnique({
        where: { id: params.data.id },
      });

      if (!template) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Template not found",
          statusCode: 404,
        });
      }

      const userId = request.user.id;
      const body = request.body as Record<string, unknown> | null;
      const customTitle = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : null;
      const settings = (template.settingsTemplate as Record<string, unknown>) ?? {};
      const charTemplates = (template.characterTemplates as Array<Record<string, unknown>>) ?? [];

      // Create project from template in a transaction
      const project = await fastify.prisma.$transaction(async (tx) => {
        const created = await tx.project.create({
          data: {
            userId,
            title: customTitle ?? template.name,
            description: template.description,
            genre: template.genre ?? "OTHER",
            status: "DRAFT",
            stylePreset: template.stylePreset,
            resolution: (settings.resolution as string) ?? "1920x1080",
            fps: (settings.fps as number) ?? 24,
            aspectRatio: (settings.aspectRatio as string) ?? "16:9",
            metadata: {
              fromTemplate: template.id,
              templateName: template.name,
            },
            scripts: template.promptTemplate
              ? {
                  create: {
                    version: 1,
                    rawPrompt: template.promptTemplate,
                    tone: template.stylePreset ?? "cinematic",
                  },
                }
              : undefined,
            characters: charTemplates.length > 0
              ? {
                  create: charTemplates.map((c) => ({
                    name: (c.name as string) ?? "Character",
                    description: (c.description as string) ?? null,
                    appearancePrompt: (c.appearancePrompt as string) ?? null,
                    personalityTraits: (c.personalityTraits as string[]) ?? [],
                  })),
                }
              : undefined,
          },
          include: {
            scripts: true,
            characters: true,
          },
        });

        // Increment template usage count
        await tx.template.update({
          where: { id: template.id },
          data: { usageCount: { increment: 1 } },
        });

        return created;
      });

      return reply.status(201).send({ data: project });
    },
  });

  // ────────────────────────────────────────────────────────────────────────
  // POST / — create a custom template (authenticated)
  // ────────────────────────────────────────────────────────────────────────

  fastify.post("/", {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createTemplateSchema.safeParse(request.body);
      if (!parsed.success) return zodError(reply, parsed.error);

      const userId = request.user.id;
      const {
        name,
        category,
        description,
        promptTemplate,
        genre,
        stylePreset,
        characterTemplates,
        sceneTemplates,
        settingsTemplate,
        isPublic,
        tags,
      } = parsed.data;

      const template = await fastify.prisma.template.create({
        data: {
          name,
          category: category as TemplateCategory,
          description,
          promptTemplate,
          genre: genre as Genre | undefined,
          stylePreset,
          characterTemplates: characterTemplates as Prisma.InputJsonValue,
          sceneTemplates: sceneTemplates as Prisma.InputJsonValue,
          settingsTemplate: settingsTemplate as Prisma.InputJsonValue,
          isPublic,
          tags,
          createdById: userId,
        },
        include: {
          createdBy: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      });

      return reply.status(201).send({ data: template });
    },
  });

  // ────────────────────────────────────────────────────────────────────────
  // PATCH /:id/rate — rate a template
  // ────────────────────────────────────────────────────────────────────────

  fastify.patch("/:id/rate", {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const parsed = rateSchema.safeParse(request.body);
      if (!parsed.success) return zodError(reply, parsed.error);

      const template = await fastify.prisma.template.findUnique({
        where: { id: params.data.id },
        select: { id: true, rating: true, usageCount: true },
      });

      if (!template) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Template not found",
          statusCode: 404,
        });
      }

      // Running average: new_avg = old_avg + (new_rating - old_avg) / count
      const count = Math.max(template.usageCount, 1);
      const newRating =
        template.rating + (parsed.data.rating - template.rating) / count;

      const updated = await fastify.prisma.template.update({
        where: { id: params.data.id },
        data: { rating: Math.round(newRating * 100) / 100 },
      });

      return reply.send({ data: updated });
    },
  });
}
