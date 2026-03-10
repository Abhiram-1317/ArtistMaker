// ─────────────────────────────────────────────────────────────────────────────
// Explore data — server-side data fetching for the movie discovery page
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@genesis/database";

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface ExploreMovie {
  id: string;
  title: string;
  description: string | null;
  genre: string;
  thumbnailUrl: string | null;
  finalVideoUrl: string | null;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  scenesCount: number;
  totalDuration: number;
  views: number;
  likes: number;
}

export interface ExploreData {
  featured: ExploreMovie[];
  trending: ExploreMovie[];
  genres: Record<string, ExploreMovie[]>;
}

export type SortMode = "trending" | "most_viewed" | "recent" | "all";

const GENRE_LIST = [
  "SCI_FI",
  "FANTASY",
  "ACTION",
  "DRAMA",
  "COMEDY",
  "HORROR",
  "THRILLER",
  "DOCUMENTARY",
  "ANIMATION",
  "ROMANCE",
  "EXPERIMENTAL",
] as const;

export { GENRE_LIST };

/* ── Helpers ──────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProject(p: any): ExploreMovie {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    genre: p.genre,
    thumbnailUrl: p.thumbnailUrl,
    finalVideoUrl: p.finalVideoUrl,
    createdAt: p.createdAt.toISOString(),
    creator: {
      id: p.user.id,
      username: p.user.username,
      displayName: p.user.displayName,
      avatarUrl: p.user.avatarUrl,
    },
    scenesCount: p.scenes?.length ?? 0,
    totalDuration: p.scenes?.reduce(
      (s: number, sc: { durationSeconds: number | null }) =>
        s + (sc.durationSeconds ?? 0),
      0,
    ) ?? 0,
    // Simulated engagement stats (would be real columns in production)
    views: Math.floor(Math.random() * 10_000) + 100,
    likes: Math.floor(Math.random() * 2_000) + 20,
  };
}

const projectInclude = {
  user: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
  scenes: { select: { id: true, durationSeconds: true } },
} as const;

/* ── Mock data (database unavailable fallback) ────────────────────────────── */

function mockCreator(idx: number) {
  return {
    id: `creator-${idx}`,
    username: `creator${idx}`,
    displayName: `Creator ${idx}`,
    avatarUrl: null,
  };
}

function getMockMovies(): ExploreMovie[] {
  const now = Date.now();
  return [
    {
      id: "m-1", title: "Neon Horizon", description: "A cyberpunk odyssey through the year 2099",
      genre: "SCI_FI", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 1 * 86400_000).toISOString(),
      creator: mockCreator(1), scenesCount: 8, totalDuration: 240, views: 8420, likes: 1230,
    },
    {
      id: "m-2", title: "Enchanted Realms", description: "An epic fantasy across mythical lands",
      genre: "FANTASY", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 2 * 86400_000).toISOString(),
      creator: mockCreator(2), scenesCount: 12, totalDuration: 360, views: 6200, likes: 890,
    },
    {
      id: "m-3", title: "Street Kings", description: "Underground battles for city supremacy",
      genre: "ACTION", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 3 * 86400_000).toISOString(),
      creator: mockCreator(3), scenesCount: 6, totalDuration: 180, views: 4100, likes: 520,
    },
    {
      id: "m-4", title: "Whispers in the Dark", description: "When silence itself becomes deadly",
      genre: "HORROR", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 4 * 86400_000).toISOString(),
      creator: mockCreator(4), scenesCount: 7, totalDuration: 210, views: 3800, likes: 470,
    },
    {
      id: "m-5", title: "Last Light", description: "A thriller set in a world without power",
      genre: "THRILLER", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 5 * 86400_000).toISOString(),
      creator: mockCreator(5), scenesCount: 9, totalDuration: 270, views: 5600, likes: 780,
    },
    {
      id: "m-6", title: "Pixel Dreams", description: "When AI imagines its own animated worlds",
      genre: "ANIMATION", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 6 * 86400_000).toISOString(),
      creator: mockCreator(6), scenesCount: 10, totalDuration: 300, views: 9100, likes: 1540,
    },
    {
      id: "m-7", title: "Ocean Echoes", description: "Deep sea mystery documentary",
      genre: "DOCUMENTARY", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 7 * 86400_000).toISOString(),
      creator: mockCreator(1), scenesCount: 11, totalDuration: 330, views: 2900, likes: 340,
    },
    {
      id: "m-8", title: "Crimson Tide", description: "Romance blooms on the edge of war",
      genre: "ROMANCE", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 8 * 86400_000).toISOString(),
      creator: mockCreator(2), scenesCount: 5, totalDuration: 150, views: 3200, likes: 410,
    },
    {
      id: "m-9", title: "Fractal Mind", description: "An experimental journey into consciousness",
      genre: "EXPERIMENTAL", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 9 * 86400_000).toISOString(),
      creator: mockCreator(3), scenesCount: 4, totalDuration: 120, views: 1700, likes: 280,
    },
    {
      id: "m-10", title: "Galactic Drift", description: "Lost among the stars",
      genre: "SCI_FI", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 10 * 86400_000).toISOString(),
      creator: mockCreator(4), scenesCount: 14, totalDuration: 420, views: 7300, likes: 1100,
    },
    {
      id: "m-11", title: "Shadow Play", description: "Comedic noir like you've never seen",
      genre: "COMEDY", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 11 * 86400_000).toISOString(),
      creator: mockCreator(5), scenesCount: 6, totalDuration: 180, views: 4800, likes: 630,
    },
    {
      id: "m-12", title: "The Fallen Crown", description: "A kingdom's last stand",
      genre: "FANTASY", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 12 * 86400_000).toISOString(),
      creator: mockCreator(6), scenesCount: 8, totalDuration: 240, views: 5100, likes: 720,
    },
    {
      id: "m-13", title: "Code Red", description: "Hacking into the impossible",
      genre: "THRILLER", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 13 * 86400_000).toISOString(),
      creator: mockCreator(1), scenesCount: 7, totalDuration: 210, views: 6600, likes: 940,
    },
    {
      id: "m-14", title: "Dragon's Breath", description: "Fire and fury in a magic world",
      genre: "ACTION", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 14 * 86400_000).toISOString(),
      creator: mockCreator(2), scenesCount: 9, totalDuration: 270, views: 3500, likes: 460,
    },
    {
      id: "m-15", title: "Midnight Bloom", description: "A garden that only exists at night",
      genre: "DRAMA", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 15 * 86400_000).toISOString(),
      creator: mockCreator(3), scenesCount: 5, totalDuration: 150, views: 2100, likes: 310,
    },
    {
      id: "m-16", title: "Synthetic Souls", description: "Androids learning how to feel",
      genre: "SCI_FI", thumbnailUrl: null, finalVideoUrl: null,
      createdAt: new Date(now - 16 * 86400_000).toISOString(),
      creator: mockCreator(4), scenesCount: 10, totalDuration: 300, views: 8900, likes: 1320,
    },
  ];
}

/* ── Fetchers ─────────────────────────────────────────────────────────────── */

export async function getExploreData(): Promise<ExploreData> {
  try {
    const projects = await prisma.project.findMany({
      where: { status: "COMPLETED" },
      orderBy: { updatedAt: "desc" },
      take: 60,
      include: projectInclude,
    });

    const movies = projects.map(mapProject);
    return buildExploreData(movies);
  } catch {
    // DB unavailable — use mock data
    const movies = getMockMovies();
    return buildExploreData(movies);
  }
}

export async function getExploreMovies(
  cursor: number,
  limit: number,
  genre?: string,
  sort?: SortMode,
  search?: string,
): Promise<{ movies: ExploreMovie[]; hasMore: boolean }> {
  try {
    const where: Record<string, unknown> = { status: "COMPLETED" };
    if (genre && genre !== "all") where.genre = genre;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy = sort === "recent"
      ? { createdAt: "desc" as const }
      : { updatedAt: "desc" as const };

    const projects = await prisma.project.findMany({
      where,
      orderBy,
      skip: cursor,
      take: limit + 1,
      include: projectInclude,
    });

    const hasMore = projects.length > limit;
    const movies = projects.slice(0, limit).map(mapProject);

    if (sort === "most_viewed") movies.sort((a, b) => b.views - a.views);
    if (sort === "trending") movies.sort((a, b) => b.likes - a.likes);

    return { movies, hasMore };
  } catch {
    const all = getMockMovies();
    let filtered = genre && genre !== "all"
      ? all.filter((m) => m.genre === genre)
      : all;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.description ?? "").toLowerCase().includes(q),
      );
    }

    if (sort === "most_viewed") filtered.sort((a, b) => b.views - a.views);
    if (sort === "trending") filtered.sort((a, b) => b.likes - a.likes);
    if (sort === "recent") filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const sliced = filtered.slice(cursor, cursor + limit);
    return { movies: sliced, hasMore: cursor + limit < filtered.length };
  }
}

/* ── Build explore sections from flat movie list ──────────────────────────── */

function buildExploreData(movies: ExploreMovie[]): ExploreData {
  const sorted = [...movies].sort((a, b) => b.views - a.views);
  const featured = sorted.slice(0, 6);
  const trending = [...movies].sort((a, b) => b.likes - a.likes).slice(0, 10);

  const genres: Record<string, ExploreMovie[]> = {};
  for (const g of GENRE_LIST) {
    const genreMovies = movies.filter((m) => m.genre === g);
    if (genreMovies.length > 0) genres[g] = genreMovies;
  }

  return { featured, trending, genres };
}
