"use client";

import { motion } from "framer-motion";
import { Badge } from "@genesis/ui";
import Link from "next/link";
import Image from "next/image";
import { blurDataURL } from "@/lib/image-utils";
import type { DashboardStats, RecentProject, ActivityItem } from "@/lib/dashboard-data";
import { genreIcons } from "@/lib/templates-data";
import type { TemplateData } from "@/lib/templates-data";

/* ── Animation variants ───────────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

/* ── Status config ────────────────────────────────────────────────────────── */

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info"; glow?: string }> = {
  DRAFT: { label: "Draft", variant: "default" },
  PRE_PRODUCTION: { label: "Pre-Production", variant: "info" },
  IN_PRODUCTION: { label: "In Production", variant: "info" },
  POST_PRODUCTION: { label: "Post-Production", variant: "info" },
  RENDERING: { label: "Rendering", variant: "warning", glow: "shadow-genesis-500/20" },
  COMPLETED: { label: "Complete", variant: "success" },
  ARCHIVED: { label: "Archived", variant: "default" },
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/* ── Icon components ─────────────────────────────────────────────────────── */

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ExclamationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

/* ── Stat Icons ───────────────────────────────────────────────────────────── */

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
}

function FilmClipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5" />
    </svg>
  );
}

/* ── Skeleton components ─────────────────────────────────────────────────── */

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Welcome */}
      <div className="space-y-2">
        <div className="h-8 w-72 rounded-lg bg-white/5" />
        <div className="h-4 w-48 rounded bg-white/5" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-white/5" />
              <div className="h-8 w-8 rounded-lg bg-white/5" />
            </div>
            <div className="h-7 w-16 rounded bg-white/10" />
            <div className="h-3 w-20 rounded bg-white/5" />
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className="space-y-4">
        <div className="h-6 w-40 rounded bg-white/5" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass p-4 rounded-2xl space-y-3">
              <div className="aspect-video rounded-xl bg-white/5" />
              <div className="h-4 w-32 rounded bg-white/10" />
              <div className="h-3 w-48 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard Content ──────────────────────────────────────────────── */

interface DashboardContentProps {
  userName: string;
  stats: DashboardStats;
  recentProjects: RecentProject[];
  activity: ActivityItem[];
  popularTemplates?: TemplateData[];
}

export function DashboardContent({
  userName,
  stats,
  recentProjects,
  activity,
  popularTemplates = [],
}: DashboardContentProps) {
  const statCards = [
    {
      label: "Total Projects",
      value: stats.totalProjects.toString(),
      icon: FolderIcon,
      color: "text-genesis-400",
      bg: "bg-genesis-500/10",
    },
    {
      label: "Watch Time",
      value: stats.totalWatchTime,
      icon: ClockIcon,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Credits Left",
      value: stats.creditsRemaining.toLocaleString(),
      icon: CoinIcon,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Published",
      value: stats.moviesPublished.toString(),
      icon: FilmClipIcon,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <motion.div
      className="space-y-8"
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      {/* ── Welcome ──────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
          Welcome back, <span className="gradient-text">{userName}</span>
        </h1>
        <p className="mt-1 text-gray-400 text-sm sm:text-base">
          Here&apos;s what&apos;s happening with your projects today.
        </p>
      </motion.div>

      {/* ── Stats Grid ───────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        variants={stagger}
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className="glass p-4 sm:p-5 rounded-2xl hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm text-gray-400 font-medium">
                  {stat.label}
                </span>
                <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold font-heading text-white">
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Quick Start ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
        <h2 className="font-heading text-lg font-semibold text-white mb-4">
          Quick Start
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Create new movie — large CTA */}
          <Link
            href="/projects/new"
            className="lg:col-span-2 group relative overflow-hidden rounded-2xl border border-genesis-700/30 bg-gradient-to-br from-genesis-950/80 to-genesis-900/40 p-6 sm:p-8 transition-all duration-300 hover:border-genesis-600/50 hover:shadow-lg hover:shadow-genesis-500/10"
          >
            <div className="relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-genesis-600/20 ring-1 ring-genesis-500/30 mb-4 group-hover:ring-genesis-400/50 transition-all">
                <PlusIcon className="w-6 h-6 text-genesis-400" />
              </div>
              <h3 className="font-heading text-lg font-bold text-white mb-1">
                Create New Movie
              </h3>
              <p className="text-sm text-gray-400">
                Start from scratch or use a template to kickstart your cinematic vision.
              </p>
            </div>
            {/* Decorative glow */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-genesis-500/10 blur-2xl group-hover:bg-genesis-500/20 transition-all" />
          </Link>

          {/* Template gallery */}
          <div className="lg:col-span-3 grid grid-cols-1 xs:grid-cols-2 gap-3">
            {(popularTemplates.length > 0 ? popularTemplates.slice(0, 4) : []).map((template) => (
              <Link
                key={template.id}
                href="/templates"
                className="group glass-hover p-4 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{template.genre ? genreIcons[template.genre] ?? "🎬" : "📋"}</span>
                  <h4 className="text-sm font-medium text-white group-hover:text-genesis-300 transition-colors truncate">
                    {template.name}
                  </h4>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 flex-1">
                  {template.description}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                  <RocketIcon className="w-3 h-3" />
                  {template.usageCount.toLocaleString()} uses
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Browse all templates link */}
        {popularTemplates.length > 0 && (
          <div className="mt-3 text-center">
            <Link
              href="/templates"
              className="text-sm text-genesis-400 hover:text-genesis-300 transition-colors"
            >
              Browse all templates →
            </Link>
          </div>
        )}
      </motion.div>

      {/* ── Recent Projects + Activity ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8">
        {/* Projects */}
        <motion.div className="xl:col-span-2" variants={fadeUp} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-white">
              Recent Projects
            </h2>
            <Link
              href="/dashboard/projects"
              className="text-sm text-genesis-400 hover:text-genesis-300 transition-colors"
            >
              View all
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="glass p-12 text-center rounded-2xl">
              <SparklesIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No projects yet</p>
              <p className="text-gray-600 text-sm mt-1">Create your first movie to get started</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              variants={stagger}
            >
              {recentProjects.map((project) => {
                const cfg = statusConfig[project.status] ?? statusConfig.DRAFT;
                return (
                  <motion.div
                    key={project.id}
                    variants={fadeUp}
                    transition={{ duration: 0.35 }}
                    className="glass-hover group cursor-pointer relative overflow-hidden p-4"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video rounded-xl bg-surface border border-surface-border mb-3 overflow-hidden relative">
                      {project.thumbnailUrl ? (
                        <Image
                          src={project.thumbnailUrl}
                          alt={project.title}
                          fill
                          className="w-full h-full object-cover"
                          sizes="(max-width: 640px) 100vw, 50vw"
                          placeholder="blur"
                          blurDataURL={blurDataURL()}
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-genesis-950/30 to-neon-pink/5 group-hover:from-genesis-900/40 transition-colors" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl opacity-30 group-hover:opacity-50 transition-opacity">
                              {genreIcons[project.genre] ?? "🎬"}
                            </span>
                          </div>
                        </>
                      )}
                      {/* Status badge overlay */}
                      <div className="absolute top-2 right-2">
                        <Badge variant={cfg.variant}>
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Info */}
                    <h3 className="font-medium text-white group-hover:text-genesis-300 transition-colors truncate">
                      {project.title}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{project.scenesCount} scenes</span>
                      <span>&middot;</span>
                      <span>{formatDuration(project.totalDuration)}</span>
                      <span>&middot;</span>
                      <span>{timeAgo(project.updatedAt)}</span>
                    </div>

                    {/* Progress bar for rendering */}
                    {project.renderProgress != null && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-genesis-400 font-medium">Rendering...</span>
                          <span className="text-gray-400">{Math.round(project.renderProgress)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-genesis-600 to-genesis-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${project.renderProgress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Quick actions (appear on hover) */}
                    <div className="absolute top-3 left-3 flex gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="p-2 sm:p-1.5 rounded-lg bg-surface/80 backdrop-blur-sm border border-surface-border text-gray-400 hover:text-white hover:bg-surface-overlay transition-colors touch-target"
                        title="Edit"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-2 sm:p-1.5 rounded-lg bg-surface/80 backdrop-blur-sm border border-surface-border text-gray-400 hover:text-white hover:bg-surface-overlay transition-colors touch-target"
                        title="Share"
                      >
                        <ShareIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-2 sm:p-1.5 rounded-lg bg-surface/80 backdrop-blur-sm border border-surface-border text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors touch-target"
                        title="Delete"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>

        {/* Activity feed */}
        <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
          <h2 className="font-heading text-lg font-semibold text-white mb-4">
            Activity
          </h2>
          <div className="glass rounded-2xl divide-y divide-white/[0.04]">
            {activity.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 text-sm">No recent activity</p>
              </div>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="px-4 py-3.5 hover:bg-white/[0.02] transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                      item.type === "render_complete"
                        ? "bg-green-500/10 text-green-400"
                        : item.type === "render_failed"
                          ? "bg-red-500/10 text-red-400"
                          : item.type === "project_created"
                            ? "bg-genesis-500/10 text-genesis-400"
                            : "bg-blue-500/10 text-blue-400"
                    }`}>
                      {item.type === "render_complete" ? (
                        <CheckCircleIcon className="w-4 h-4" />
                      ) : item.type === "render_failed" ? (
                        <ExclamationIcon className="w-4 h-4" />
                      ) : (
                        <SparklesIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      {item.projectTitle && (
                        <p className="text-xs text-genesis-400/80 mt-1">
                          {item.projectTitle}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 whitespace-nowrap shrink-0">
                      {timeAgo(item.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
