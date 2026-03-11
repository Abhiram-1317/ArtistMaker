// ─────────────────────────────────────────────────────────────────────────────
// Project CRUD routes — /api/projects
// ─────────────────────────────────────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { Genre, ProjectStatus } from "@genesis/database";
import type { Prisma } from "@prisma/client";
import { addRenderJob, renderQueue } from "../queues/renderQueue.js";
import type { GenerateMovieJobData } from "../queues/renderQueue.js";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const genreValues = Object.values(Genre) as [string, ...string[]];
const statusValues = Object.values(ProjectStatus) as [string, ...string[]];

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(statusValues)
    .optional()
    .transform((v) => v as ProjectStatus | undefined),
  genre: z
    .enum(genreValues)
    .optional()
    .transform((v) => v as Genre | undefined),
});

const createProjectSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(500, "Title must be 500 characters or fewer"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be 5000 characters or fewer"),
  genre: z.enum(genreValues, {
    errorMap: () => ({ message: `Genre must be one of: ${genreValues.join(", ")}` }),
  }),
  style: z.string().min(1, "Style is required"),
  duration: z.coerce
    .number()
    .int()
    .min(15, "Duration must be at least 15 seconds")
    .max(300, "Duration must be 300 seconds or fewer"),
  resolution: z.enum(["720p", "1080p", "4K"], {
    errorMap: () => ({ message: "Resolution must be 720p, 1080p, or 4K" }),
  }),
  frameRate: z.coerce.number().int().min(24).max(60).default(24),
  aspectRatio: z.string().default("16:9"),
  characters: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        appearancePrompt: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  metadata: z.record(z.unknown()).optional(),
});

const updateProjectSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).max(5000).optional(),
  status: z
    .enum(statusValues)
    .optional()
    .transform((v) => v as ProjectStatus | undefined),
});

const idParamSchema = z.object({
  id: z.string().min(1, "Project ID is required"),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapResolution(res: string): string {
  switch (res) {
    case "720p":
      return "1280x720";
    case "4K":
      return "3840x2160";
    case "1080p":
    default:
      return "1920x1080";
  }
}

function estimateCost(duration: number, resolution: string, fps: number): number {
  const resMul = resolution === "4K" ? 5 : resolution === "1080p" ? 2 : 1;
  const fpsMul = fps >= 60 ? 1.5 : fps >= 30 ? 1.1 : 1;
  const blocks = Math.ceil(duration / 15);
  return Math.ceil(blocks * resMul * fpsMul);
}

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

export async function projectRoutes(fastify: FastifyInstance): Promise<void> {
  // All project routes require authentication
  fastify.addHook("preHandler", fastify.authenticate);

  // ────────────────────────────────────────────────────────────────────────
  // GET / — list projects for authenticated user
  // ────────────────────────────────────────────────────────────────────────

  fastify.get("/", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listQuerySchema.safeParse(request.query);
      if (!parsed.success) return zodError(reply, parsed.error);

      const { page, limit, status, genre } = parsed.data;
      const skip = (page - 1) * limit;
      const userId = request.user.id;

      // Build where clause
      const where: Record<string, unknown> = { userId };
      if (status) where.status = status;
      if (genre) where.genre = genre;

      const [projects, total] = await Promise.all([
        fastify.prisma.project.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: "desc" },
          include: {
            _count: {
              select: {
                scenes: true,
                characters: true,
                renderJobs: true,
              },
            },
            renderJobs: {
              where: { status: "COMPLETED" },
              select: { id: true },
            },
          },
        }),
        fastify.prisma.project.count({ where }),
      ]);

      // Shape response with aggregate data
      const data = projects.map((p) => {
        const { renderJobs, _count, ...project } = p;
        return {
          ...project,
          sceneCount: _count.scenes,
          characterCount: _count.characters,
          totalRenderJobs: _count.renderJobs,
          completedRenderJobs: renderJobs.length,
        };
      });

      return reply.send({
        data,
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
  // POST / — create a new project
  // ────────────────────────────────────────────────────────────────────────

  fastify.post("/", {
    config: {
      rateLimit: { max: 10, timeWindow: "1 minute" },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createProjectSchema.safeParse(request.body);
      if (!parsed.success) return zodError(reply, parsed.error);

      const {
        title,
        description,
        genre,
        style,
        duration,
        resolution,
        frameRate,
        aspectRatio,
        characters,
        metadata,
      } = parsed.data;

      const userId = request.user.id;

      // Check user credit balance
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { creditsBalance: true },
      });

      if (!user) {
        return reply.status(404).send({
          error: "NotFound",
          message: "User not found",
          statusCode: 404,
        });
      }

      const cost = estimateCost(duration, resolution, frameRate);

      if (user.creditsBalance < cost) {
        return reply.status(402).send({
          error: "InsufficientCredits",
          message: `This project requires ${cost} credits but you only have ${user.creditsBalance}`,
          statusCode: 402,
          required: cost,
          available: user.creditsBalance,
        });
      }

      // Create project with initial script and characters in a transaction
      const project = await fastify.prisma.$transaction(async (tx) => {
        const created = await tx.project.create({
          data: {
            userId,
            title,
            description,
            genre: genre as Genre,
            status: "DRAFT",
            stylePreset: style,
            resolution: mapResolution(resolution),
            fps: frameRate,
            aspectRatio,
            totalCostCredits: cost,
            metadata: (metadata ?? {
              duration,
              originalResolution: resolution,
              colorGrading: "neutral",
            }) as Prisma.InputJsonValue,
            scripts: {
              create: {
                version: 1,
                rawPrompt: description,
                tone: style,
              },
            },
            characters: {
              create: characters.map((c) => ({
                name: c.name,
                description: c.description ?? null,
                appearancePrompt: c.appearancePrompt ?? null,
              })),
            },
          },
          include: {
            scripts: true,
            characters: true,
          },
        });

        // Deduct credits
        await tx.user.update({
          where: { id: userId },
          data: { creditsBalance: { decrement: cost } },
        });

        return created;
      });

      return reply.status(201).send({
        data: project,
        meta: {
          creditsCharged: cost,
          remainingCredits: user.creditsBalance - cost,
        },
      });
    },
  });

  // ────────────────────────────────────────────────────────────────────────
  // GET /:id — get single project with all related data
  // ────────────────────────────────────────────────────────────────────────

  fastify.get("/:id", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const { id } = params.data;
      const userId = request.user.id;

      const project = await fastify.prisma.project.findUnique({
        where: { id },
        include: {
          scripts: {
            orderBy: { version: "desc" },
          },
          characters: {
            orderBy: { createdAt: "asc" },
          },
          scenes: {
            orderBy: { sceneNumber: "asc" },
            include: {
              shots: {
                orderBy: { shotNumber: "asc" },
              },
            },
          },
          audioTracks: {
            orderBy: { startTimeSeconds: "asc" },
          },
          renderJobs: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!project || project.userId !== userId) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Project not found",
          statusCode: 404,
        });
      }

      return reply.send({ data: project });
    },
  });

  // ────────────────────────────────────────────────────────────────────────
  // PATCH /:id — update project properties
  // ────────────────────────────────────────────────────────────────────────

  fastify.patch("/:id", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const body = updateProjectSchema.safeParse(request.body);
      if (!body.success) return zodError(reply, body.error);

      const { id } = params.data;
      const userId = request.user.id;
      const updates = body.data;

      // Check no empty update
      if (Object.keys(updates).filter((k) => updates[k as keyof typeof updates] !== undefined).length === 0) {
        return reply.status(400).send({
          error: "ValidationError",
          message: "At least one field must be provided to update",
          statusCode: 400,
        });
      }

      // Verify ownership
      const existing = await fastify.prisma.project.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Project not found",
          statusCode: 404,
        });
      }

      // Build update object with only defined fields
      const data: Record<string, unknown> = {};
      if (updates.title !== undefined) data.title = updates.title;
      if (updates.description !== undefined) data.description = updates.description;
      if (updates.status !== undefined) data.status = updates.status;

      const updated = await fastify.prisma.project.update({
        where: { id },
        data,
        include: {
          scripts: { orderBy: { version: "desc" }, take: 1 },
          _count: {
            select: { scenes: true, characters: true },
          },
        },
      });

      return reply.send({ data: updated });
    },
  });

  // ────────────────────────────────────────────────────────────────────────
  // DELETE /:id — soft-delete project
  // ────────────────────────────────────────────────────────────────────────

  fastify.delete("/:id", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const { id } = params.data;
      const userId = request.user.id;

      // Verify ownership
      const existing = await fastify.prisma.project.findUnique({
        where: { id },
        select: { userId: true, status: true },
      });

      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Project not found",
          statusCode: 404,
        });
      }

      // Archive the project and cascade-clean related data
      await fastify.prisma.$transaction(async (tx) => {
        // Cancel any active render jobs
        await tx.renderJob.updateMany({
          where: {
            projectId: id,
            status: { in: ["PENDING", "QUEUED", "PROCESSING"] },
          },
          data: { status: "CANCELLED" },
        });

        // Clean up generated assets
        await tx.audioTrack.deleteMany({ where: { projectId: id } });

        // Delete shots via scenes
        const sceneIds = await tx.scene.findMany({
          where: { projectId: id },
          select: { id: true },
        });
        if (sceneIds.length > 0) {
          await tx.shot.deleteMany({
            where: { sceneId: { in: sceneIds.map((s) => s.id) } },
          });
        }

        // Delete scenes, scripts, characters
        await tx.scene.deleteMany({ where: { projectId: id } });
        await tx.script.deleteMany({ where: { projectId: id } });
        await tx.character.deleteMany({ where: { projectId: id } });

        // Archive the project (soft delete)
        await tx.project.update({
          where: { id },
          data: {
            status: "ARCHIVED",
            metadata: {
              deletedAt: new Date().toISOString(),
              previousStatus: existing.status,
            },
          },
        });
      });

      return reply.status(204).send();
    },
  });

  // ────────────────────────────────────────────────────────────────────────
  // POST /:id/generate — queue full movie generation
  // ────────────────────────────────────────────────────────────────────────

  fastify.post<{ Params: { id: string } }>("/:id/generate", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const { id } = params.data;
      const userId = request.user.id;
      const userTier = request.user.tier;

      // Fetch project with all related data the worker needs
      const project = await fastify.prisma.project.findUnique({
        where: { id },
        include: {
          characters: true,
          scenes: {
            orderBy: { sceneNumber: "asc" },
            include: {
              shots: { orderBy: { shotNumber: "asc" } },
            },
          },
        },
      });

      if (!project) {
        return reply.status(404).send({ error: "Project not found" });
      }

      if (project.userId !== userId) {
        return reply.status(403).send({ error: "Not authorized" });
      }

      if (project.status === ProjectStatus.RENDERING) {
        return reply.status(409).send({ error: "Movie generation already in progress" });
      }

      // Validate minimum requirements
      if (project.characters.length === 0) {
        return reply.status(400).send({ error: "Project must have at least one character" });
      }

      // Auto-create a default scene + shot if none exist (for quick generation)
      if (project.scenes.length === 0) {
        const scene = await fastify.prisma.scene.create({
          data: {
            projectId: id,
            sceneNumber: 1,
            title: project.title,
            locationDescription: project.description || "A cinematic scene",
            actionDescription: project.description || project.title,
          },
        });
        await fastify.prisma.shot.create({
          data: {
            sceneId: scene.id,
            shotNumber: 1,
            durationSeconds: 5,
            description: project.description || project.title,
            visualPrompt: project.description || project.title,
            charactersInShot: project.characters.map((c) => c.name),
          },
        });
        // Re-fetch with the new scene + shot
        const updated = await fastify.prisma.project.findUnique({
          where: { id },
          include: {
            characters: true,
            scenes: {
              orderBy: { sceneNumber: "asc" },
              include: { shots: { orderBy: { shotNumber: "asc" } } },
            },
          },
        });
        if (updated) {
          Object.assign(project, updated);
        }
      }

      const totalShots = project.scenes.reduce(
        (sum, s) => sum + s.shots.length,
        0,
      );

      if (totalShots === 0) {
        return reply.status(400).send({ error: "Project must have at least one shot" });
      }

      // Check credits
      const estimatedCost = totalShots * 10;
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { creditsBalance: true },
      });

      if (user && user.creditsBalance < estimatedCost) {
        return reply.status(402).send({
          error: "Insufficient credits",
          required: estimatedCost,
          current: user.creditsBalance,
        });
      }

      // Update project status
      await fastify.prisma.project.update({
        where: { id },
        data: { status: ProjectStatus.RENDERING },
      });

      // Build job data with full project snapshot
      const jobData: GenerateMovieJobData = {
        type: "generate-movie",
        projectId: id,
        userId,
        config: {
          quality: "standard",
          resolution: { width: 1920, height: 1080 },
          fps: project.fps,
          includeAudio: true,
        },
        project: {
          stylePreset: project.stylePreset,
          resolution: project.resolution,
          characters: project.characters.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            voiceProfile: c.voiceProfile,
          })),
          scenes: project.scenes.map((s) => ({
            id: s.id,
            sceneNumber: s.sceneNumber,
            locationDescription: s.locationDescription,
            timeOfDay: s.timeOfDay,
            weather: s.weather,
            mood: s.mood,
            durationSeconds: s.durationSeconds,
            dialogue: s.dialogue,
            description: s.actionDescription,
            shots: s.shots.map((sh) => ({
              id: sh.id,
              shotNumber: sh.shotNumber,
              shotType: sh.shotType,
              cameraAngle: sh.cameraAngle,
              durationSeconds: sh.durationSeconds,
              description: sh.description,
              negativePrompt: sh.negativePrompt,
              charactersInShot: sh.charactersInShot,
              sceneId: sh.sceneId,
            })),
          })),
        },
      };

      const job = await addRenderJob(jobData, userTier);

      const minutesPerShot = 2;
      const totalMinutes = totalShots * minutesPerShot;
      const estimatedTime =
        totalMinutes < 60
          ? `${totalMinutes} minutes`
          : `${Math.round(totalMinutes / 60)} hours`;

      return reply.status(202).send({
        success: true,
        jobId: job.id,
        status: "queued",
        message: "Movie generation started",
        estimatedTime,
        totalShots,
        estimatedCost,
      });
    },
  });

  // ────────────────────────────────────────────────────────────────────────
  // GET /:id/render-status — get render status for a project
  // ────────────────────────────────────────────────────────────────────────

  fastify.get<{ Params: { id: string } }>("/:id/render-status", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const { id } = params.data;
      const userId = request.user.id;

      // Verify ownership
      const project = await fastify.prisma.project.findUnique({
        where: { id },
        select: { userId: true, status: true },
      });

      if (!project || project.userId !== userId) {
        return reply.status(404).send({ error: "Project not found" });
      }

      // Find most recent job for this project across all states
      const allJobs = await renderQueue.getJobs([
        "waiting",
        "active",
        "completed",
        "failed",
        "delayed",
      ]);
      const projectJobs = allJobs
        .filter((j) => j.data.projectId === id)
        .sort((a, b) => b.timestamp - a.timestamp);

      if (projectJobs.length === 0) {
        return reply.send({ status: "not_started", progress: 0 });
      }

      const latest = projectJobs[0];
      const state = await latest.getState();

      return reply.send({
        jobId: latest.id,
        status: state,
        progress: latest.progress() || 0,
        result: state === "completed" ? latest.returnvalue : undefined,
        error: state === "failed" ? latest.failedReason : undefined,
        createdAt: latest.timestamp,
      });
    },
  });
}
