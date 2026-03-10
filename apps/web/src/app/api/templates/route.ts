// ─────────────────────────────────────────────────────────────────────────────
// Templates API Route — List & Create templates
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, TemplateCategory, Genre } from "@genesis/database";
import { authOptions } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

/* ── GET — list templates ────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const category = searchParams.get("category") as TemplateCategory | null;
    const genre = searchParams.get("genre") as Genre | null;
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") ?? "popular";

    const where: Prisma.TemplateWhereInput = { isPublic: true };
    if (category && Object.values(TemplateCategory).includes(category)) where.category = category;
    if (genre && Object.values(Genre).includes(genre)) where.genre = genre;
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
      prisma.template.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          createdBy: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      }),
      prisma.template.count({ where }),
    ]);

    return NextResponse.json({
      data: templates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

/* ── POST — create custom template ──────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, category, description, promptTemplate, genre, stylePreset, characterTemplates, sceneTemplates, settingsTemplate, isPublic, tags } = body as Record<string, unknown>;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!category || !Object.values(TemplateCategory).includes(category as TemplateCategory)) {
      return NextResponse.json({ error: "Valid category is required" }, { status: 400 });
    }

    const template = await prisma.template.create({
      data: {
        name: name as string,
        category: category as TemplateCategory,
        description: (description as string) ?? null,
        promptTemplate: (promptTemplate as string) ?? null,
        genre: genre && Object.values(Genre).includes(genre as Genre) ? (genre as Genre) : null,
        stylePreset: (stylePreset as string) ?? null,
        characterTemplates: characterTemplates as Prisma.InputJsonValue ?? undefined,
        sceneTemplates: sceneTemplates as Prisma.InputJsonValue ?? undefined,
        settingsTemplate: settingsTemplate as Prisma.InputJsonValue ?? undefined,
        isPublic: typeof isPublic === "boolean" ? isPublic : true,
        tags: Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string") : [],
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ data: template }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
