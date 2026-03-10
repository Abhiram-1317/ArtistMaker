"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import Image from "next/image";
import { OptimizedImage } from "@/components/optimized-image";
import type { ExploreData, ExploreMovie, SortMode } from "@/lib/explore-data";
import { GENRE_LIST } from "@/lib/explore-data";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Constants
 * ══════════════════════════════════════════════════════════════════════════════ */

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

const GENRE_ICONS: Record<string, string> = {
  SCI_FI: "🚀",
  FANTASY: "🏰",
  ACTION: "💥",
  DRAMA: "🎭",
  COMEDY: "😂",
  HORROR: "👻",
  THRILLER: "🔍",
  DOCUMENTARY: "🎥",
  ANIMATION: "✨",
  ROMANCE: "💕",
  EXPERIMENTAL: "🧪",
  OTHER: "🎬",
};

const FILTERS: { label: string; value: string; icon?: string }[] = [
  { label: "All", value: "all" },
  { label: "Trending", value: "trending", icon: "🔥" },
  { label: "Most Viewed", value: "most_viewed" },
  { label: "Recent", value: "recent" },
  ...GENRE_LIST.map((g) => ({
    label: GENRE_LABELS[g] ?? g,
    value: g,
    icon: GENRE_ICONS[g],
  })),
];

const PAGE_SIZE = 12;

/* ── Animation variants ───────────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

/* ══════════════════════════════════════════════════════════════════════════════
 *  Helpers
 * ══════════════════════════════════════════════════════════════════════════════ */

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400_000);
  if (days > 30) return `${Math.floor(days / 30)}mo ago`;
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / 3600_000);
  if (hours > 0) return `${hours}h ago`;
  return "just now";
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Movie Card — Featured (large)
 * ══════════════════════════════════════════════════════════════════════════════ */

function FeaturedCard({ movie }: { movie: ExploreMovie }) {
  const [hovering, setHovering] = useState(false);

  return (
    <motion.div variants={fadeUp}>
      <Link href={`/projects/${movie.id}`}>
        <div
          className="glass-hover group cursor-pointer overflow-hidden relative"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {/* Thumbnail */}
          <div className="aspect-video relative overflow-hidden rounded-t-2xl">
            {movie.thumbnailUrl ? (
              <Image
                src={movie.thumbnailUrl}
                alt={movie.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-genesis-950/60 via-surface-raised to-surface flex items-center justify-center">
                <span className="text-5xl opacity-30 group-hover:opacity-50 transition-opacity">
                  {GENRE_ICONS[movie.genre] ?? "🎬"}
                </span>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Duration badge */}
            <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/70 text-xs text-white font-medium backdrop-blur-sm">
              {formatDuration(movie.totalDuration)}
            </span>

            {/* Genre badge */}
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-genesis-600/80 text-xs text-white font-medium backdrop-blur-sm">
              {GENRE_ICONS[movie.genre]} {GENRE_LABELS[movie.genre] ?? movie.genre}
            </span>

            {/* Hover play button */}
            <AnimatePresence>
              {hovering && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="font-heading font-semibold text-white text-lg line-clamp-1 group-hover:text-genesis-300 transition-colors">
              {movie.title}
            </h3>
            <p className="text-sm text-gray-400 mt-1 line-clamp-1">
              {movie.description}
            </p>

            {/* Creator row */}
            <div className="flex items-center gap-2 mt-3">
              <div className="w-6 h-6 rounded-full bg-genesis-700/40 flex items-center justify-center text-xs text-genesis-300 font-bold shrink-0">
                {movie.creator.displayName.charAt(0)}
              </div>
              <span className="text-sm text-gray-400 truncate">
                {movie.creator.displayName}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {formatViews(movie.views)}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {formatViews(movie.likes)}
              </span>
              <span>{movie.scenesCount} scenes</span>
              <span className="ml-auto">{timeAgo(movie.createdAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Movie Card — Compact (for trending / grid)
 * ══════════════════════════════════════════════════════════════════════════════ */

function CompactCard({ movie }: { movie: ExploreMovie }) {
  const [hovering, setHovering] = useState(false);

  return (
    <motion.div variants={fadeUp}>
      <Link href={`/projects/${movie.id}`}>
        <div
          className="glass-hover group cursor-pointer overflow-hidden relative"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div className="aspect-video relative overflow-hidden rounded-t-2xl">
            {movie.thumbnailUrl ? (
              <OptimizedImage
                src={movie.thumbnailUrl}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-genesis-950/40 via-surface-raised to-surface flex items-center justify-center">
                <span className="text-3xl opacity-25 group-hover:opacity-40 transition-opacity">
                  {GENRE_ICONS[movie.genre] ?? "🎬"}
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-medium">
              {formatDuration(movie.totalDuration)}
            </span>

            {/* Hover play overlay */}
            <AnimatePresence>
              {hovering && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-3">
            <h4 className="font-medium text-white text-sm line-clamp-1 group-hover:text-genesis-300 transition-colors">
              {movie.title}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
              <span>{formatViews(movie.views)} views</span>
              <span>&middot;</span>
              <span>{timeAgo(movie.createdAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Skeleton card (loading)
 * ══════════════════════════════════════════════════════════════════════════════ */

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/5" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-white/5" />
        <div className="h-3 w-1/2 rounded bg-white/5" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Genre Row — horizontal scroll
 * ══════════════════════════════════════════════════════════════════════════════ */

function GenreRow({ genre, movies }: { genre: string; movies: ExploreMovie[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-lg font-semibold text-white">
          {GENRE_ICONS[genre]} {GENRE_LABELS[genre] ?? genre}
        </h3>
        <button
          className="text-sm text-genesis-400 hover:text-genesis-300 transition-colors"
          onClick={() => scrollRef.current?.scrollBy({ left: 600, behavior: "smooth" })}
        >
          See more →
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin"
        style={{ scrollbarWidth: "thin" }}
      >
        {movies.map((m) => (
          <div key={m.id} className="w-48 xs:w-56 shrink-0">
            <CompactCard movie={m} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Search bar
 * ══════════════════════════════════════════════════════════════════════════════ */

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative max-w-xl mx-auto">
      {/* Search icon */}
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search movies, creators, genres..."
        aria-label="Search movies, creators, and genres"
        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-raised border border-surface-border
          text-gray-100 placeholder:text-gray-500
          focus:outline-none focus:ring-2 focus:ring-genesis-500 focus:border-genesis-500
          transition-all duration-200"
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Main — Explore Page
 * ══════════════════════════════════════════════════════════════════════════════ */

export function ExplorePage({ initialData }: { initialData: ExploreData }) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [feedMovies, setFeedMovies] = useState<ExploreMovie[]>([]);
  const [cursor, setCursor] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  // Filtered view: when a specific filter is active we show a flat feed
  const isFilteredView =
    activeFilter !== "all" || search.length > 0;

  /* ── Infinite scroll trigger ─────────────────────────────────────────── */

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      // Determine sort/genre from active filter
      let sort: SortMode = "all";
      let genre: string | undefined;

      if (["trending", "most_viewed", "recent"].includes(activeFilter)) {
        sort = activeFilter as SortMode;
      } else if (activeFilter !== "all") {
        genre = activeFilter;
      }

      const params = new URLSearchParams({
        cursor: cursor.toString(),
        limit: PAGE_SIZE.toString(),
        ...(sort !== "all" && { sort }),
        ...(genre && { genre }),
        ...(search && { search }),
      });

      const res = await fetch(`/api/explore?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();

      setFeedMovies((prev) => [...prev, ...data.movies]);
      setCursor((c) => c + data.movies.length);
      setHasMore(data.hasMore);
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [cursor, hasMore, activeFilter, search]);

  const { ref: infiniteRef } = useInView({
    threshold: 0,
    onChange: (inView) => {
      if (inView && isFilteredView) loadMore();
    },
  });

  /* ── Switch filter ───────────────────────────────────────────────────── */

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    setFeedMovies([]);
    setCursor(0);
    setHasMore(true);
    loadingRef.current = false;
  };

  /* ── Search handler ──────────────────────────────────────────────────── */

  const handleSearch = (value: string) => {
    setSearch(value);
    setFeedMovies([]);
    setCursor(0);
    setHasMore(true);
    loadingRef.current = false;
  };

  /* ── Derive visible movies from local data when no API call yet ──────── */

  const localFiltered = (() => {
    let pool = [
      ...initialData.featured,
      ...initialData.trending,
      ...Object.values(initialData.genres).flat(),
    ];
    // Deduplicate by id
    const seen = new Set<string>();
    pool = pool.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    if (activeFilter === "trending") pool.sort((a, b) => b.likes - a.likes);
    if (activeFilter === "most_viewed") pool.sort((a, b) => b.views - a.views);
    if (activeFilter === "recent") pool.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (!["all", "trending", "most_viewed", "recent"].includes(activeFilter)) {
      pool = pool.filter((m) => m.genre === activeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      pool = pool.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.description ?? "").toLowerCase().includes(q) ||
          m.creator.displayName.toLowerCase().includes(q),
      );
    }
    return pool;
  })();

  const visibleMovies = feedMovies.length > 0 ? feedMovies : localFiltered;

  return (
    <div className="space-y-10 pb-20">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <motion.section
        className="text-center pt-4 pb-2 space-y-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-heading text-3xl xs:text-4xl sm:text-5xl font-bold gradient-text">
          Explore AI Cinema
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Discover movies created by our community
        </p>
        <div className="mt-6">
          <SearchBar value={search} onChange={handleSearch} />
        </div>
      </motion.section>

      {/* ── Filter chips ────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin" style={{ scrollbarWidth: "thin" }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={`
              shrink-0 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200 border whitespace-nowrap
              ${
                activeFilter === f.value
                  ? "bg-genesis-600 text-white border-genesis-500 shadow-lg shadow-genesis-500/25"
                  : "bg-white/[0.03] text-gray-400 border-surface-border hover:bg-white/[0.06] hover:text-white"
              }
            `}
          >
            {f.icon && <span className="mr-1">{f.icon}</span>}
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Filtered view (flat grid) ───────────────────────────────────── */}
      {isFilteredView ? (
        <section>
          <h2 className="font-heading text-xl font-semibold text-white mb-4">
            {search
              ? `Results for "${search}"`
              : activeFilter === "trending"
                ? "🔥 Trending Now"
                : activeFilter === "most_viewed"
                  ? "👁 Most Viewed"
                  : activeFilter === "recent"
                    ? "🕐 Recent"
                    : `${GENRE_ICONS[activeFilter] ?? "🎬"} ${GENRE_LABELS[activeFilter] ?? activeFilter}`}
          </h2>

          {visibleMovies.length === 0 && !loading ? (
            <div className="glass p-12 text-center rounded-2xl">
              <p className="text-gray-500 text-lg">No movies found</p>
              <p className="text-gray-600 text-sm mt-1">Try a different filter or search term</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {visibleMovies.map((m) => (
                <CompactCard key={m.id} movie={m} />
              ))}
              {loading &&
                Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`skel-${i}`} />)}
            </motion.div>
          )}

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={infiniteRef} className="flex justify-center pt-8">
              {loading ? (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <div className="w-4 h-4 border-2 border-genesis-500 border-t-transparent rounded-full animate-spin" />
                  Loading more…
                </div>
              ) : (
                <button
                  onClick={loadMore}
                  className="btn-secondary text-sm px-6 py-2"
                >
                  Load more
                </button>
              )}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* ── Featured This Week ──────────────────────────────────────── */}
          <section>
            <h2 className="font-heading text-xl font-semibold text-white mb-4">
              🔥 Featured This Week
            </h2>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {initialData.featured.map((m) => (
                <FeaturedCard key={m.id} movie={m} />
              ))}
            </motion.div>
          </section>

          {/* ── Trending Now ────────────────────────────────────────────── */}
          <section>
            <h2 className="font-heading text-xl font-semibold text-white mb-4">
              📈 Trending Now
            </h2>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {initialData.trending.map((m) => (
                <CompactCard key={m.id} movie={m} />
              ))}
            </motion.div>
          </section>

          {/* ── Browse by Genre ─────────────────────────────────────────── */}
          <section>
            <h2 className="font-heading text-xl font-semibold text-white mb-6">
              Browse by Genre
            </h2>
            <div className="space-y-8">
              {Object.entries(initialData.genres).map(([genre, movies]) => (
                <GenreRow key={genre} genre={genre} movies={movies} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
