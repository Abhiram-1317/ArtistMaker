// ─────────────────────────────────────────────────────────────────────────────
// Analytics API — Project-specific analytics
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@genesis/database";
import { authOptions } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const project = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, title: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const dateFilter: Prisma.AnalyticsWhereInput = { projectId: id };
    if (startDate) dateFilter.date = { gte: new Date(startDate) };
    if (endDate) {
      dateFilter.date = {
        ...(dateFilter.date as Prisma.DateTimeFilter | undefined),
        lte: new Date(endDate),
      };
    }

    const dailyData = await prisma.analytics.findMany({
      where: dateFilter,
      orderBy: { date: "asc" },
    });

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

    return NextResponse.json({
      data: {
        project,
        totals,
        chartData: dailyData.map((d) => ({
          date: d.date.toISOString().slice(0, 10),
          views: d.views,
          uniqueViews: d.uniqueViews,
          watchTime: d.watchTime,
          likes: d.likes,
          shares: d.shares,
          comments: d.comments,
          completionRate: d.completionRate,
        })),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
