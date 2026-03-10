"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import VideoPlayer from "@/components/watch/video-player";
import ShareModal from "@/components/watch/share-modal";
import CommentsSection from "@/components/watch/comments-section";
import RelatedSidebar from "@/components/watch/related-sidebar";
import type { WatchData } from "@/lib/watch-data";
import { getGenreLabel } from "@/lib/watch-data";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Icons
 * ══════════════════════════════════════════════════════════════════════════════ */

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);
const FlagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
  </svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════════════
 *  Helpers
 * ══════════════════════════════════════════════════════════════════════════════ */

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}m ${s}s`;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  WatchContent — main client component
 * ══════════════════════════════════════════════════════════════════════════════ */

export default function WatchContent({ data }: { data: WatchData }) {
  const { movie, comments, moreFromCreator, similarMovies } = data;

  const [liked, setLiked] = useState(movie.liked);
  const [likeCount, setLikeCount] = useState(movie.likes);
  const [subscribed, setSubscribed] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const watchTimeRef = useRef(0);
  const viewTrackedRef = useRef(false);

  /* ── View tracking ────────────────────────────────────────────────────── */

  useEffect(() => {
    if (viewTrackedRef.current) return;
    viewTrackedRef.current = true;

    fetch(`/api/watch/${encodeURIComponent(movie.id)}/view`, { method: "POST" }).catch(() => {});
  }, [movie.id]);

  /* ── Watch time tracking ──────────────────────────────────────────────── */

  const handleTimeUpdate = useCallback(
    (currentTime: number, _duration: number) => {
      watchTimeRef.current = currentTime;
    },
    [],
  );

  useEffect(() => {
    const movieId = movie.id;
    return () => {
      if (watchTimeRef.current > 0) {
        const body = JSON.stringify({ watchTime: Math.floor(watchTimeRef.current) });
        // Use sendBeacon for reliable unload tracking
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            `/api/watch/${encodeURIComponent(movieId)}/analytics`,
            new Blob([body], { type: "application/json" }),
          );
        }
      }
    };
  }, [movie.id]);

  /* ── Like toggle ──────────────────────────────────────────────────────── */

  const toggleLike = useCallback(async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => c + (newLiked ? 1 : -1));
    try {
      await fetch(`/api/watch/${encodeURIComponent(movie.id)}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: newLiked }),
      });
    } catch {
      setLiked(!newLiked);
      setLikeCount((c) => c + (newLiked ? -1 : 1));
    }
  }, [liked, movie.id]);

  /* ── Description truncation ───────────────────────────────────────────── */

  const description = movie.description ?? "";
  const isLongDesc = description.length > 200;
  const displayedDesc = showFullDesc ? description : description.slice(0, 200);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Video Player ──────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 pt-2 sm:pt-4">
        <VideoPlayer
          src={movie.finalVideoUrl}
          poster={movie.thumbnailUrl}
          title={movie.title}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 mt-4 sm:mt-6 pb-16">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* ── Left: info + comments ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Title */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-white leading-tight">
              {movie.title}
            </h1>

            {/* Stats + Action buttons row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left: stats */}
              <div className="flex items-center gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1.5">
                  <EyeIcon />
                  {fmtNumber(movie.views)} views
                </span>
                <span>·</span>
                <span>{fmtDate(movie.createdAt)}</span>
              </div>

              {/* Right: action buttons */}
              <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 flex-wrap">
                <button
                  onClick={toggleLike}
                  aria-label={liked ? "Unlike this video" : "Like this video"}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 xs:px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    liked
                      ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                      : "bg-white/5 text-white/70 hover:bg-white/10 border border-transparent"
                  }`}
                >
                  <HeartIcon filled={liked} />
                  {fmtNumber(likeCount)}
                </button>

                <button
                  onClick={() => setShareOpen(true)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 xs:px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                >
                  <ShareIcon />
                  Share
                </button>

                <button className="flex items-center gap-1 sm:gap-1.5 px-2.5 xs:px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 transition-colors group relative" aria-label="Download video (Pro feature)">
                  <DownloadIcon />
                  <span className="hidden xs:inline">Download</span><span className="xs:hidden">DL</span>
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded bg-genesis-600 text-[9px] font-bold text-white uppercase">
                    Pro
                  </span>
                </button>

                <button className="flex items-center gap-1 sm:gap-1.5 px-2 xs:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors" aria-label="Report this video">
                  <FlagIcon />
                </button>
              </div>
            </div>

            {/* Creator info */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 sm:gap-4 bg-surface-raised rounded-2xl p-3 sm:p-4">
              <Link
                href={`/profile/${movie.creator.username}`}
                className="flex items-center gap-3 group"
              >
                {movie.creator.avatarUrl ? (
                  <Image
                    src={movie.creator.avatarUrl}
                    alt={movie.creator.displayName}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-genesis-600/30 flex items-center justify-center text-lg font-bold text-genesis-400">
                    {movie.creator.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-white group-hover:text-genesis-400 transition-colors">
                    {movie.creator.displayName}
                  </p>
                  <p className="text-xs text-white/40">
                    {fmtNumber(movie.creator.subscriberCount)} subscribers
                  </p>
                </div>
              </Link>

              <button
                onClick={() => setSubscribed(!subscribed)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  subscribed
                    ? "bg-white/10 text-white/70 hover:bg-white/15"
                    : "bg-genesis-600 hover:bg-genesis-500 text-white"
                }`}
              >
                {subscribed ? "Subscribed" : "Subscribe"}
              </button>
            </div>

            {/* Description + metadata */}
            <div className="bg-surface-raised rounded-2xl p-4 space-y-3">
              <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
                {displayedDesc}
                {isLongDesc && !showFullDesc && "..."}
              </p>
              {isLongDesc && (
                <button
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="text-sm text-genesis-400 hover:text-genesis-300 font-medium transition-colors"
                >
                  {showFullDesc ? "Show less" : "Show more"}
                </button>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-x-3 sm:gap-x-6 gap-y-2 text-xs text-white/40 pt-2 border-t border-surface-border">
                <span>
                  <strong className="text-white/60">Genre:</strong>{" "}
                  {getGenreLabel(movie.genre)}
                </span>
                <span>
                  <strong className="text-white/60">Duration:</strong>{" "}
                  {fmtDuration(movie.totalDuration)}
                </span>
                <span>
                  <strong className="text-white/60">Resolution:</strong>{" "}
                  {movie.resolution}
                </span>
                <span>
                  <strong className="text-white/60">Scenes:</strong>{" "}
                  {movie.scenesCount}
                </span>
                <span>
                  <strong className="text-white/60">Published:</strong>{" "}
                  {fmtDate(movie.createdAt)}
                </span>
              </div>

              {/* Tags */}
              {movie.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {movie.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/explore?search=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/50 hover:bg-genesis-600/20 hover:text-genesis-400 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <CommentsSection movieId={movie.id} initialComments={comments} />
          </div>

          {/* ── Right sidebar: related movies ────────────────────────────── */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <RelatedSidebar
              moreFromCreator={moreFromCreator}
              similarMovies={similarMovies}
              creatorName={movie.creator.displayName}
            />
          </div>
        </div>
      </div>

      {/* ── Share modal ───────────────────────────────────────────────────── */}
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        movieTitle={movie.title}
        movieId={movie.id}
      />
    </div>
  );
}
