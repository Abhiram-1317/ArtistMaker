"use client";

import { Spinner } from "./micro-interactions";

// ── Full Page Loading ────────────────────────────────────────────────────────
export function FullPageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-genesis-500/20 border-t-genesis-500 animate-spinner" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-neon-pink/30 animate-spinner" style={{ animationDirection: "reverse", animationDuration: "1.2s" }} />
        </div>
        <p className="text-sm text-gray-400">{message}</p>
      </div>
    </div>
  );
}

// ── Skeleton Components ──────────────────────────────────────────────────────
export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`h-4 rounded-lg bg-white/[0.06] animate-skeleton-pulse ${className}`} />
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-skeleton-pulse ${className}`} />
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-14 h-14" };
  return <div className={`${sizeMap[size]} rounded-full bg-white/[0.06] animate-skeleton-pulse`} />;
}

// ── Card Skeleton ────────────────────────────────────────────────────────────
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-raised overflow-hidden animate-skeleton-pulse">
      <div className="h-40 bg-white/[0.04]" />
      <div className="p-4 space-y-3">
        <SkeletonLine className="w-3/4 h-5" />
        <SkeletonLine className="w-full h-3" />
        <SkeletonLine className="w-1/2 h-3" />
        <div className="flex items-center gap-2 pt-2">
          <SkeletonAvatar size="sm" />
          <SkeletonLine className="w-24 h-3" />
        </div>
      </div>
    </div>
  );
}

// ── Stats Card Skeleton ──────────────────────────────────────────────────────
export function StatsCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-raised p-5 animate-skeleton-pulse">
      <div className="flex items-center justify-between mb-3">
        <SkeletonLine className="w-20 h-3" />
        <div className="w-8 h-8 rounded-lg bg-white/[0.06]" />
      </div>
      <SkeletonLine className="w-16 h-7" />
      <SkeletonLine className="w-24 h-3 mt-2" />
    </div>
  );
}

// ── Table Skeleton ───────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-raised overflow-hidden">
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLine key={i} className={`h-3 ${i === 1 ? "w-32" : i === 2 ? "w-20" : "w-16"}`} />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-white/[0.04] animate-skeleton-pulse" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex items-center gap-4">
            <SkeletonAvatar size="sm" />
            <SkeletonLine className="flex-1 h-3" />
            <SkeletonLine className="w-16 h-3" />
            <SkeletonLine className="w-12 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Dashboard Page Skeleton ──────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <SkeletonLine className="w-48 h-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SkeletonBlock className="h-80" />
        </div>
        <SkeletonBlock className="h-80" />
      </div>
    </div>
  );
}

// ── Infinite Scroll Loader ───────────────────────────────────────────────────
export function InfiniteScrollLoader({ hasMore = true }: { hasMore?: boolean }) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center py-8">
      <Spinner size="md" />
    </div>
  );
}

// ── Project Grid Skeleton ────────────────────────────────────────────────────
export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
