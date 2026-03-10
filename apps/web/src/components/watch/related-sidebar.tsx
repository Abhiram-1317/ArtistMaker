"use client";

import Link from "next/link";
import Image from "next/image";
import { blurDataURL } from "@/lib/image-utils";
import type { ExploreMovie } from "@/lib/explore-data";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Types
 * ══════════════════════════════════════════════════════════════════════════════ */

interface RelatedSidebarProps {
  moreFromCreator: ExploreMovie[];
  similarMovies: ExploreMovie[];
  creatorName: string;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Helpers
 * ══════════════════════════════════════════════════════════════════════════════ */

function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const GENRE_LABELS: Record<string, string> = {
  SCI_FI: "Sci-Fi", FANTASY: "Fantasy", ACTION: "Action", DRAMA: "Drama",
  COMEDY: "Comedy", HORROR: "Horror", THRILLER: "Thriller",
  DOCUMENTARY: "Documentary", ANIMATION: "Animation", ROMANCE: "Romance",
  EXPERIMENTAL: "Experimental", OTHER: "Other",
};

/* ══════════════════════════════════════════════════════════════════════════════
 *  RelatedCard
 * ══════════════════════════════════════════════════════════════════════════════ */

function RelatedCard({ movie }: { movie: ExploreMovie }) {
  return (
    <Link
      href={`/watch/${movie.id}`}
      className="flex gap-3 group hover:bg-white/5 rounded-xl p-2 -mx-2 transition-colors"
    >
      {/* Thumbnail */}
      <div className="relative w-40 min-w-[10rem] aspect-video rounded-lg overflow-hidden bg-surface-overlay flex-shrink-0">
        {movie.thumbnailUrl ? (
          <Image
            src={movie.thumbnailUrl}
            alt={movie.title}
            fill
            className="w-full h-full object-cover"
            sizes="160px"
            placeholder="blur"
            blurDataURL={blurDataURL()}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-genesis-900/50 to-surface-overlay flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white/20">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
          </div>
        )}
        {/* Duration badge */}
        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
          {fmtDuration(movie.totalDuration)}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="text-sm font-medium text-white/90 group-hover:text-white truncate leading-tight">
          {movie.title}
        </h4>
        <p className="text-xs text-white/40 mt-1 truncate">
          {movie.creator.displayName}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-white/30">
          <span>{fmtViews(movie.views)} views</span>
          <span>·</span>
          <span>{GENRE_LABELS[movie.genre] ?? movie.genre}</span>
        </div>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  RelatedSidebar
 * ══════════════════════════════════════════════════════════════════════════════ */

export default function RelatedSidebar({
  moreFromCreator,
  similarMovies,
  creatorName,
}: RelatedSidebarProps) {
  return (
    <aside aria-label="Related videos" className="space-y-6">
      {/* More from creator */}
      {moreFromCreator.length > 0 && (
        <section>
          <h3 className="text-sm font-heading font-bold text-white/70 uppercase tracking-wider mb-3">
            More from {creatorName}
          </h3>
          <div className="space-y-1">
            {moreFromCreator.map((m) => (
              <RelatedCard key={m.id} movie={m} />
            ))}
          </div>
        </section>
      )}

      {/* Similar movies */}
      {similarMovies.length > 0 && (
        <section aria-label="Similar movies">
          <h3 className="text-sm font-heading font-bold text-white/70 uppercase tracking-wider mb-3">
            Similar Movies
          </h3>
          <div className="space-y-1">
            {similarMovies.map((m) => (
              <RelatedCard key={m.id} movie={m} />
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
