// ─────────────────────────────────────────────────────────────────────────────
// Watch data — server-side data fetching for the movie player page
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@genesis/database";
import type { ExploreMovie } from "./explore-data";

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface WatchComment {
  id: string;
  text: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  replies: WatchComment[];
}

export interface WatchMovie {
  id: string;
  title: string;
  description: string | null;
  genre: string;
  thumbnailUrl: string | null;
  finalVideoUrl: string | null;
  createdAt: string;
  resolution: string;
  tags: string[];
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    subscriberCount: number;
  };
  scenesCount: number;
  totalDuration: number;
  views: number;
  likes: number;
  liked: boolean;
}

export interface WatchData {
  movie: WatchMovie;
  comments: WatchComment[];
  moreFromCreator: ExploreMovie[];
  similarMovies: ExploreMovie[];
}

/* ── Genre labels ─────────────────────────────────────────────────────────── */

const GENRE_LABELS: Record<string, string> = {
  SCI_FI: "Sci-Fi",
  FANTASY: "Fantasy",
  ACTION: "Action",
  DRAMA: "Drama",
  COMEDY: "Comedy",
  HORROR: "Horror",
  THRILLER: "Thriller",
  DOCUMENTARY: "Documentary",
  ANIMATION: "Animation",
  ROMANCE: "Romance",
  EXPERIMENTAL: "Experimental",
  OTHER: "Other",
};

export function getGenreLabel(genre: string): string {
  return GENRE_LABELS[genre] ?? genre;
}

/* ── Mock helpers ─────────────────────────────────────────────────────────── */

function mockCreator(idx: number) {
  return {
    id: `creator-${idx}`,
    username: `creator${idx}`,
    displayName: `Creator ${idx}`,
    avatarUrl: null,
    subscriberCount: 1200 + idx * 340,
  };
}

function mockComment(
  id: string,
  user: { id: string; username: string; displayName: string; avatarUrl: string | null },
  text: string,
  ago: number,
  replies: WatchComment[] = [],
): WatchComment {
  return {
    id,
    text,
    createdAt: new Date(Date.now() - ago).toISOString(),
    likes: Math.floor(Math.random() * 50),
    liked: false,
    user,
    replies,
  };
}

const MOCK_MOVIES: Record<string, WatchMovie> = {
  "m-1": {
    id: "m-1", title: "Neon Horizon",
    description: "A cyberpunk odyssey through the year 2099. Follow Kira, a rogue data courier, as she navigates the neon-soaked streets of Neo-Tokyo, uncovering a conspiracy that threatens the very fabric of digital consciousness. Featuring stunning AI-generated visuals that push the boundaries of cinematic storytelling.\n\nThis film explores themes of identity, technology, and what it means to be human in an age where the line between organic and synthetic life has all but disappeared.",
    genre: "SCI_FI", thumbnailUrl: null, finalVideoUrl: "/sample-video.mp4",
    createdAt: new Date(Date.now() - 1 * 86400_000).toISOString(),
    resolution: "4K", tags: ["cyberpunk", "sci-fi", "noir", "ai-generated", "dystopian"],
    creator: mockCreator(1), scenesCount: 8, totalDuration: 240, views: 8420, likes: 1230, liked: false,
  },
  "m-6": {
    id: "m-6", title: "Pixel Dreams",
    description: "When AI imagines its own animated worlds, the result is a kaleidoscope of impossible geometries and living color. Pixel Dreams takes you on a meditative journey through procedurally generated landscapes that evolve in real-time.",
    genre: "ANIMATION", thumbnailUrl: null, finalVideoUrl: "/sample-video.mp4",
    createdAt: new Date(Date.now() - 6 * 86400_000).toISOString(),
    resolution: "1080p", tags: ["animation", "procedural", "meditative", "abstract"],
    creator: mockCreator(6), scenesCount: 10, totalDuration: 300, views: 9100, likes: 1540, liked: false,
  },
  "m-10": {
    id: "m-10", title: "Galactic Drift",
    description: "Lost among the stars, a lone explorer discovers ancient alien artifacts that reveal the true history of the universe. A sweeping space opera told entirely through AI-generated cinematography.",
    genre: "SCI_FI", thumbnailUrl: null, finalVideoUrl: "/sample-video.mp4",
    createdAt: new Date(Date.now() - 10 * 86400_000).toISOString(),
    resolution: "4K", tags: ["space", "sci-fi", "exploration", "aliens"],
    creator: mockCreator(4), scenesCount: 14, totalDuration: 420, views: 7300, likes: 1100, liked: false,
  },
  "m-16": {
    id: "m-16", title: "Synthetic Souls",
    description: "Androids learning how to feel. In a post-human world, the last generation of AI beings grapple with emotions they were never designed to experience.",
    genre: "SCI_FI", thumbnailUrl: null, finalVideoUrl: "/sample-video.mp4",
    createdAt: new Date(Date.now() - 16 * 86400_000).toISOString(),
    resolution: "1080p", tags: ["android", "sci-fi", "emotional", "philosophical"],
    creator: mockCreator(4), scenesCount: 10, totalDuration: 300, views: 8900, likes: 1320, liked: false,
  },
};

function getMockRelated(genre: string, excludeId: string): ExploreMovie[] {
  const all: ExploreMovie[] = [
    { id: "m-1", title: "Neon Horizon", description: "A cyberpunk odyssey through the year 2099", genre: "SCI_FI", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(Date.now() - 86400_000).toISOString(), creator: { id: "creator-1", username: "creator1", displayName: "Creator 1", avatarUrl: null }, scenesCount: 8, totalDuration: 240, views: 8420, likes: 1230 },
    { id: "m-2", title: "Enchanted Realms", description: "An epic fantasy across mythical lands", genre: "FANTASY", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(Date.now() - 2 * 86400_000).toISOString(), creator: { id: "creator-2", username: "creator2", displayName: "Creator 2", avatarUrl: null }, scenesCount: 12, totalDuration: 360, views: 6200, likes: 890 },
    { id: "m-3", title: "Street Kings", description: "Underground battles for city supremacy", genre: "ACTION", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(Date.now() - 3 * 86400_000).toISOString(), creator: { id: "creator-3", username: "creator3", displayName: "Creator 3", avatarUrl: null }, scenesCount: 6, totalDuration: 180, views: 4100, likes: 520 },
    { id: "m-5", title: "Last Light", description: "A thriller set in a world without power", genre: "THRILLER", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(Date.now() - 5 * 86400_000).toISOString(), creator: { id: "creator-5", username: "creator5", displayName: "Creator 5", avatarUrl: null }, scenesCount: 9, totalDuration: 270, views: 5600, likes: 780 },
    { id: "m-6", title: "Pixel Dreams", description: "When AI imagines its own animated worlds", genre: "ANIMATION", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(Date.now() - 6 * 86400_000).toISOString(), creator: { id: "creator-6", username: "creator6", displayName: "Creator 6", avatarUrl: null }, scenesCount: 10, totalDuration: 300, views: 9100, likes: 1540 },
    { id: "m-10", title: "Galactic Drift", description: "Lost among the stars", genre: "SCI_FI", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(Date.now() - 10 * 86400_000).toISOString(), creator: { id: "creator-4", username: "creator4", displayName: "Creator 4", avatarUrl: null }, scenesCount: 14, totalDuration: 420, views: 7300, likes: 1100 },
    { id: "m-13", title: "Code Red", description: "Hacking into the impossible", genre: "THRILLER", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(Date.now() - 13 * 86400_000).toISOString(), creator: { id: "creator-1", username: "creator1", displayName: "Creator 1", avatarUrl: null }, scenesCount: 7, totalDuration: 210, views: 6600, likes: 940 },
    { id: "m-16", title: "Synthetic Souls", description: "Androids learning how to feel", genre: "SCI_FI", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(Date.now() - 16 * 86400_000).toISOString(), creator: { id: "creator-4", username: "creator4", displayName: "Creator 4", avatarUrl: null }, scenesCount: 10, totalDuration: 300, views: 8900, likes: 1320 },
  ];
  return all.filter((m) => m.id !== excludeId && m.genre === genre).slice(0, 6);
}

function getMockMoreFromCreator(creatorId: string, excludeId: string): ExploreMovie[] {
  const all: ExploreMovie[] = [
    { id: "m-1", title: "Neon Horizon", description: "A cyberpunk odyssey", genre: "SCI_FI", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(Date.now() - 86400_000).toISOString(), creator: { id: "creator-1", username: "creator1", displayName: "Creator 1", avatarUrl: null }, scenesCount: 8, totalDuration: 240, views: 8420, likes: 1230 },
    { id: "m-7", title: "Ocean Echoes", description: "Deep sea mystery documentary", genre: "DOCUMENTARY", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(Date.now() - 7 * 86400_000).toISOString(), creator: { id: "creator-1", username: "creator1", displayName: "Creator 1", avatarUrl: null }, scenesCount: 11, totalDuration: 330, views: 2900, likes: 340 },
    { id: "m-13", title: "Code Red", description: "Hacking into the impossible", genre: "THRILLER", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(Date.now() - 13 * 86400_000).toISOString(), creator: { id: "creator-1", username: "creator1", displayName: "Creator 1", avatarUrl: null }, scenesCount: 7, totalDuration: 210, views: 6600, likes: 940 },
  ];
  return all.filter((m) => m.id !== excludeId && m.creator.id === creatorId).slice(0, 4);
}

function getMockComments(): WatchComment[] {
  const u1 = { id: "u-1", username: "filmfan42", displayName: "FilmFan42", avatarUrl: null };
  const u2 = { id: "u-2", username: "ai_cinephile", displayName: "AI Cinephile", avatarUrl: null };
  const u3 = { id: "u-3", username: "directorX", displayName: "DirectorX", avatarUrl: null };
  const u4 = { id: "u-4", username: "neonlover", displayName: "NeonLover", avatarUrl: null };

  return [
    mockComment("c-1", u1, "The lighting in this is absolutely stunning. The AI really captured that cyberpunk aesthetic perfectly.", 3600_000, [
      mockComment("c-1-r1", u3, "Thanks! I spent a lot of time tweaking the style prompts to get that neon glow just right.", 1800_000),
      mockComment("c-1-r2", u4, "Could you share what prompts you used? I'd love to try something similar.", 900_000),
    ]),
    mockComment("c-2", u2, "This is what I love about AI cinema — visuals that would cost millions with traditional VFX, created by a single artist.", 7200_000),
    mockComment("c-3", u3, "The pacing in the second act could use some tightening, but overall a fantastic piece. The character designs are next level.", 14400_000, [
      mockComment("c-3-r1", u1, "Agreed on the pacing. But the final sequence more than makes up for it.", 10800_000),
    ]),
    mockComment("c-4", u4, "I've watched this three times now. The attention to detail in the background environments is incredible.", 28800_000),
  ];
}

/* ── Fetchers ─────────────────────────────────────────────────────────────── */

export async function getWatchData(movieId: string): Promise<WatchData | null> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: movieId },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        scenes: { select: { id: true, durationSeconds: true }, orderBy: { sceneNumber: "asc" } },
      },
    });

    if (!project) return getMockWatchData(movieId);

    const movie: WatchMovie = {
      id: project.id,
      title: project.title,
      description: project.description,
      genre: project.genre,
      thumbnailUrl: project.thumbnailUrl,
      finalVideoUrl: project.finalVideoUrl,
      createdAt: project.createdAt.toISOString(),
      resolution: "1080p",
      tags: [project.genre.toLowerCase().replace("_", "-")],
      creator: {
        ...project.user,
        subscriberCount: 1200,
      },
      scenesCount: project.scenes.length,
      totalDuration: project.scenes.reduce((s, sc) => s + (sc.durationSeconds ?? 0), 0),
      views: Math.floor(Math.random() * 10_000) + 100,
      likes: Math.floor(Math.random() * 2_000) + 20,
      liked: false,
    };

    return {
      movie,
      comments: getMockComments(),
      moreFromCreator: getMockMoreFromCreator(movie.creator.id, movie.id),
      similarMovies: getMockRelated(movie.genre, movie.id),
    };
  } catch {
    return getMockWatchData(movieId);
  }
}

function getMockWatchData(movieId: string): WatchData | null {
  const movie = MOCK_MOVIES[movieId];
  if (!movie) {
    // Fallback: generate a default movie for any ID
    const fallback: WatchMovie = {
      id: movieId,
      title: "Neon Horizon",
      description: "A cyberpunk odyssey through the year 2099. Follow Kira, a rogue data courier, as she navigates the neon-soaked streets of Neo-Tokyo.",
      genre: "SCI_FI",
      thumbnailUrl: null,
      finalVideoUrl: "/sample-video.mp4",
      createdAt: new Date(Date.now() - 86400_000).toISOString(),
      resolution: "4K",
      tags: ["cyberpunk", "sci-fi", "noir", "ai-generated"],
      creator: mockCreator(1),
      scenesCount: 8,
      totalDuration: 240,
      views: 8420,
      likes: 1230,
      liked: false,
    };
    return {
      movie: fallback,
      comments: getMockComments(),
      moreFromCreator: getMockMoreFromCreator("creator-1", movieId),
      similarMovies: getMockRelated("SCI_FI", movieId),
    };
  }

  return {
    movie,
    comments: getMockComments(),
    moreFromCreator: getMockMoreFromCreator(movie.creator.id, movie.id),
    similarMovies: getMockRelated(movie.genre, movie.id),
  };
}
