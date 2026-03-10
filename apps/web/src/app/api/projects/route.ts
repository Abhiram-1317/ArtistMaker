// ─────────────────────────────────────────────────────────────────────────────
// Projects API Route — Create a new project from wizard data
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, Genre } from "@genesis/database";
import { authOptions } from "@/lib/auth";

/* ── Genre mapping (wizard value → Prisma enum) ──────────────────────────── */

const GENRE_PRISMA_MAP: Record<string, Genre> = {
  ACTION: Genre.ACTION,
  COMEDY: Genre.COMEDY,
  DRAMA: Genre.DRAMA,
  HORROR: Genre.HORROR,
  SCI_FI: Genre.SCI_FI,
  FANTASY: Genre.FANTASY,
  THRILLER: Genre.THRILLER,
  ROMANCE: Genre.ROMANCE,
  ANIMATION: Genre.ANIMATION,
  DOCUMENTARY: Genre.DOCUMENTARY,
  EXPERIMENTAL: Genre.EXPERIMENTAL,
  OTHER: Genre.OTHER,
};

/* ── Resolution mapping ──────────────────────────────────────────────────── */

function mapResolution(res: string): string {
  switch (res) {
    case "720p":
      return "1280x720";
    case "1080p":
      return "1920x1080";
    case "4K":
      return "3840x2160";
    default:
      return "1920x1080";
  }
}

/* ── FPS mapping ─────────────────────────────────────────────────────────── */

function mapFps(fps: string): number {
  switch (fps) {
    case "24fps":
      return 24;
    case "30fps":
      return 30;
    case "60fps":
      return 60;
    default:
      return 24;
  }
}

/* ── Cost estimator (mirrors client-side) ────────────────────────────────── */

function estimateCost(settings: {
  duration: number;
  resolution: string;
  frameRate: string;
  bgMusic: boolean;
  soundEffects: boolean;
}): number {
  const resMultiplier = settings.resolution === "4K" ? 5 : settings.resolution === "1080p" ? 2 : 1;
  const fpsMultiplier = settings.frameRate === "60fps" ? 1.5 : settings.frameRate === "30fps" ? 1.1 : 1;
  const audioMultiplier = (settings.bgMusic ? 1.15 : 1) * (settings.soundEffects ? 1.1 : 1);
  const baseCredits = Math.ceil(settings.duration / 15);
  return Math.ceil(baseCredits * resMultiplier * fpsMultiplier * audioMultiplier);
}

/* ── POST handler ────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, genre, style, characters, settings } = body as {
      prompt?: string;
      genre?: string;
      style?: string;
      characters?: Array<{
        id: string;
        name: string;
        description: string;
        age: string;
        build: string;
        features: string;
        traits: string[];
        voice: string;
      }>;
      settings?: {
        title: string;
        duration: number;
        aspectRatio: string;
        resolution: string;
        frameRate: string;
        cameraIntensity: number;
        colorGrading: string;
        bgMusic: boolean;
        soundEffects: boolean;
      };
    };

    // ── Validation ──────────────────────────────────────────────
    if (!prompt || prompt.length < 20) {
      return NextResponse.json(
        { error: "A story concept of at least 20 characters is required." },
        { status: 400 },
      );
    }

    if (!genre || !GENRE_PRISMA_MAP[genre]) {
      return NextResponse.json(
        { error: "A valid genre is required." },
        { status: 400 },
      );
    }

    if (!settings || !settings.title || settings.title.trim().length < 2) {
      return NextResponse.json(
        { error: "A project title with at least 2 characters is required." },
        { status: 400 },
      );
    }

    // ── Cost check ──────────────────────────────────────────────
    const creditsCost = estimateCost(settings);

    // In a real app we'd check user.creditsBalance here.
    // For the demo scaffold we skip actual credit deduction.

    // ── Resolve user ID ─────────────────────────────────────────
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    // ── Demo mode: return a mock project without touching the DB ──
    const isDemoMode = process.env.DEMO_MODE === "true";
    if (isDemoMode) {
      return NextResponse.json(
        {
          message: "Project created successfully",
          project: {
            id: `proj-${Date.now()}`,
            title: settings.title.trim(),
            status: "PRE_PRODUCTION",
            totalCostCredits: creditsCost,
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 },
      );
    }

    // Fallback for dev/demo: pick the first user in the database
    if (!userId) {
      const fallbackUser = await prisma.user.findFirst({
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });
      if (!fallbackUser) {
        return NextResponse.json(
          { error: "No users found. Please sign in or run the database seed first." },
          { status: 401 },
        );
      }
      userId = fallbackUser.id;
    }

    // ── Create project with related records in a transaction ────
    const project = await prisma.project.create({
      data: {
        userId,
        title: settings.title.trim(),
        description: prompt,
        genre: GENRE_PRISMA_MAP[genre]!,
        status: "PRE_PRODUCTION",
        stylePreset: style || null,
        resolution: mapResolution(settings.resolution),
        fps: mapFps(settings.frameRate),
        aspectRatio: settings.aspectRatio,
        totalCostCredits: creditsCost,
        metadata: {
          cameraIntensity: settings.cameraIntensity,
          colorGrading: settings.colorGrading,
          bgMusic: settings.bgMusic,
          soundEffects: settings.soundEffects,
          duration: settings.duration,
        },

        // Create script from the raw prompt
        scripts: {
          create: {
            rawPrompt: prompt,
            tone: settings.colorGrading, // approximate
          },
        },

        // Create characters
        characters: {
          create: (characters ?? []).map((c) => ({
            name: c.name,
            description: c.description || null,
            ageRange: c.age || null,
            personalityTraits: c.traits ?? [],
            voiceProfile: c.voice ? { style: c.voice } : undefined,
            appearancePrompt: [c.build, c.features].filter(Boolean).join(". ") || null,
          })),
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        totalCostCredits: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: "Project created successfully", project },
      { status: 201 },
    );
  } catch (error) {
    console.error("[PROJECT_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create project. Please try again." },
      { status: 500 },
    );
  }
}
