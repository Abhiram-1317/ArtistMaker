// ─────────────────────────────────────────────────────────────────────────────
// Scene & Shot CRUD routes
// ─────────────────────────────────────────────────────────────────────────────
//  Nested:  /api/projects/:projectId/scenes   (list, create)
//  Mid:     /api/scenes/:id/shots             (list shots, create shot)
//  Top:     /api/shots/:id                    (patch, delete, regenerate)
// ─────────────────────────────────────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  TimeOfDay,
  Weather,
  SceneStatus,
  ShotType,
  CameraAngle,
  CameraMovement,
  ShotStatus,
} from "@genesis/database";
import type { Prisma } from "@prisma/client";

// ── Enum value arrays ────────────────────────────────────────────────────────

const timeOfDayValues = Object.values(TimeOfDay) as [string, ...string[]];
const weatherValues = Object.values(Weather) as [string, ...string[]];
const sceneStatusValues = Object.values(SceneStatus) as [string, ...string[]];
const shotTypeValues = Object.values(ShotType) as [string, ...string[]];
const cameraAngleValues = Object.values(CameraAngle) as [string, ...string[]];
const cameraMovementValues = Object.values(CameraMovement) as [
  string,
  ...string[],
];
const shotStatusValues = Object.values(ShotStatus) as [string, ...string[]];

// ── Zod schemas ──────────────────────────────────────────────────────────────

const projectIdParamSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});

const sceneIdParamSchema = z.object({
  id: z.string().min(1, "Scene ID is required"),
});

const shotIdParamSchema = z.object({
  id: z.string().min(1, "Shot ID is required"),
});

const createSceneSchema = z.object({
  sceneNumber: z.coerce.number().int().positive().optional(),
  title: z.string().max(500).optional().default("Untitled Scene"),
  locationDescription: z
    .string()
    .min(1, "Location description is required")
    .max(5000, "Location description must be 5000 characters or fewer"),
  timeOfDay: z
    .enum(timeOfDayValues)
    .optional()
    .default("MIDDAY")
    .transform((v) => v as TimeOfDay),
  weather: z
    .enum(weatherValues)
    .optional()
    .default("CLEAR")
    .transform((v) => v as Weather),
  mood: z.string().max(200).optional(),
  durationSeconds: z.coerce.number().positive().optional(),
  actionDescription: z.string().max(10000).optional(),
  dialogue: z.record(z.unknown()).optional(),
  cameraInstructions: z.record(z.unknown()).optional(),
});

const createShotSchema = z.object({
  shotNumber: z.coerce.number().int().positive().optional(),
  shotType: z
    .enum(shotTypeValues, {
      errorMap: () => ({
        message: `Shot type must be one of: ${shotTypeValues.join(", ")}`,
      }),
    })
    .default("MEDIUM")
    .transform((v) => v as ShotType),
  cameraAngle: z
    .enum(cameraAngleValues, {
      errorMap: () => ({
        message: `Camera angle must be one of: ${cameraAngleValues.join(", ")}`,
      }),
    })
    .default("EYE_LEVEL")
    .transform((v) => v as CameraAngle),
  cameraMovement: z
    .enum(cameraMovementValues)
    .default("STATIC")
    .transform((v) => v as CameraMovement),
  durationSeconds: z.coerce
    .number()
    .min(1, "Duration must be at least 1 second")
    .max(30, "Duration must be 30 seconds or fewer"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must be 5000 characters or fewer"),
  charactersInShot: z
    .array(z.string().min(1))
    .optional()
    .default([]),
  visualPrompt: z.string().max(5000).optional(),
  negativePrompt: z.string().max(2000).optional(),
});

const updateShotSchema = z.object({
  shotType: z
    .enum(shotTypeValues)
    .optional()
    .transform((v) => (v ? (v as ShotType) : undefined)),
  cameraAngle: z
    .enum(cameraAngleValues)
    .optional()
    .transform((v) => (v ? (v as CameraAngle) : undefined)),
  cameraMovement: z
    .enum(cameraMovementValues)
    .optional()
    .transform((v) => (v ? (v as CameraMovement) : undefined)),
  durationSeconds: z.coerce.number().min(1).max(30).optional(),
  description: z.string().min(1).max(5000).optional(),
  charactersInShot: z.array(z.string().min(1)).optional(),
  visualPrompt: z.string().max(5000).nullable().optional(),
  negativePrompt: z.string().max(2000).nullable().optional(),
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

// ── Project-scoped scene routes: /api/projects/:projectId/scenes ─────────────

export async function projectSceneRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.addHook("preHandler", fastify.authenticate);

  // ──────────────────────────────────────────────────────────────────────
  // GET / — list all scenes for a project
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

      const scenes = await fastify.prisma.scene.findMany({
        where: { projectId },
        orderBy: { sceneNumber: "asc" },
        include: {
          _count: { select: { shots: true, audioTracks: true } },
        },
      });

      const data = scenes.map((s) => {
        const { _count, ...scene } = s;
        return {
          ...scene,
          shotCount: _count.shots,
          audioTrackCount: _count.audioTracks,
        };
      });

      return reply.send({
        data,
        meta: { total: scenes.length },
      });
    },
  });

  // ──────────────────────────────────────────────────────────────────────
  // POST / — create a new scene for a project
  // ──────────────────────────────────────────────────────────────────────

  fastify.post("/", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = projectIdParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const body = createSceneSchema.safeParse(request.body);
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
        title,
        locationDescription,
        timeOfDay,
        weather,
        mood,
        durationSeconds,
        actionDescription,
        dialogue,
        cameraInstructions,
      } = body.data;

      // Auto-increment sceneNumber if not provided
      let sceneNumber = body.data.sceneNumber;
      if (!sceneNumber) {
        const last = await fastify.prisma.scene.findFirst({
          where: { projectId },
          orderBy: { sceneNumber: "desc" },
          select: { sceneNumber: true },
        });
        sceneNumber = (last?.sceneNumber ?? 0) + 1;
      }

      const scene = await fastify.prisma.scene.create({
        data: {
          projectId,
          sceneNumber,
          title: title ?? "Untitled Scene",
          locationDescription,
          timeOfDay,
          weather,
          mood: mood ?? null,
          durationSeconds: durationSeconds ?? null,
          actionDescription: actionDescription ?? null,
          dialogue: (dialogue ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          cameraInstructions: (cameraInstructions ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
        },
        include: {
          _count: { select: { shots: true } },
        },
      });

      const { _count, ...sceneData } = scene;
      return reply.status(201).send({
        data: { ...sceneData, shotCount: _count.shots },
      });
    },
  });
}

// ── Scene-scoped shot routes: /api/scenes/:id/shots ──────────────────────────

export async function sceneShotRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.addHook("preHandler", fastify.authenticate);

  // Helper: verify scene ownership via project
  async function verifySceneOwnership(
    sceneId: string,
    userId: string,
    fastifyInstance: FastifyInstance,
  ) {
    const scene = await fastifyInstance.prisma.scene.findUnique({
      where: { id: sceneId },
      include: {
        project: { select: { userId: true, id: true } },
      },
    });
    if (!scene || scene.project.userId !== userId) return null;
    return scene;
  }

  // ──────────────────────────────────────────────────────────────────────
  // GET / — list all shots for a scene
  // ──────────────────────────────────────────────────────────────────────

  fastify.get("/", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = sceneIdParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const { id } = params.data;
      const userId = request.user.id;

      const scene = await verifySceneOwnership(id, userId, fastify);
      if (!scene) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Scene not found",
          statusCode: 404,
        });
      }

      const shots = await fastify.prisma.shot.findMany({
        where: { sceneId: id },
        orderBy: { shotNumber: "asc" },
        include: {
          renderJobs: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              progress: true,
              outputUrl: true,
            },
          },
        },
      });

      const data = shots.map((s) => {
        const { renderJobs, ...shot } = s;
        return {
          ...shot,
          latestRenderJob: renderJobs[0] ?? null,
        };
      });

      return reply.send({
        data,
        meta: {
          total: shots.length,
          sceneId: id,
          sceneNumber: scene.sceneNumber,
        },
      });
    },
  });

  // ──────────────────────────────────────────────────────────────────────
  // POST / — create a new shot in a scene
  // ──────────────────────────────────────────────────────────────────────

  fastify.post("/", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = sceneIdParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const body = createShotSchema.safeParse(request.body);
      if (!body.success) return zodError(reply, body.error);

      const { id: sceneId } = params.data;
      const userId = request.user.id;

      const scene = await verifySceneOwnership(sceneId, userId, fastify);
      if (!scene) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Scene not found",
          statusCode: 404,
        });
      }

      const {
        shotType,
        cameraAngle,
        cameraMovement,
        durationSeconds,
        description,
        charactersInShot,
        visualPrompt,
        negativePrompt,
      } = body.data;

      // Auto-increment shotNumber if not provided
      let shotNumber = body.data.shotNumber;
      if (!shotNumber) {
        const last = await fastify.prisma.shot.findFirst({
          where: { sceneId },
          orderBy: { shotNumber: "desc" },
          select: { shotNumber: true },
        });
        shotNumber = (last?.shotNumber ?? 0) + 1;
      }

      // Create shot and update scene duration in a transaction
      const shot = await fastify.prisma.$transaction(async (tx) => {
        const created = await tx.shot.create({
          data: {
            sceneId,
            shotNumber,
            shotType,
            cameraAngle,
            cameraMovement,
            durationSeconds,
            description,
            charactersInShot,
            visualPrompt: visualPrompt ?? null,
            negativePrompt: negativePrompt ?? null,
          },
        });

        // Recalculate scene duration from all shots
        const aggregate = await tx.shot.aggregate({
          where: { sceneId },
          _sum: { durationSeconds: true },
        });

        await tx.scene.update({
          where: { id: sceneId },
          data: { durationSeconds: aggregate._sum.durationSeconds ?? 0 },
        });

        return created;
      });

      return reply.status(201).send({ data: shot });
    },
  });
}

// ── Top-level shot routes: /api/shots/:id ────────────────────────────────────

export async function shotRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", fastify.authenticate);

  // Helper: verify shot ownership via scene → project
  async function verifyShotOwnership(
    shotId: string,
    userId: string,
    fastifyInstance: FastifyInstance,
  ) {
    const shot = await fastifyInstance.prisma.shot.findUnique({
      where: { id: shotId },
      include: {
        scene: {
          include: {
            project: { select: { userId: true, id: true } },
          },
        },
      },
    });
    if (!shot || shot.scene.project.userId !== userId) return null;
    return shot;
  }

  // ──────────────────────────────────────────────────────────────────────
  // PATCH /:id — update shot properties
  // ──────────────────────────────────────────────────────────────────────

  fastify.patch("/:id", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = shotIdParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const body = updateShotSchema.safeParse(request.body);
      if (!body.success) return zodError(reply, body.error);

      const { id } = params.data;
      const userId = request.user.id;
      const updates = body.data;

      // Check at least one field
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

      const existing = await verifyShotOwnership(id, userId, fastify);
      if (!existing) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Shot not found",
          statusCode: 404,
        });
      }

      // Build update data
      const data: Record<string, unknown> = {};
      if (updates.shotType !== undefined) data.shotType = updates.shotType;
      if (updates.cameraAngle !== undefined)
        data.cameraAngle = updates.cameraAngle;
      if (updates.cameraMovement !== undefined)
        data.cameraMovement = updates.cameraMovement;
      if (updates.durationSeconds !== undefined)
        data.durationSeconds = updates.durationSeconds;
      if (updates.description !== undefined)
        data.description = updates.description;
      if (updates.charactersInShot !== undefined)
        data.charactersInShot = updates.charactersInShot;
      if (updates.visualPrompt !== undefined)
        data.visualPrompt = updates.visualPrompt;
      if (updates.negativePrompt !== undefined)
        data.negativePrompt = updates.negativePrompt;

      // Update shot and recalculate scene duration if duration changed
      const updated = await fastify.prisma.$transaction(async (tx) => {
        const result = await tx.shot.update({
          where: { id },
          data,
        });

        if (updates.durationSeconds !== undefined) {
          const aggregate = await tx.shot.aggregate({
            where: { sceneId: existing.sceneId },
            _sum: { durationSeconds: true },
          });
          await tx.scene.update({
            where: { id: existing.sceneId },
            data: {
              durationSeconds: aggregate._sum.durationSeconds ?? 0,
            },
          });
        }

        return result;
      });

      return reply.send({ data: updated });
    },
  });

  // ──────────────────────────────────────────────────────────────────────
  // DELETE /:id — delete shot
  // ──────────────────────────────────────────────────────────────────────

  fastify.delete("/:id", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = shotIdParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const { id } = params.data;
      const userId = request.user.id;

      const existing = await verifyShotOwnership(id, userId, fastify);
      if (!existing) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Shot not found",
          statusCode: 404,
        });
      }

      await fastify.prisma.$transaction(async (tx) => {
        // Cancel any active render jobs for this shot
        await tx.renderJob.updateMany({
          where: {
            shotId: id,
            status: { in: ["PENDING", "QUEUED", "PROCESSING"] },
          },
          data: { status: "CANCELLED" },
        });

        // Delete the shot
        await tx.shot.delete({ where: { id } });

        // Recalculate scene duration
        const aggregate = await tx.shot.aggregate({
          where: { sceneId: existing.sceneId },
          _sum: { durationSeconds: true },
        });
        await tx.scene.update({
          where: { id: existing.sceneId },
          data: {
            durationSeconds: aggregate._sum.durationSeconds ?? 0,
          },
        });
      });

      return reply.status(204).send();
    },
  });

  // ──────────────────────────────────────────────────────────────────────
  // POST /:id/regenerate — queue shot for regeneration
  // ──────────────────────────────────────────────────────────────────────

  fastify.post("/:id/regenerate", {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = shotIdParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const { id } = params.data;
      const userId = request.user.id;

      const existing = await verifyShotOwnership(id, userId, fastify);
      if (!existing) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Shot not found",
          statusCode: 404,
        });
      }

      if (!existing.description) {
        return reply.status(400).send({
          error: "ValidationError",
          message: "Shot must have a description before regeneration",
          statusCode: 400,
        });
      }

      // Create render job and reset shot status in a transaction
      const result = await fastify.prisma.$transaction(async (tx) => {
        // Cancel any existing active jobs for this shot
        await tx.renderJob.updateMany({
          where: {
            shotId: id,
            status: { in: ["PENDING", "QUEUED", "PROCESSING"] },
          },
          data: { status: "CANCELLED" },
        });

        // Create new render job
        const renderJob = await tx.renderJob.create({
          data: {
            projectId: existing.scene.project.id,
            shotId: id,
            userId,
            jobType: "SHOT_GENERATION",
            status: "QUEUED",
            metadata: {
              shotType: existing.shotType,
              cameraAngle: existing.cameraAngle,
              cameraMovement: existing.cameraMovement,
              description: existing.description,
              visualPrompt: existing.visualPrompt,
              charactersInShot: existing.charactersInShot,
              queuedAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });

        // Update shot status to QUEUED
        await tx.shot.update({
          where: { id },
          data: {
            status: "QUEUED",
            renderJobId: renderJob.id,
            generatedVideoUrl: null,
            generatedThumbnailUrl: null,
          },
        });

        return renderJob;
      });

      return reply.status(202).send({
        data: {
          jobId: result.id,
          shotId: id,
          status: result.status,
          jobType: result.jobType,
          message:
            "Shot has been queued for regeneration. Check job status for progress.",
        },
      });
    },
  });
}
