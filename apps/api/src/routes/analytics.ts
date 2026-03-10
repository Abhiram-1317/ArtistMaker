// ─────────────────────────────────────────────────────────────────────────────
// Analytics routes — /api/analytics
// ─────────────────────────────────────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  granularity: z.enum(["day", "week", "month"]).default("day"),
});

const trackEventSchema = z.object({
  eventType: z.enum(["play", "pause", "seek", "ended", "progress"]),
  projectId: z.string().min(1),
  data: z.object({
    sessionId: z.string().min(1),
    currentTime: z.number().min(0).optional(),
    duration: z.number().min(0).optional(),
    deviceType: z.string().optional(),
    referrer: z.string().max(500).optional(),
    country: z.string().max(100).optional(),
  }),
});

const idParamSchema = z.object({
  id: z.string().min(1),
});

function zodError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({
    error: "ValidationError",
    message: error.errors.map((e) => e.message).join(", "),
    statusCode: 400,
  });
}

// ── Routes ───────────────────────────────────────────────────────────────────

export async function analyticsRoutes(fastify: FastifyInstance) {
  // ────────────────────────────────────────────────────────────────────────
  // POST /track — track a view/play event
  // ────────────────────────────────────────────────────────────────────────

  fastify.post("/track", {
    config: {
      rateLimit: { max: 60, timeWindow: "1 minute" },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = trackEventSchema.safeParse(request.body);
      if (!parsed.success) return zodError(reply, parsed.error);

      const { eventType, projectId, data } = parsed.data;

      // Optional auth — viewers may be anonymous
      let userId: string | null = null;
      try {
        await fastify.authenticate(request, reply);
        userId = request.user?.id ?? null;
      } catch {
        // Anonymous viewer
      }

      if (eventType === "play" || eventType === "progress") {
        // Upsert a view event for this session
        const existing = await fastify.prisma.viewEvent.findFirst({
          where: { projectId, sessionId: data.sessionId },
        });

        if (existing) {
          await fastify.prisma.viewEvent.update({
            where: { id: existing.id },
            data: {
              watchedSeconds: data.currentTime ?? existing.watchedSeconds,
              totalDuration: data.duration ?? existing.totalDuration,
              userId: userId ?? existing.userId,
            },
          });
        } else {
          await fastify.prisma.viewEvent.create({
            data: {
              projectId,
              userId,
              sessionId: data.sessionId,
              watchedSeconds: data.currentTime ?? 0,
              totalDuration: data.duration ?? 0,
              deviceType: data.deviceType ?? null,
              country: data.country ?? null,
              referrer: data.referrer ?? null,
            },
          });
        }
      }

      if (eventType === "ended") {
        // Mark completed
        const existing = await fastify.prisma.viewEvent.findFirst({
          where: { projectId, sessionId: data.sessionId },
        });
        if (existing) {
          await fastify.prisma.viewEvent.update({
            where: { id: existing.id },
            data: {
              completedAt: new Date(),
              watchedSeconds: data.duration ?? existing.watchedSeconds,
            },
          });
        }
      }

      return reply.send({ ok: true });
    },
  });

  // ────────────────────────────────────────────────────────────────────────
  // GET /projects/:id — analytics for a single project
  // ────────────────────────────────────────────────────────────────────────

  fastify.get("/projects/:id", {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = idParamSchema.safeParse(request.params);
      if (!params.success) return zodError(reply, params.error);

      const query = dateRangeSchema.safeParse(request.query);
      if (!query.success) return zodError(reply, query.error);

      const { id } = params.data;
      const { startDate, endDate, granularity } = query.data;
      const userId = request.user.id;

      // Verify ownership
      const project = await fastify.prisma.project.findFirst({
        where: { id, userId },
      });

      if (!project) {
        return reply.status(404).send({
          error: "NotFound",
          message: "Project not found",
          statusCode: 404,
        });
      }

      const dateFilter: Prisma.AnalyticsWhereInput = { projectId: id };
      if (startDate) dateFilter.date = { gte: new Date(startDate) };
      if (endDate) {
        dateFilter.date = {
          ...(dateFilter.date as Prisma.DateTimeFilter | undefined),
          lte: new Date(endDate),
        };
      }

      // Fetch daily analytics
      const dailyData = await fastify.prisma.analytics.findMany({
        where: dateFilter,
        orderBy: { date: "asc" },
      });

      // Aggregate totals
      const totals = dailyData.reduce(
        (acc, d) => ({
          views: acc.views + d.views,
          uniqueViews: acc.uniqueViews + d.uniqueViews,
          watchTime: acc.watchTime + d.watchTime,
          likes: acc.likes + d.likes,
          shares: acc.shares + d.shares,
          comments: acc.comments + d.comments,
        }),
        { views: 0, uniqueViews: 0, watchTime: 0, likes: 0, shares: 0, comments: 0 },
      );

      const avgCompletion =
        dailyData.length > 0
          ? dailyData.reduce((s, d) => s + d.completionRate, 0) / dailyData.length
          : 0;

      const avgWatchPct =
        dailyData.length > 0
          ? dailyData.reduce((s, d) => s + d.averageWatchPercentage, 0) / dailyData.length
          : 0;

      // Traffic sources (merge across days)
      const trafficSources: Record<string, number> = {};
      const demographics: Record<string, Record<string, number>> = {
        countries: {},
        devices: {},
      };

      for (const d of dailyData) {
        if (d.trafficSources && typeof d.trafficSources === "object") {
          for (const [key, val] of Object.entries(d.trafficSources as Record<string, number>)) {
            trafficSources[key] = (trafficSources[key] ?? 0) + val;
          }
        }
        if (d.viewerDemographics && typeof d.viewerDemographics === "object") {
          const dem = d.viewerDemographics as Record<string, Record<string, number>>;
          for (const [category, vals] of Object.entries(dem)) {
            if (!demographics[category]) demographics[category] = {};
            for (const [key, count] of Object.entries(vals)) {
              demographics[category][key] = (demographics[category][key] ?? 0) + count;
            }
          }
        }
      }

      // Group by granularity
      const chartData = groupByGranularity(dailyData, granularity);

      return reply.send({
        data: {
          project: { id: project.id, title: project.title },
          totals: {
            ...totals,
            completionRate: avgCompletion,
            averageWatchPercentage: avgWatchPct,
            engagementRate: totals.views > 0 ? totals.likes / totals.views : 0,
          },
          chartData,
          trafficSources,
          demographics,
        },
      });
    },
  });

  // ────────────────────────────────────────────────────────────────────────
  // GET /user — aggregate analytics across all user's projects
  // ────────────────────────────────────────────────────────────────────────

  fastify.get("/user", {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const query = dateRangeSchema.safeParse(request.query);
      if (!query.success) return zodError(reply, query.error);

      const userId = request.user.id;
      const { startDate, endDate } = query.data;

      const dateFilter: Prisma.AnalyticsWhereInput = { userId };
      if (startDate) dateFilter.date = { gte: new Date(startDate) };
      if (endDate) {
        dateFilter.date = {
          ...(dateFilter.date as Prisma.DateTimeFilter | undefined),
          lte: new Date(endDate),
        };
      }

      // Aggregate stats across all projects
      const agg = await fastify.prisma.analytics.aggregate({
        where: dateFilter,
        _sum: {
          views: true,
          uniqueViews: true,
          watchTime: true,
          likes: true,
          shares: true,
          comments: true,
        },
      });

      // Top performing projects
      const topProjects = await fastify.prisma.analytics.groupBy({
        by: ["projectId"],
        where: { userId },
        _sum: { views: true, watchTime: true, likes: true },
        orderBy: { _sum: { views: "desc" } },
        take: 10,
      });

      // Fetch project details for top projects
      const projectIds = topProjects.map((p) => p.projectId);
      const projects = await fastify.prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, title: true, thumbnailUrl: true, genre: true, status: true },
      });

      const projectMap = new Map(projects.map((p) => [p.id, p]));

      const topProjectsWithDetails = topProjects.map((tp) => ({
        ...projectMap.get(tp.projectId),
        views: tp._sum.views ?? 0,
        watchTime: tp._sum.watchTime ?? 0,
        likes: tp._sum.likes ?? 0,
      }));

      // Daily chart data for the user
      const dailyData = await fastify.prisma.analytics.findMany({
        where: dateFilter,
        orderBy: { date: "asc" },
      });

      const chartData = groupByGranularity(dailyData, "day");

      return reply.send({
        data: {
          totals: {
            views: agg._sum.views ?? 0,
            uniqueViews: agg._sum.uniqueViews ?? 0,
            watchTime: agg._sum.watchTime ?? 0,
            likes: agg._sum.likes ?? 0,
            shares: agg._sum.shares ?? 0,
            comments: agg._sum.comments ?? 0,
          },
          topProjects: topProjectsWithDetails,
          chartData,
        },
      });
    },
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface AnalyticsRow {
  date: Date;
  views: number;
  uniqueViews: number;
  watchTime: number;
  likes: number;
  shares: number;
  comments: number;
  completionRate: number;
}

function groupByGranularity(
  data: AnalyticsRow[],
  granularity: "day" | "week" | "month",
) {
  const grouped = new Map<string, {
    date: string;
    views: number;
    uniqueViews: number;
    watchTime: number;
    likes: number;
    shares: number;
    comments: number;
    completionRate: number;
    count: number;
  }>();

  for (const row of data) {
    const key = getGroupKey(row.date, granularity);
    const existing = grouped.get(key);
    if (existing) {
      existing.views += row.views;
      existing.uniqueViews += row.uniqueViews;
      existing.watchTime += row.watchTime;
      existing.likes += row.likes;
      existing.shares += row.shares;
      existing.comments += row.comments;
      existing.completionRate += row.completionRate;
      existing.count += 1;
    } else {
      grouped.set(key, {
        date: key,
        views: row.views,
        uniqueViews: row.uniqueViews,
        watchTime: row.watchTime,
        likes: row.likes,
        shares: row.shares,
        comments: row.comments,
        completionRate: row.completionRate,
        count: 1,
      });
    }
  }

  return Array.from(grouped.values()).map((g) => ({
    ...g,
    completionRate: g.count > 0 ? g.completionRate / g.count : 0,
    count: undefined,
  }));
}

function getGroupKey(date: Date, granularity: "day" | "week" | "month"): string {
  const d = new Date(date);
  if (granularity === "day") {
    return d.toISOString().slice(0, 10);
  }
  if (granularity === "week") {
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d.toISOString().slice(0, 10);
  }
  // month
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
