// ─────────────────────────────────────────────────────────────────────────────
// Templates data — server-side fetching with mock fallback
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@genesis/database";

/* ── Fast-fail DB check ───────────────────────────────────────────────────── */

async function isDbReachable(timeoutMs = 2000): Promise<boolean> {
  try {
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
    ]);
    return !!result;
  } catch {
    return false;
  }
}

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface TemplateData {
  id: string;
  name: string;
  category: string;
  description: string | null;
  previewUrl: string | null;
  promptTemplate: string | null;
  genre: string | null;
  stylePreset: string | null;
  characterTemplates: unknown;
  sceneTemplates: unknown;
  settingsTemplate: unknown;
  isPublic: boolean;
  isPremium: boolean;
  usageCount: number;
  rating: number;
  tags: string[];
  createdBy?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
}

export type TemplateCategory =
  | "STORY_STARTER"
  | "CHARACTER_ARCHETYPE"
  | "SCENE_COMPOSITION"
  | "FULL_MOVIE"
  | "STYLE_PRESET"
  | "CAMERA_MOVEMENT";

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string; icon: string; description: string }[] = [
  { value: "STORY_STARTER", label: "Story Starters", icon: "📖", description: "Complete story premises with characters and scenes" },
  { value: "CHARACTER_ARCHETYPE", label: "Character Archetypes", icon: "🎭", description: "Pre-built character templates for any genre" },
  { value: "SCENE_COMPOSITION", label: "Scene Compositions", icon: "🎬", description: "Ready-made scene setups with camera work" },
  { value: "FULL_MOVIE", label: "Full Movies", icon: "🎥", description: "Complete movie templates with everything included" },
  { value: "STYLE_PRESET", label: "Style Presets", icon: "🎨", description: "Visual styles and color grading presets" },
  { value: "CAMERA_MOVEMENT", label: "Camera Movements", icon: "📹", description: "Professional camera movement sequences" },
];

/* ── Genre → Icon map ─────────────────────────────────────────────────────── */

export const genreIcons: Record<string, string> = {
  SCI_FI: "🚀",
  DOCUMENTARY: "🎥",
  FANTASY: "🏰",
  THRILLER: "🔍",
  ACTION: "💥",
  COMEDY: "😄",
  DRAMA: "🎭",
  HORROR: "👻",
  ANIMATION: "✨",
  ROMANCE: "💕",
  EXPERIMENTAL: "🧪",
  OTHER: "🎬",
};

/* ── Mock Templates ──────────────────────────────────────────────────────── */

const mockTemplates: TemplateData[] = [
  {
    id: "tpl-space-explorer",
    name: "Space Explorer",
    category: "STORY_STARTER",
    description: "An astronaut discovers an ancient alien signal emanating from the edge of the solar system, leading to a journey that challenges everything humanity knows about its place in the universe.",
    previewUrl: null,
    promptTemplate: "A lone astronaut receives a mysterious signal from beyond Neptune. As they venture deeper into uncharted space, they discover remnants of an ancient civilization.",
    genre: "SCI_FI",
    stylePreset: "cinematic-space",
    characterTemplates: [
      { name: "Commander Riley", description: "Veteran astronaut, mid-40s", personalityTraits: ["brave", "analytical"] },
      { name: "ARIA", description: "Ship's AI companion", personalityTraits: ["curious", "logical"] },
    ],
    sceneTemplates: [
      { title: "The Signal", timeOfDay: "NIGHT", mood: "mysterious" },
      { title: "Into the Void", timeOfDay: "MIDDAY", mood: "tense" },
      { title: "First Contact", timeOfDay: "DAWN", mood: "awe" },
    ],
    settingsTemplate: { resolution: "1920x1080", fps: 24, aspectRatio: "2.39:1", duration: 180 },
    isPublic: true,
    isPremium: false,
    usageCount: 1247,
    rating: 4.7,
    tags: ["space", "sci-fi", "exploration", "first-contact"],
  },
  {
    id: "tpl-detective-noir",
    name: "Detective Noir",
    category: "STORY_STARTER",
    description: "A hard-boiled detective takes on a case that leads through rain-soaked streets, smoky jazz clubs, and dangerous alliances.",
    previewUrl: null,
    promptTemplate: "A cynical private detective in a corrupt 1940s city is hired by a mysterious femme fatale to find her missing husband.",
    genre: "THRILLER",
    stylePreset: "noir-classic",
    characterTemplates: [
      { name: "Jack Monroe", description: "World-weary PI", personalityTraits: ["cynical", "sharp wit"] },
      { name: "Vivian Blackwood", description: "Elegant and dangerous", personalityTraits: ["mysterious", "manipulative"] },
    ],
    sceneTemplates: [
      { title: "The Office", timeOfDay: "NIGHT", mood: "melancholic" },
      { title: "The Jazz Club", timeOfDay: "NIGHT", mood: "sultry" },
    ],
    settingsTemplate: { resolution: "1920x1080", fps: 24, aspectRatio: "16:9", duration: 120 },
    isPublic: true,
    isPremium: false,
    usageCount: 983,
    rating: 4.5,
    tags: ["noir", "detective", "mystery"],
  },
  {
    id: "tpl-medieval-quest",
    name: "Medieval Quest",
    category: "STORY_STARTER",
    description: "A reluctant hero embarks on a perilous quest through enchanted forests and ancient ruins to save their kingdom from an awakening darkness.",
    previewUrl: null,
    promptTemplate: "A simple blacksmith discovers they are the last heir to a forgotten bloodline. With an ancient sword and unlikely companions, they must reach the Heart of the Mountain.",
    genre: "FANTASY",
    stylePreset: "epic-fantasy",
    characterTemplates: [
      { name: "Elden", description: "Young blacksmith turned reluctant hero", personalityTraits: ["humble", "brave"] },
      { name: "Sage Mirwyn", description: "Ancient wizard", personalityTraits: ["wise", "cryptic"] },
    ],
    sceneTemplates: [
      { title: "The Forging", timeOfDay: "GOLDEN_HOUR", mood: "dramatic" },
      { title: "The Dark Forest", timeOfDay: "DUSK", mood: "eerie" },
    ],
    settingsTemplate: { resolution: "1920x1080", fps: 24, aspectRatio: "2.39:1", duration: 240 },
    isPublic: true,
    isPremium: false,
    usageCount: 876,
    rating: 4.6,
    tags: ["fantasy", "quest", "medieval"],
  },
  {
    id: "tpl-superhero-origin",
    name: "Superhero Origin",
    category: "STORY_STARTER",
    description: "An ordinary person gains extraordinary abilities and must choose between personal gain or protecting a city that doesn't trust them.",
    previewUrl: null,
    promptTemplate: "After a lab accident involving experimental nanobots, a struggling med student gains the ability to manipulate matter at the molecular level.",
    genre: "ACTION",
    stylePreset: "dynamic-action",
    characterTemplates: [
      { name: "Maya Torres", description: "Brilliant med student turned reluctant hero", personalityTraits: ["intelligent", "compassionate"] },
      { name: "Dr. Victor Crane", description: "Corporate scientist villain", personalityTraits: ["brilliant", "ruthless"] },
    ],
    sceneTemplates: [
      { title: "The Accident", timeOfDay: "NIGHT", mood: "chaotic" },
      { title: "The Showdown", timeOfDay: "DUSK", mood: "intense" },
    ],
    settingsTemplate: { resolution: "1920x1080", fps: 30, aspectRatio: "16:9", duration: 150 },
    isPublic: true,
    isPremium: true,
    usageCount: 654,
    rating: 4.3,
    tags: ["superhero", "action", "origin-story"],
  },
  {
    id: "tpl-romantic-encounter",
    name: "Romantic Encounter",
    category: "STORY_STARTER",
    description: "Two strangers from different worlds meet by chance and discover a connection that transcends their differences.",
    previewUrl: null,
    promptTemplate: "A traveling musician and a local bookshop owner in Lisbon keep crossing paths during a festival week.",
    genre: "ROMANCE",
    stylePreset: "warm-cinematic",
    characterTemplates: [
      { name: "Leo", description: "Wandering musician", personalityTraits: ["charming", "restless"] },
      { name: "Sofia", description: "Bookshop owner", personalityTraits: ["passionate", "grounded"] },
    ],
    sceneTemplates: [
      { title: "The Meeting", timeOfDay: "GOLDEN_HOUR", mood: "warm" },
      { title: "The Bridge", timeOfDay: "DUSK", mood: "bittersweet" },
    ],
    settingsTemplate: { resolution: "1920x1080", fps: 24, aspectRatio: "16:9", duration: 120 },
    isPublic: true,
    isPremium: false,
    usageCount: 1102,
    rating: 4.8,
    tags: ["romance", "travel", "music"],
  },
  {
    id: "tpl-horror-night",
    name: "Horror Night",
    category: "STORY_STARTER",
    description: "A group of friends discover that the abandoned building they're exploring harbors something that feeds on fear.",
    previewUrl: null,
    promptTemplate: "Five college friends break into an abandoned asylum for a thrill. As their phones lose signal, they realize the building's dark history is alive.",
    genre: "HORROR",
    stylePreset: "dark-atmospheric",
    characterTemplates: [
      { name: "Sam", description: "The skeptic leader", personalityTraits: ["skeptical", "stubborn"] },
      { name: "The Warden", description: "A presence that haunts the asylum", personalityTraits: ["patient", "malevolent"] },
    ],
    sceneTemplates: [
      { title: "Breaking In", timeOfDay: "NIGHT", mood: "foreboding" },
      { title: "No Way Out", timeOfDay: "MIDNIGHT", mood: "desperate" },
    ],
    settingsTemplate: { resolution: "1920x1080", fps: 24, aspectRatio: "2.39:1", duration: 180 },
    isPublic: true,
    isPremium: false,
    usageCount: 789,
    rating: 4.4,
    tags: ["horror", "supernatural", "asylum"],
  },
  {
    id: "tpl-coming-of-age",
    name: "Coming of Age",
    category: "STORY_STARTER",
    description: "The summer before college, a teenager faces experiences that transform their understanding of friendship, family, and identity.",
    previewUrl: null,
    promptTemplate: "During their last summer at home, a high school graduate reconnects with an estranged childhood friend and confronts a family secret.",
    genre: "DRAMA",
    stylePreset: "indie-intimate",
    characterTemplates: [
      { name: "Jordan", description: "18, at the crossroads", personalityTraits: ["introspective", "creative"] },
      { name: "Alex", description: "Childhood friend returned", personalityTraits: ["bold", "secretive"] },
    ],
    sceneTemplates: [
      { title: "The Return", timeOfDay: "AFTERNOON", mood: "nostalgic" },
      { title: "The Goodbye", timeOfDay: "DAWN", mood: "bittersweet" },
    ],
    settingsTemplate: { resolution: "1920x1080", fps: 24, aspectRatio: "16:9", duration: 150 },
    isPublic: true,
    isPremium: false,
    usageCount: 934,
    rating: 4.6,
    tags: ["drama", "coming-of-age", "summer"],
  },
  // Character Archetypes
  {
    id: "tpl-hero",
    name: "The Hero",
    category: "CHARACTER_ARCHETYPE",
    description: "A brave protagonist who rises to face challenges with courage and determination. Adaptable to any genre.",
    previewUrl: null,
    promptTemplate: null,
    genre: null,
    stylePreset: null,
    characterTemplates: [{ name: "Hero", description: "The central protagonist who overcomes obstacles", personalityTraits: ["courageous", "selfless", "determined"] }],
    sceneTemplates: null,
    settingsTemplate: null,
    isPublic: true,
    isPremium: false,
    usageCount: 2341,
    rating: 4.5,
    tags: ["character", "hero", "protagonist"],
  },
  {
    id: "tpl-mentor",
    name: "The Mentor",
    category: "CHARACTER_ARCHETYPE",
    description: "A wise guide who helps the hero on their journey, offering knowledge and sometimes sacrifice.",
    previewUrl: null,
    promptTemplate: null,
    genre: null,
    stylePreset: null,
    characterTemplates: [{ name: "Mentor", description: "The wise guide with hidden depths", personalityTraits: ["wise", "patient", "self-sacrificing"] }],
    sceneTemplates: null,
    settingsTemplate: null,
    isPublic: true,
    isPremium: false,
    usageCount: 1876,
    rating: 4.4,
    tags: ["character", "mentor", "guide"],
  },
  {
    id: "tpl-comic-relief",
    name: "The Comic Relief",
    category: "CHARACTER_ARCHETYPE",
    description: "A witty companion who lightens the mood while often hiding deeper emotions beneath humor.",
    previewUrl: null,
    promptTemplate: null,
    genre: null,
    stylePreset: null,
    characterTemplates: [{ name: "Jester", description: "Uses humor as armor", personalityTraits: ["funny", "loyal", "insecure underneath"] }],
    sceneTemplates: null,
    settingsTemplate: null,
    isPublic: true,
    isPremium: false,
    usageCount: 1543,
    rating: 4.3,
    tags: ["character", "comedy", "sidekick"],
  },
  {
    id: "tpl-antagonist",
    name: "The Antagonist",
    category: "CHARACTER_ARCHETYPE",
    description: "A complex villain whose motivations are understandable even if their methods are not.",
    previewUrl: null,
    promptTemplate: null,
    genre: null,
    stylePreset: null,
    characterTemplates: [{ name: "Antagonist", description: "The opposing force with compelling motivation", personalityTraits: ["intelligent", "driven", "ruthless"] }],
    sceneTemplates: null,
    settingsTemplate: null,
    isPublic: true,
    isPremium: true,
    usageCount: 1234,
    rating: 4.6,
    tags: ["character", "villain", "antagonist"],
  },
  {
    id: "tpl-love-interest",
    name: "The Love Interest",
    category: "CHARACTER_ARCHETYPE",
    description: "A compelling romantic counterpart who challenges and complements the protagonist.",
    previewUrl: null,
    promptTemplate: null,
    genre: null,
    stylePreset: null,
    characterTemplates: [{ name: "Love Interest", description: "The romantic counterpart with their own story", personalityTraits: ["independent", "passionate", "challenging"] }],
    sceneTemplates: null,
    settingsTemplate: null,
    isPublic: true,
    isPremium: false,
    usageCount: 1678,
    rating: 4.5,
    tags: ["character", "romance", "love-interest"],
  },
  // Scene Compositions
  {
    id: "tpl-opening-chase",
    name: "Opening Chase",
    category: "SCENE_COMPOSITION",
    description: "A high-energy opening sequence that immediately hooks the audience with kinetic action and urgent pacing.",
    previewUrl: null,
    promptTemplate: null,
    genre: "ACTION",
    stylePreset: null,
    characterTemplates: null,
    sceneTemplates: [{ title: "The Chase Begins", timeOfDay: "NIGHT", mood: "adrenaline", cameraMovements: ["TRACKING", "HANDHELD", "CRANE_UP"] }],
    settingsTemplate: { fps: 30, aspectRatio: "2.39:1" },
    isPublic: true,
    isPremium: false,
    usageCount: 567,
    rating: 4.3,
    tags: ["scene", "action", "chase"],
  },
  {
    id: "tpl-emotional-goodbye",
    name: "Emotional Goodbye",
    category: "SCENE_COMPOSITION",
    description: "A tender farewell scene with lingering close-ups and deliberate pacing for maximum emotional impact.",
    previewUrl: null,
    promptTemplate: null,
    genre: "DRAMA",
    stylePreset: null,
    characterTemplates: null,
    sceneTemplates: [{ title: "The Farewell", timeOfDay: "GOLDEN_HOUR", mood: "bittersweet", cameraMovements: ["DOLLY_OUT", "STATIC"] }],
    settingsTemplate: { fps: 24, aspectRatio: "16:9" },
    isPublic: true,
    isPremium: false,
    usageCount: 445,
    rating: 4.7,
    tags: ["scene", "drama", "emotional"],
  },
  {
    id: "tpl-epic-battle",
    name: "Epic Battle",
    category: "SCENE_COMPOSITION",
    description: "A grand-scale conflict scene with sweeping camera work and dynamic composition for maximum spectacle.",
    previewUrl: null,
    promptTemplate: null,
    genre: "ACTION",
    stylePreset: null,
    characterTemplates: null,
    sceneTemplates: [{ title: "The Battle", timeOfDay: "DUSK", weather: "STORMY", mood: "epic", cameraMovements: ["CRANE_UP", "ORBIT", "TRACKING"] }],
    settingsTemplate: { fps: 24, aspectRatio: "2.39:1" },
    isPublic: true,
    isPremium: true,
    usageCount: 389,
    rating: 4.5,
    tags: ["scene", "action", "battle"],
  },
  {
    id: "tpl-plot-twist",
    name: "Plot Twist Reveal",
    category: "SCENE_COMPOSITION",
    description: "A carefully constructed revelation scene that recontextualizes everything the audience thought they knew.",
    previewUrl: null,
    promptTemplate: null,
    genre: "THRILLER",
    stylePreset: null,
    characterTemplates: null,
    sceneTemplates: [{ title: "The Reveal", timeOfDay: "NIGHT", mood: "shocking", cameraMovements: ["DOLLY_IN", "ZOOM_IN"] }],
    settingsTemplate: { fps: 24, aspectRatio: "16:9" },
    isPublic: true,
    isPremium: false,
    usageCount: 512,
    rating: 4.6,
    tags: ["scene", "thriller", "twist"],
  },
];

/* ── Fetch function with fallback ─────────────────────────────────────────── */

export async function getTemplates(options?: {
  category?: string;
  genre?: string;
  search?: string;
  sort?: "popular" | "rating" | "newest";
  limit?: number;
}): Promise<TemplateData[]> {
  try {
    // Fast-fail: check DB connectivity with a short timeout
    const dbOk = await isDbReachable();
    if (!dbOk) throw new Error("DB unreachable");

    const where: Record<string, unknown> = { isPublic: true };
    if (options?.category) where.category = options.category;
    if (options?.genre) where.genre = options.genre;
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const orderBy =
      options?.sort === "rating"
        ? { rating: "desc" as const }
        : options?.sort === "newest"
          ? { createdAt: "desc" as const }
          : { usageCount: "desc" as const };

    const templates = await prisma.template.findMany({
      where,
      take: options?.limit ?? 50,
      orderBy,
      include: {
        createdBy: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    return templates as unknown as TemplateData[];
  } catch {
    // Mock fallback when DB is unavailable
    let filtered = [...mockTemplates];

    if (options?.category) {
      filtered = filtered.filter((t) => t.category === options.category);
    }
    if (options?.genre) {
      filtered = filtered.filter((t) => t.genre === options.genre);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q)),
      );
    }

    if (options?.sort === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (options?.sort === "newest") {
      filtered.reverse();
    } else {
      filtered.sort((a, b) => b.usageCount - a.usageCount);
    }

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }
}

export async function getPopularTemplates(limit = 6): Promise<TemplateData[]> {
  return getTemplates({ sort: "popular", limit });
}
