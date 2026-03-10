// ─────────────────────────────────────────────────────────────────────────────
// Templates API Route — Use a template to create a project
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@genesis/database";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const customTitle = typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;

    const { id } = await params;
    const template = await prisma.template.findUnique({ where: { id } });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const settings = (template.settingsTemplate as Record<string, unknown>) ?? {};
    const charTemplates = (template.characterTemplates as Array<Record<string, unknown>>) ?? [];

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          userId: session.user.id,
          title: customTitle ?? template.name,
          description: template.description,
          genre: template.genre ?? "OTHER",
          status: "DRAFT",
          stylePreset: template.stylePreset,
          resolution: (settings.resolution as string) ?? "1920x1080",
          fps: (settings.fps as number) ?? 24,
          aspectRatio: (settings.aspectRatio as string) ?? "16:9",
          metadata: {
            fromTemplate: template.id,
            templateName: template.name,
          },
          scripts: template.promptTemplate
            ? {
                create: {
                  version: 1,
                  rawPrompt: template.promptTemplate,
                  tone: template.stylePreset ?? "cinematic",
                },
              }
            : undefined,
          characters: charTemplates.length > 0
            ? {
                create: charTemplates.map((c) => ({
                  name: (c.name as string) ?? "Character",
                  description: (c.description as string) ?? null,
                  appearancePrompt: (c.appearancePrompt as string) ?? null,
                  personalityTraits: (c.personalityTraits as string[]) ?? [],
                })),
              }
            : undefined,
        },
        include: { scripts: true, characters: true },
      });

      await tx.template.update({
        where: { id: template.id },
        data: { usageCount: { increment: 1 } },
      });

      return created;
    });

    return NextResponse.json({ data: project }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create project from template" }, { status: 500 });
  }
}
