"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@genesis/ui";

/* ── Animation variants ───────────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

/* ── Status config ────────────────────────────────────────────────────────── */

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" }> = {
  DRAFT: { label: "Draft", variant: "default" },
  PRE_PRODUCTION: { label: "Pre-Production", variant: "info" },
  IN_PRODUCTION: { label: "In Production", variant: "info" },
  POST_PRODUCTION: { label: "Post-Production", variant: "info" },
  RENDERING: { label: "Rendering", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
  FAILED: { label: "Failed", variant: "error" },
};

const genreIcons: Record<string, string> = {
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

/* ── Mock projects ────────────────────────────────────────────────────────── */

function getMockProjects() {
  const now = new Date();
  return [
    {
      id: "mock-1",
      title: "Neon Dreams",
      description: "A cyberpunk adventure through neo-Tokyo",
      status: "RENDERING",
      genre: "SCI_FI",
      scenesCount: 8,
      totalDuration: 180,
      renderProgress: 67,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
    },
    {
      id: "mock-2",
      title: "Ocean Depths",
      description: "Journey into the Mariana Trench",
      status: "COMPLETED",
      genre: "DOCUMENTARY",
      scenesCount: 12,
      totalDuration: 420,
      renderProgress: null,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      id: "mock-3",
      title: "City Pulse",
      description: "Urban life through an AI lens",
      status: "DRAFT",
      genre: "EXPERIMENTAL",
      scenesCount: 3,
      totalDuration: 0,
      renderProgress: null,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "mock-4",
      title: "Desert Mirage",
      description: "Surreal visions across endless dunes",
      status: "IN_PRODUCTION",
      genre: "FANTASY",
      scenesCount: 6,
      totalDuration: 90,
      renderProgress: null,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
    },
    {
      id: "mock-5",
      title: "Starlight Sonata",
      description: "A musical journey through the cosmos",
      status: "COMPLETED",
      genre: "ANIMATION",
      scenesCount: 9,
      totalDuration: 300,
      renderProgress: null,
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: "mock-6",
      title: "The Algorithm",
      description: "When AI becomes self-aware",
      status: "DRAFT",
      genre: "THRILLER",
      scenesCount: 0,
      totalDuration: 0,
      renderProgress: null,
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    },
  ];
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s > 0 ? `${s}s` : ""}`.trim() : `${s}s`;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

export default function ProjectsPage() {
  const projects = getMockProjects();

  return (
    <motion.div
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            Projects
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage all your cinematic creations
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-genesis-600 to-genesis-500 text-white font-medium text-sm hover:from-genesis-500 hover:to-genesis-400 transition-all shadow-lg shadow-genesis-500/20 hover:shadow-genesis-500/30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Movie
        </Link>
      </motion.div>

      {/* Project grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={stagger}
      >
        {projects.map((project) => {
          const cfg = statusConfig[project.status] ?? statusConfig.DRAFT;
          return (
            <motion.div
              key={project.id}
              variants={fadeUp}
              transition={{ duration: 0.35 }}
              className="glass-hover group cursor-pointer relative overflow-hidden p-4 rounded-2xl"
            >
              {/* Thumbnail placeholder */}
              <div className="aspect-video rounded-xl bg-surface border border-surface-border mb-3 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-genesis-950/30 to-neon-pink/5 group-hover:from-genesis-900/40 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl opacity-30 group-hover:opacity-50 transition-opacity">
                    {genreIcons[project.genre] ?? "🎬"}
                  </span>
                </div>
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
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
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

              {/* Render progress */}
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
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
