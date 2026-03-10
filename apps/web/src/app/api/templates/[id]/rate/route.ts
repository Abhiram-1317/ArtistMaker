// ─────────────────────────────────────────────────────────────────────────────
// Templates API Route — Rate a template
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@genesis/database";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const rating = Number(body.rating);

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const template = await prisma.template.findUnique({
      where: { id },
      select: { id: true, rating: true, usageCount: true },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const count = Math.max(template.usageCount, 1);
    const newRating = template.rating + (rating - template.rating) / count;

    const updated = await prisma.template.update({
      where: { id },
      data: { rating: Math.round(newRating * 100) / 100 },
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Failed to rate template" }, { status: 500 });
  }
}
