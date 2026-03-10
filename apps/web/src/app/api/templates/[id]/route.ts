// ─────────────────────────────────────────────────────────────────────────────
// Templates API Route — Single template operations
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@genesis/database";

/* ── GET — get single template ──────────────────────────────────────────── */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ data: template });
  } catch {
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}
