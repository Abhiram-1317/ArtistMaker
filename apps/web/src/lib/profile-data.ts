// ─────────────────────────────────────────────────────────────────────────────
// Profile data — server-side data fetching for profile pages
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@genesis/database";
import type { ExploreMovie } from "./explore-data";

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface ProfileUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  subscriptionTier: string;
  creditsBalance: number;
  createdAt: string;
  projectCount: number;
  totalViews: number;
  totalLikes: number;
  subscriberCount: number;
}

export interface ProfileData {
  user: ProfileUser;
  movies: ExploreMovie[];
  isOwnProfile: boolean;
}

/* ── Mock data ────────────────────────────────────────────────────────────── */

const MOCK_USERS: Record<string, ProfileUser> = {
  "creator-1": {
    id: "creator-1", email: "creator1@genesis.ai", username: "creator1",
    displayName: "Creator 1", avatarUrl: null,
    bio: "AI filmmaker and visual storyteller. Creating cyberpunk worlds and noir narratives through generative cinema.",
    subscriptionTier: "PRO", creditsBalance: 4250, createdAt: new Date(Date.now() - 90 * 86400_000).toISOString(),
    projectCount: 3, totalViews: 17920, totalLikes: 2510, subscriberCount: 1540,
  },
  "creator-2": {
    id: "creator-2", email: "creator2@genesis.ai", username: "creator2",
    displayName: "Creator 2", avatarUrl: null,
    bio: "Fantasy and romance filmmaker. Exploring mythical realms and emotional narratives with AI.",
    subscriptionTier: "STARTER", creditsBalance: 1200, createdAt: new Date(Date.now() - 60 * 86400_000).toISOString(),
    projectCount: 2, totalViews: 9400, totalLikes: 1300, subscriberCount: 820,
  },
  "creator-3": {
    id: "creator-3", email: "creator3@genesis.ai", username: "creator3",
    displayName: "Creator 3", avatarUrl: null,
    bio: "Action and experimental cinema. Pushing the boundaries of AI-generated storytelling.",
    subscriptionTier: "FREE", creditsBalance: 300, createdAt: new Date(Date.now() - 45 * 86400_000).toISOString(),
    projectCount: 2, totalViews: 5800, totalLikes: 800, subscriberCount: 410,
  },
  "creator-4": {
    id: "creator-4", email: "creator4@genesis.ai", username: "creator4",
    displayName: "Creator 4", avatarUrl: null,
    bio: "Sci-fi visionary. Creating stories about consciousness, identity, and the cosmos.",
    subscriptionTier: "PRO", creditsBalance: 3800, createdAt: new Date(Date.now() - 120 * 86400_000).toISOString(),
    projectCount: 3, totalViews: 24100, totalLikes: 3740, subscriberCount: 2100,
  },
  "creator-5": {
    id: "creator-5", email: "creator5@genesis.ai", username: "creator5",
    displayName: "Creator 5", avatarUrl: null,
    bio: "Thriller and comedy director. Keeping audiences on the edge of their seats.",
    subscriptionTier: "STARTER", creditsBalance: 900, createdAt: new Date(Date.now() - 30 * 86400_000).toISOString(),
    projectCount: 2, totalViews: 10400, totalLikes: 1410, subscriberCount: 650,
  },
  "creator-6": {
    id: "creator-6", email: "creator6@genesis.ai", username: "creator6",
    displayName: "Creator 6", avatarUrl: null,
    bio: "Animation and fantasy artist. Crafting procedural dreamscapes with AI.",
    subscriptionTier: "PRO", creditsBalance: 5100, createdAt: new Date(Date.now() - 75 * 86400_000).toISOString(),
    projectCount: 2, totalViews: 14200, totalLikes: 2260, subscriberCount: 1350,
  },
};

function getMockMoviesForCreator(creatorId: string): ExploreMovie[] {
  const now = Date.now();
  const allMovies: ExploreMovie[] = [
    { id: "m-1", title: "Neon Horizon", description: "A cyberpunk odyssey through the year 2099", genre: "SCI_FI", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(now - 86400_000).toISOString(), creator: { id: "creator-1", username: "creator1", displayName: "Creator 1", avatarUrl: null }, scenesCount: 8, totalDuration: 240, views: 8420, likes: 1230 },
    { id: "m-7", title: "Ocean Echoes", description: "Deep sea mystery documentary", genre: "DOCUMENTARY", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(now - 7 * 86400_000).toISOString(), creator: { id: "creator-1", username: "creator1", displayName: "Creator 1", avatarUrl: null }, scenesCount: 11, totalDuration: 330, views: 2900, likes: 340 },
    { id: "m-13", title: "Code Red", description: "Hacking into the impossible", genre: "THRILLER", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(now - 13 * 86400_000).toISOString(), creator: { id: "creator-1", username: "creator1", displayName: "Creator 1", avatarUrl: null }, scenesCount: 7, totalDuration: 210, views: 6600, likes: 940 },
    { id: "m-2", title: "Enchanted Realms", description: "An epic fantasy across mythical lands", genre: "FANTASY", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(now - 2 * 86400_000).toISOString(), creator: { id: "creator-2", username: "creator2", displayName: "Creator 2", avatarUrl: null }, scenesCount: 12, totalDuration: 360, views: 6200, likes: 890 },
    { id: "m-8", title: "Crimson Tide", description: "Romance blooms on the edge of war", genre: "ROMANCE", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(now - 8 * 86400_000).toISOString(), creator: { id: "creator-2", username: "creator2", displayName: "Creator 2", avatarUrl: null }, scenesCount: 5, totalDuration: 150, views: 3200, likes: 410 },
    { id: "m-3", title: "Street Kings", description: "Underground battles for city supremacy", genre: "ACTION", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(now - 3 * 86400_000).toISOString(), creator: { id: "creator-3", username: "creator3", displayName: "Creator 3", avatarUrl: null }, scenesCount: 6, totalDuration: 180, views: 4100, likes: 520 },
    { id: "m-9", title: "Fractal Mind", description: "An experimental journey into consciousness", genre: "EXPERIMENTAL", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(now - 9 * 86400_000).toISOString(), creator: { id: "creator-3", username: "creator3", displayName: "Creator 3", avatarUrl: null }, scenesCount: 4, totalDuration: 120, views: 1700, likes: 280 },
    { id: "m-4", title: "Whispers in the Dark", description: "When silence itself becomes deadly", genre: "HORROR", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(now - 4 * 86400_000).toISOString(), creator: { id: "creator-4", username: "creator4", displayName: "Creator 4", avatarUrl: null }, scenesCount: 7, totalDuration: 210, views: 3800, likes: 470 },
    { id: "m-10", title: "Galactic Drift", description: "Lost among the stars", genre: "SCI_FI", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(now - 10 * 86400_000).toISOString(), creator: { id: "creator-4", username: "creator4", displayName: "Creator 4", avatarUrl: null }, scenesCount: 14, totalDuration: 420, views: 7300, likes: 1100 },
    { id: "m-16", title: "Synthetic Souls", description: "Androids learning how to feel", genre: "SCI_FI", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(now - 16 * 86400_000).toISOString(), creator: { id: "creator-4", username: "creator4", displayName: "Creator 4", avatarUrl: null }, scenesCount: 10, totalDuration: 300, views: 8900, likes: 1320 },
    { id: "m-5", title: "Last Light", description: "A thriller set in a world without power", genre: "THRILLER", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(now - 5 * 86400_000).toISOString(), creator: { id: "creator-5", username: "creator5", displayName: "Creator 5", avatarUrl: null }, scenesCount: 9, totalDuration: 270, views: 5600, likes: 780 },
    { id: "m-11", title: "Shadow Play", description: "Comedic noir like you've never seen", genre: "COMEDY", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(now - 11 * 86400_000).toISOString(), creator: { id: "creator-5", username: "creator5", displayName: "Creator 5", avatarUrl: null }, scenesCount: 6, totalDuration: 180, views: 4800, likes: 630 },
    { id: "m-6", title: "Pixel Dreams", description: "When AI imagines its own animated worlds", genre: "ANIMATION", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(now - 6 * 86400_000).toISOString(), creator: { id: "creator-6", username: "creator6", displayName: "Creator 6", avatarUrl: null }, scenesCount: 10, totalDuration: 300, views: 9100, likes: 1540 },
    { id: "m-12", title: "The Fallen Crown", description: "A kingdom's last stand", genre: "FANTASY", thumbnailUrl: null, finalVideoUrl: null, createdAt: new Date(now - 12 * 86400_000).toISOString(), creator: { id: "creator-6", username: "creator6", displayName: "Creator 6", avatarUrl: null }, scenesCount: 8, totalDuration: 240, views: 5100, likes: 720 },
  ];
  return allMovies.filter((m) => m.creator.id === creatorId);
}

/* ── Fetchers ─────────────────────────────────────────────────────────────── */

export async function getProfileByUsername(username: string): Promise<ProfileData | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        projects: {
          where: { status: "COMPLETED" },
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            scenes: { select: { id: true, durationSeconds: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) return getMockProfileByUsername(username);

    const movies: ExploreMovie[] = user.projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      genre: p.genre,
      thumbnailUrl: p.thumbnailUrl,
      finalVideoUrl: p.finalVideoUrl,
      createdAt: p.createdAt.toISOString(),
      creator: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl },
      scenesCount: p.scenes.length,
      totalDuration: p.scenes.reduce((s, sc) => s + (sc.durationSeconds ?? 0), 0),
      views: Math.floor(Math.random() * 10_000) + 100,
      likes: Math.floor(Math.random() * 2_000) + 20,
    }));

    const totalViews = movies.reduce((s, m) => s + m.views, 0);
    const totalLikes = movies.reduce((s, m) => s + m.likes, 0);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: null,
        subscriptionTier: user.subscriptionTier,
        creditsBalance: user.creditsBalance,
        createdAt: user.createdAt.toISOString(),
        projectCount: movies.length,
        totalViews,
        totalLikes,
        subscriberCount: 0,
      },
      movies,
      isOwnProfile: false,
    };
  } catch {
    return getMockProfileByUsername(username);
  }
}

function getMockProfileByUsername(username: string): ProfileData | null {
  const entry = Object.values(MOCK_USERS).find((u) => u.username === username);
  if (!entry) return null;

  return {
    user: entry,
    movies: getMockMoviesForCreator(entry.id),
    isOwnProfile: false,
  };
}

export async function getOwnProfile(): Promise<ProfileData> {
  // In production: get current user from session
  // const session = await getServerSession(authOptions);
  // const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  const user = MOCK_USERS["creator-1"]!;
  return {
    user,
    movies: getMockMoviesForCreator(user.id),
    isOwnProfile: true,
  };
}
