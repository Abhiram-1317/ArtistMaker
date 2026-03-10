// ─────────────────────────────────────────────────────────────────────────────
// Analytics API — Track events
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@genesis/database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, projectId, data } = body as {
      eventType: string;
      projectId: string;
      data: {
        sessionId: string;
        currentTime?: number;
        duration?: number;
        deviceType?: string;
        referrer?: string;
        country?: string;
      };
    };

    if (!eventType || !projectId || !data?.sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (eventType === "play" || eventType === "progress") {
      const existing = await prisma.viewEvent.findFirst({
        where: { projectId, sessionId: data.sessionId },
      });

      if (existing) {
        await prisma.viewEvent.update({
          where: { id: existing.id },
          data: {
            watchedSeconds: data.currentTime ?? existing.watchedSeconds,
            totalDuration: data.duration ?? existing.totalDuration,
          },
        });
      } else {
        await prisma.viewEvent.create({
          data: {
            projectId,
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
      const existing = await prisma.viewEvent.findFirst({
        where: { projectId, sessionId: data.sessionId },
      });
      if (existing) {
        await prisma.viewEvent.update({
          where: { id: existing.id },
          data: {
            completedAt: new Date(),
            watchedSeconds: data.duration ?? existing.watchedSeconds,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Don't fail the client on tracking errors
  }
}
