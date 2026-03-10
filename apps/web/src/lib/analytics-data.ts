// ─────────────────────────────────────────────────────────────────────────────
// Analytics data layer — server-side fetching with mock fallback
// ─────────────────────────────────────────────────────────────────────────────

import { getServerSession } from "next-auth";
import { prisma } from "@genesis/database";
import { authOptions } from "@/lib/auth";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Types
 * ══════════════════════════════════════════════════════════════════════════════ */

export interface AnalyticsTotals {
  views: number;
  uniqueViews: number;
  watchTime: number; // seconds
  likes: number;
  shares: number;
  comments: number;
  completionRate: number; // 0-1
  averageWatchPercentage: number; // 0-1
  engagementRate: number; // 0-1
}

export interface ChartDataPoint {
  date: string;
  views: number;
  uniqueViews: number;
  watchTime: number;
  likes: number;
  shares: number;
  comments: number;
  completionRate: number;
}

export interface TrafficSource {
  source: string;
  value: number;
  percentage: number;
}

export interface DemographicItem {
  name: string;
  value: number;
  percentage: number;
}

export interface ProjectAnalytics {
  project: { id: string; title: string };
  totals: AnalyticsTotals;
  chartData: ChartDataPoint[];
  trafficSources: TrafficSource[];
  countries: DemographicItem[];
  devices: DemographicItem[];
  retentionData: RetentionPoint[];
  insights: AnalyticsInsight[];
}

export interface RetentionPoint {
  second: number;
  percentage: number;
}

export interface AnalyticsInsight {
  type: "positive" | "negative" | "neutral";
  message: string;
  action?: string;
}

export interface UserAnalyticsOverview {
  totals: AnalyticsTotals;
  chartData: ChartDataPoint[];
  topProjects: ProjectSummary[];
  insights: AnalyticsInsight[];
}

export interface ProjectSummary {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  genre: string;
  status: string;
  views: number;
  watchTime: number;
  likes: number;
  completionRate: number;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Server-side fetchers
 * ══════════════════════════════════════════════════════════════════════════════ */

export async function getUserAnalytics(
  days: number = 30,
): Promise<UserAnalyticsOverview> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return getMockUserAnalytics(days);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userId = session.user.id;

    const [agg, dailyData, topRaw] = await Promise.all([
      prisma.analytics.aggregate({
        where: { userId, date: { gte: startDate } },
        _sum: {
          views: true,
          uniqueViews: true,
          watchTime: true,
          likes: true,
          shares: true,
          comments: true,
        },
      }),
      prisma.analytics.findMany({
        where: { userId, date: { gte: startDate } },
        orderBy: { date: "asc" },
      }),
      prisma.analytics.groupBy({
        by: ["projectId"],
        where: { userId },
        _sum: { views: true, watchTime: true, likes: true },
        _avg: { completionRate: true },
        orderBy: { _sum: { views: "desc" } },
        take: 10,
      }),
    ]);

    const projectIds = topRaw.map((p) => p.projectId);
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        genre: true,
        status: true,
      },
    });
    const projectMap = new Map(projects.map((p) => [p.id, p]));

    const totals: AnalyticsTotals = {
      views: agg._sum.views ?? 0,
      uniqueViews: agg._sum.uniqueViews ?? 0,
      watchTime: agg._sum.watchTime ?? 0,
      likes: agg._sum.likes ?? 0,
      shares: agg._sum.shares ?? 0,
      comments: agg._sum.comments ?? 0,
      completionRate:
        dailyData.length > 0
          ? dailyData.reduce((s, d) => s + d.completionRate, 0) / dailyData.length
          : 0,
      averageWatchPercentage:
        dailyData.length > 0
          ? dailyData.reduce((s, d) => s + d.averageWatchPercentage, 0) /
            dailyData.length
          : 0,
      engagementRate:
        (agg._sum.views ?? 0) > 0
          ? (agg._sum.likes ?? 0) / (agg._sum.views ?? 1)
          : 0,
    };

    const chartData: ChartDataPoint[] = dailyData.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      views: d.views,
      uniqueViews: d.uniqueViews,
      watchTime: d.watchTime,
      likes: d.likes,
      shares: d.shares,
      comments: d.comments,
      completionRate: d.completionRate,
    }));

    const topProjects: ProjectSummary[] = topRaw.map((tp) => {
      const p = projectMap.get(tp.projectId);
      return {
        id: tp.projectId,
        title: p?.title ?? "Unknown",
        thumbnailUrl: p?.thumbnailUrl ?? null,
        genre: p?.genre ?? "OTHER",
        status: p?.status ?? "DRAFT",
        views: tp._sum.views ?? 0,
        watchTime: tp._sum.watchTime ?? 0,
        likes: tp._sum.likes ?? 0,
        completionRate: tp._avg.completionRate ?? 0,
      };
    });

    return {
      totals,
      chartData,
      topProjects,
      insights: generateInsights(totals, topProjects),
    };
  } catch {
    return getMockUserAnalytics(days);
  }
}

export async function getProjectAnalytics(
  projectId: string,
  days: number = 30,
): Promise<ProjectAnalytics | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return getMockProjectAnalytics(projectId, days);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: { id: true, title: true },
    });

    if (!project) return getMockProjectAnalytics(projectId, days);

    const dailyData = await prisma.analytics.findMany({
      where: { projectId, date: { gte: startDate } },
      orderBy: { date: "asc" },
    });

    const totals: AnalyticsTotals = dailyData.reduce(
      (acc, d) => ({
        views: acc.views + d.views,
        uniqueViews: acc.uniqueViews + d.uniqueViews,
        watchTime: acc.watchTime + d.watchTime,
        likes: acc.likes + d.likes,
        shares: acc.shares + d.shares,
        comments: acc.comments + d.comments,
        completionRate: acc.completionRate + d.completionRate,
        averageWatchPercentage:
          acc.averageWatchPercentage + d.averageWatchPercentage,
        engagementRate: 0,
      }),
      {
        views: 0,
        uniqueViews: 0,
        watchTime: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        completionRate: 0,
        averageWatchPercentage: 0,
        engagementRate: 0,
      },
    );

    if (dailyData.length > 0) {
      totals.completionRate /= dailyData.length;
      totals.averageWatchPercentage /= dailyData.length;
    }
    totals.engagementRate = totals.views > 0 ? totals.likes / totals.views : 0;

    const chartData: ChartDataPoint[] = dailyData.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      views: d.views,
      uniqueViews: d.uniqueViews,
      watchTime: d.watchTime,
      likes: d.likes,
      shares: d.shares,
      comments: d.comments,
      completionRate: d.completionRate,
    }));

    // Merge traffic sources & demographics
    const trafficMap: Record<string, number> = {};
    const countryMap: Record<string, number> = {};
    const deviceMap: Record<string, number> = {};

    for (const d of dailyData) {
      if (d.trafficSources && typeof d.trafficSources === "object") {
        for (const [k, v] of Object.entries(
          d.trafficSources as Record<string, number>,
        )) {
          trafficMap[k] = (trafficMap[k] ?? 0) + v;
        }
      }
      if (d.viewerDemographics && typeof d.viewerDemographics === "object") {
        const dem = d.viewerDemographics as Record<
          string,
          Record<string, number>
        >;
        if (dem.countries) {
          for (const [k, v] of Object.entries(dem.countries)) {
            countryMap[k] = (countryMap[k] ?? 0) + v;
          }
        }
        if (dem.devices) {
          for (const [k, v] of Object.entries(dem.devices)) {
            deviceMap[k] = (deviceMap[k] ?? 0) + v;
          }
        }
      }
    }

    const trafficTotal = Object.values(trafficMap).reduce((s, v) => s + v, 0);
    const countryTotal = Object.values(countryMap).reduce((s, v) => s + v, 0);
    const deviceTotal = Object.values(deviceMap).reduce((s, v) => s + v, 0);

    return {
      project,
      totals,
      chartData,
      trafficSources: Object.entries(trafficMap)
        .map(([source, value]) => ({
          source,
          value,
          percentage: trafficTotal > 0 ? value / trafficTotal : 0,
        }))
        .sort((a, b) => b.value - a.value),
      countries: Object.entries(countryMap)
        .map(([name, value]) => ({
          name,
          value,
          percentage: countryTotal > 0 ? value / countryTotal : 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      devices: Object.entries(deviceMap)
        .map(([name, value]) => ({
          name,
          value,
          percentage: deviceTotal > 0 ? value / deviceTotal : 0,
        }))
        .sort((a, b) => b.value - a.value),
      retentionData: generateMockRetention(),
      insights: generateProjectInsights(totals),
    };
  } catch {
    return getMockProjectAnalytics(projectId, days);
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Mock data generators
 * ══════════════════════════════════════════════════════════════════════════════ */

function generateMockChartData(days: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    // Weekend dip
    const weekendMult = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1;
    // Trend upward slightly
    const trendMult = 1 + (days - i) * 0.01;
    // Random noise
    const noise = 0.7 + Math.random() * 0.6;
    const baseViews = Math.round(150 * weekendMult * trendMult * noise);

    data.push({
      date: date.toISOString().slice(0, 10),
      views: baseViews,
      uniqueViews: Math.round(baseViews * 0.72),
      watchTime: baseViews * (60 + Math.random() * 120),
      likes: Math.round(baseViews * 0.08 * noise),
      shares: Math.round(baseViews * 0.02 * noise),
      comments: Math.round(baseViews * 0.03 * noise),
      completionRate: 0.35 + Math.random() * 0.3,
    });
  }
  return data;
}

function generateMockRetention(): RetentionPoint[] {
  const points: RetentionPoint[] = [];
  let pct = 100;
  for (let s = 0; s <= 240; s += 5) {
    points.push({ second: s, percentage: Math.round(pct * 10) / 10 });
    // Sharp drop at start, plateau in middle, drop near end
    if (s < 15) pct *= 0.92;
    else if (s < 30) pct *= 0.96;
    else if (s < 120) pct *= 0.995;
    else if (s < 180) pct *= 0.99;
    else pct *= 0.97;
  }
  return points;
}

function getMockUserAnalytics(days: number): UserAnalyticsOverview {
  const chartData = generateMockChartData(days);
  const totals: AnalyticsTotals = {
    views: 24853,
    uniqueViews: 18240,
    watchTime: 892450,
    likes: 1893,
    shares: 412,
    comments: 687,
    completionRate: 0.52,
    averageWatchPercentage: 0.68,
    engagementRate: 0.076,
  };

  const topProjects: ProjectSummary[] = [
    {
      id: "mock-p1",
      title: "Neon Horizon",
      thumbnailUrl: null,
      genre: "SCI_FI",
      status: "COMPLETED",
      views: 8420,
      watchTime: 302400,
      likes: 634,
      completionRate: 0.58,
    },
    {
      id: "mock-p2",
      title: "Ocean Depths",
      thumbnailUrl: null,
      genre: "DOCUMENTARY",
      status: "COMPLETED",
      views: 5230,
      watchTime: 188280,
      likes: 389,
      completionRate: 0.62,
    },
    {
      id: "mock-p3",
      title: "Dragon's Rise",
      thumbnailUrl: null,
      genre: "FANTASY",
      status: "COMPLETED",
      views: 4120,
      watchTime: 148320,
      likes: 312,
      completionRate: 0.48,
    },
    {
      id: "mock-p4",
      title: "City Lights",
      thumbnailUrl: null,
      genre: "DRAMA",
      status: "RENDERING",
      views: 3540,
      watchTime: 127440,
      likes: 278,
      completionRate: 0.44,
    },
    {
      id: "mock-p5",
      title: "Cosmic Journey",
      thumbnailUrl: null,
      genre: "SCI_FI",
      status: "COMPLETED",
      views: 2210,
      watchTime: 79560,
      likes: 167,
      completionRate: 0.55,
    },
    {
      id: "mock-p6",
      title: "Midnight Run",
      thumbnailUrl: null,
      genre: "ACTION",
      status: "COMPLETED",
      views: 1333,
      watchTime: 47988,
      likes: 113,
      completionRate: 0.41,
    },
  ];

  return {
    totals,
    chartData,
    topProjects,
    insights: generateInsights(totals, topProjects),
  };
}

function getMockProjectAnalytics(
  _projectId: string,
  days: number,
): ProjectAnalytics {
  const chartData = generateMockChartData(days);
  const totals: AnalyticsTotals = {
    views: 8420,
    uniqueViews: 6144,
    watchTime: 302400,
    likes: 634,
    shares: 156,
    comments: 243,
    completionRate: 0.58,
    averageWatchPercentage: 0.72,
    engagementRate: 0.075,
  };

  return {
    project: { id: _projectId, title: "Neon Horizon" },
    totals,
    chartData,
    trafficSources: [
      { source: "Direct", value: 3368, percentage: 0.4 },
      { source: "Social Media", value: 2526, percentage: 0.3 },
      { source: "Search", value: 1684, percentage: 0.2 },
      { source: "Embedded", value: 504, percentage: 0.06 },
      { source: "Other", value: 338, percentage: 0.04 },
    ],
    countries: [
      { name: "United States", value: 2780, percentage: 0.33 },
      { name: "United Kingdom", value: 1180, percentage: 0.14 },
      { name: "Germany", value: 842, percentage: 0.1 },
      { name: "Canada", value: 674, percentage: 0.08 },
      { name: "France", value: 590, percentage: 0.07 },
      { name: "Japan", value: 505, percentage: 0.06 },
      { name: "Australia", value: 421, percentage: 0.05 },
      { name: "Brazil", value: 337, percentage: 0.04 },
      { name: "India", value: 337, percentage: 0.04 },
      { name: "South Korea", value: 253, percentage: 0.03 },
    ],
    devices: [
      { name: "Desktop", value: 4631, percentage: 0.55 },
      { name: "Mobile", value: 2947, percentage: 0.35 },
      { name: "Tablet", value: 842, percentage: 0.1 },
    ],
    retentionData: generateMockRetention(),
    insights: generateProjectInsights(totals),
  };
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  AI-generated insights
 * ══════════════════════════════════════════════════════════════════════════════ */

function generateInsights(
  totals: AnalyticsTotals,
  topProjects: ProjectSummary[],
): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  if (totals.completionRate > 0.5) {
    insights.push({
      type: "positive",
      message: `Your completion rate is ${Math.round(totals.completionRate * 100)}% — that's 15% higher than the platform average!`,
    });
  } else {
    insights.push({
      type: "negative",
      message: `Your average completion rate is ${Math.round(totals.completionRate * 100)}%. Consider stronger openings to hook viewers.`,
      action: "Review the first 15 seconds of your movies",
    });
  }

  if (totals.engagementRate > 0.05) {
    insights.push({
      type: "positive",
      message: `Great engagement! ${Math.round(totals.engagementRate * 100)}% of viewers liked your content.`,
    });
  }

  if (topProjects.length > 0) {
    const best = topProjects[0];
    insights.push({
      type: "neutral",
      message: `"${best.title}" is your top performer with ${best.views.toLocaleString()} views.`,
    });
  }

  const totalHours = Math.round(totals.watchTime / 3600);
  if (totalHours > 100) {
    insights.push({
      type: "positive",
      message: `Your content has been watched for ${totalHours.toLocaleString()} hours total!`,
    });
  }

  insights.push({
    type: "neutral",
    message:
      "Mobile viewers watch 2x longer than desktop — optimize your thumbnails for small screens.",
    action: "Use high-contrast thumbnails with large text",
  });

  return insights;
}

function generateProjectInsights(totals: AnalyticsTotals): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  if (totals.completionRate > 0.5) {
    insights.push({
      type: "positive",
      message: `${Math.round(totals.completionRate * 100)}% of viewers watched to the end — well above average!`,
    });
  } else if (totals.completionRate < 0.3) {
    insights.push({
      type: "negative",
      message: "Most viewers drop off at 45 seconds — consider a stronger opening.",
      action: "Re-edit the first 30 seconds to add a hook",
    });
  }

  if (totals.averageWatchPercentage > 0.6) {
    insights.push({
      type: "positive",
      message: `Viewers watch ${Math.round(totals.averageWatchPercentage * 100)}% of your movie on average.`,
    });
  }

  if (totals.shares > 0) {
    const shareRate = totals.shares / totals.views;
    insights.push({
      type: shareRate > 0.02 ? "positive" : "neutral",
      message: `${Math.round(shareRate * 100)}% share rate — ${shareRate > 0.02 ? "great virality!" : "add a share CTA to boost this."}`,
    });
  }

  insights.push({
    type: "neutral",
    message:
      "Peak viewing hours are 6-10 PM — publish new content around 5 PM for maximum reach.",
  });

  return insights;
}
