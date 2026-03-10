// ─────────────────────────────────────────────────────────────────────────────
// Dashboard data — server-side data fetching with safe Prisma fallback
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@genesis/database";
import type { Project } from "@genesis/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface DashboardStats {
  totalProjects: number;
  totalWatchTime: string;
  creditsRemaining: number;
  moviesPublished: number;
}

export interface RecentProject {
  id: string;
  title: string;
  description: string | null;
  status: string;
  genre: string;
  thumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  scenesCount: number;
  totalDuration: number;
  renderProgress: number | null;
}

export interface ActivityItem {
  id: string;
  type: "render_complete" | "project_created" | "project_updated" | "render_failed";
  title: string;
  description: string;
  timestamp: Date;
  projectTitle?: string;
}

export interface DashboardData {
  userName: string;
  stats: DashboardStats;
  recentProjects: RecentProject[];
  activity: ActivityItem[];
}

/* ── Template gallery ─────────────────────────────────────────────────────── */

export const storyTemplates = [
  {
    id: "cyberpunk-chase",
    title: "Cyberpunk Chase",
    description: "A high-octane pursuit through neon-lit streets",
    genre: "SCI_FI",
    thumbnail: null,
    scenes: 6,
  },
  {
    id: "ocean-documentary",
    title: "Deep Blue",
    description: "Underwater exploration of hidden ocean worlds",
    genre: "DOCUMENTARY",
    thumbnail: null,
    scenes: 8,
  },
  {
    id: "fantasy-quest",
    title: "The Last Kingdom",
    description: "An epic journey across mythical landscapes",
    genre: "FANTASY",
    thumbnail: null,
    scenes: 10,
  },
  {
    id: "noir-mystery",
    title: "Midnight Shadows",
    description: "A detective unravels secrets in rain-soaked alleys",
    genre: "THRILLER",
    thumbnail: null,
    scenes: 7,
  },
];

/* ── Mock Data (used when DB is unavailable) ──────────────────────────────── */

function getMockData(name: string): DashboardData {
  const now = new Date();
  return {
    userName: name,
    stats: {
      totalProjects: 12,
      totalWatchTime: "4h 32m",
      creditsRemaining: 1250,
      moviesPublished: 3,
    },
    recentProjects: [
      {
        id: "mock-1",
        title: "Neon Dreams",
        description: "A cyberpunk adventure through neo-Tokyo",
        status: "RENDERING",
        genre: "SCI_FI",
        thumbnailUrl: null,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
        scenesCount: 8,
        totalDuration: 180,
        renderProgress: 67,
      },
      {
        id: "mock-2",
        title: "Ocean Depths",
        description: "Journey into the Mariana Trench",
        status: "COMPLETED",
        genre: "DOCUMENTARY",
        thumbnailUrl: null,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        scenesCount: 12,
        totalDuration: 420,
        renderProgress: null,
      },
      {
        id: "mock-3",
        title: "City Pulse",
        description: "Urban life through an AI lens",
        status: "DRAFT",
        genre: "EXPERIMENTAL",
        thumbnailUrl: null,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        scenesCount: 3,
        totalDuration: 0,
        renderProgress: null,
      },
      {
        id: "mock-4",
        title: "Desert Mirage",
        description: "Surreal visions across endless dunes",
        status: "IN_PRODUCTION",
        genre: "FANTASY",
        thumbnailUrl: null,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        scenesCount: 6,
        totalDuration: 90,
        renderProgress: null,
      },
      {
        id: "mock-5",
        title: "Starlight Sonata",
        description: "A musical journey through the cosmos",
        status: "COMPLETED",
        genre: "ANIMATION",
        thumbnailUrl: null,
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        scenesCount: 9,
        totalDuration: 300,
        renderProgress: null,
      },
      {
        id: "mock-6",
        title: "The Algorithm",
        description: "When AI becomes self-aware",
        status: "DRAFT",
        genre: "THRILLER",
        thumbnailUrl: null,
        createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        scenesCount: 0,
        totalDuration: 0,
        renderProgress: null,
      },
    ],
    activity: [
      {
        id: "act-1",
        type: "render_complete",
        title: "Render Complete",
        description: "Scene 4 finished rendering in HD",
        timestamp: new Date(now.getTime() - 15 * 60 * 1000),
        projectTitle: "Neon Dreams",
      },
      {
        id: "act-2",
        type: "project_created",
        title: "New Project",
        description: "You created a new project",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        projectTitle: "City Pulse",
      },
      {
        id: "act-3",
        type: "render_complete",
        title: "Render Complete",
        description: "Final render exported successfully",
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        projectTitle: "Ocean Depths",
      },
      {
        id: "act-4",
        type: "project_updated",
        title: "Project Updated",
        description: "Added 3 new scenes",
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        projectTitle: "Desert Mirage",
      },
      {
        id: "act-5",
        type: "render_failed",
        title: "Render Failed",
        description: "Scene 2 encountered an error — retryable",
        timestamp: new Date(now.getTime() - 36 * 60 * 60 * 1000),
        projectTitle: "Desert Mirage",
      },
    ],
  };
}

/* ── Fast-fail DB check ───────────────────────────────────────────────────── */

async function isDbReachable(timeoutMs = 2000): Promise<boolean> {
  try {
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
    ]);
    return !!result;
  } catch {
    return false;
  }
}

/* ── Fetcher ──────────────────────────────────────────────────────────────── */

export async function getDashboardData(): Promise<DashboardData> {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name ?? "Creator";

  try {
    const userId = session?.user?.id;
    if (!userId) return getMockData(userName);

    // Fast-fail: check DB connectivity with a short timeout
    const dbOk = await isDbReachable();
    if (!dbOk) return getMockData(userName);

    // Attempt parallel queries
    const [user, projects, recentRenders] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { creditsBalance: true, displayName: true },
      }),
      prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 6,
        include: {
          scenes: { select: { id: true, durationSeconds: true } },
          renderJobs: {
            where: { status: { in: ["PROCESSING", "QUEUED"] } },
            select: { progress: true },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.renderJob.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { project: { select: { title: true } } },
      }),
    ]);

    const completedProjects = projects.filter((p: Project) => p.status === "COMPLETED");
    const totalDurationSec = projects.reduce((sum: number, p: typeof projects[number]) => {
      return sum + p.scenes.reduce((s: number, sc: { durationSeconds: number | null }) => s + (sc.durationSeconds ?? 0), 0);
    }, 0);
    const hours = Math.floor(totalDurationSec / 3600);
    const minutes = Math.floor((totalDurationSec % 3600) / 60);

    const recentProjects: RecentProject[] = projects.map((p: typeof projects[number]) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      genre: p.genre,
      thumbnailUrl: p.thumbnailUrl,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      scenesCount: p.scenes.length,
      totalDuration: p.scenes.reduce((s: number, sc: { durationSeconds: number | null }) => s + (sc.durationSeconds ?? 0), 0),
      renderProgress: p.renderJobs[0]?.progress ?? null,
    }));

    const activity: ActivityItem[] = recentRenders.map((r: typeof recentRenders[number]) => ({
      id: r.id,
      type: r.status === "COMPLETED"
        ? ("render_complete" as const)
        : r.status === "FAILED"
          ? ("render_failed" as const)
          : ("project_updated" as const),
      title: r.status === "COMPLETED"
        ? "Render Complete"
        : r.status === "FAILED"
          ? "Render Failed"
          : "Rendering",
      description:
        r.status === "COMPLETED"
          ? `${r.jobType.replace(/_/g, " ").toLowerCase()} finished`
          : r.status === "FAILED"
            ? (r.errorMessage ?? "Unknown error")
            : `${Math.round(r.progress)}% complete`,
      timestamp: r.completedAt ?? r.createdAt,
      projectTitle: r.project.title,
    }));

    return {
      userName: user?.displayName ?? userName,
      stats: {
        totalProjects: projects.length,
        totalWatchTime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
        creditsRemaining: user?.creditsBalance ?? 0,
        moviesPublished: completedProjects.length,
      },
      recentProjects,
      activity,
    };
  } catch {
    // Database unavailable — fall back to mock data
    return getMockData(userName);
  }
}
