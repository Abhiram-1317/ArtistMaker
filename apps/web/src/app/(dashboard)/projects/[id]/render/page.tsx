"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  useRenderSocket,
  type ActivityLogEntry,
  type ShotState,
} from "@/hooks/use-render-socket";

/* ── Pipeline stage definitions ──────────────────────────────────────────── */

const PIPELINE_STAGES = [
  { id: "script-analysis", label: "Script Analysis", icon: "📝" },
  { id: "scene-planning", label: "Scene Planning", icon: "🎬" },
  { id: "character-gen", label: "Character Generation", icon: "🧑‍🎨" },
  { id: "scene-rendering", label: "Scene Rendering", icon: "🖼️" },
  { id: "audio-synthesis", label: "Audio Synthesis", icon: "🔊" },
  { id: "post-processing", label: "Post Processing", icon: "✨" },
  { id: "final-composition", label: "Final Composition", icon: "🎞️" },
];

function getStageIndex(stageName: string): number {
  const lower = stageName.toLowerCase();
  const idx = PIPELINE_STAGES.findIndex(
    (s) =>
      lower.includes(s.id.replace("-", " ")) ||
      lower.includes(s.label.toLowerCase()),
  );
  return idx >= 0 ? idx : -1;
}

/* ── Circular Progress Component ─────────────────────────────────────────── */

function CircularProgress({
  progress,
  size = 200,
  strokeWidth = 8,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#b94dff" />
            <stop offset="100%" stopColor="#00e5ff" />
          </linearGradient>
          <filter id="progressGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(42, 42, 58, 0.6)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          filter="url(#progressGlow)"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={Math.floor(progress)}
          initial={{ scale: 1.1, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-heading font-bold text-white"
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
}

/* ── Pipeline Stage Item ─────────────────────────────────────────────────── */

function PipelineStage({
  stage,
  status,
  index,
}: {
  stage: (typeof PIPELINE_STAGES)[number];
  status: "pending" | "active" | "complete";
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${
        status === "active"
          ? "bg-genesis-900/40 border border-genesis-600/30"
          : status === "complete"
            ? "bg-green-900/20 border border-green-700/20"
            : "opacity-50"
      }`}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
        {status === "complete" ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
        ) : status === "active" ? (
          <div className="w-6 h-6 rounded-full border-2 border-genesis-500 border-t-transparent animate-spin" />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-surface-border" />
        )}
      </div>

      {/* Label */}
      <span className="text-sm">{stage.icon}</span>
      <span
        className={`text-sm font-medium ${
          status === "active"
            ? "text-genesis-300"
            : status === "complete"
              ? "text-green-400"
              : "text-gray-500"
        }`}
      >
        {stage.label}
      </span>
    </motion.div>
  );
}

/* ── Shot Card ───────────────────────────────────────────────────────────── */

function ShotCard({ shot }: { shot: ShotState }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-xl overflow-hidden border ${
        shot.status === "complete"
          ? "border-green-700/30"
          : shot.status === "processing"
            ? "border-genesis-600/40"
            : shot.status === "error"
              ? "border-red-700/30"
              : "border-surface-border"
      }`}
    >
      {/* Thumbnail area */}
      <div className="aspect-video bg-surface-overlay relative">
        {shot.status === "complete" && shot.thumbnailUrl ? (
          <div className="w-full h-full bg-gradient-to-br from-green-900/40 to-surface-overlay flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        ) : shot.status === "processing" ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-genesis-500 border-t-transparent animate-spin" />
          </div>
        ) : shot.status === "error" ? (
          <div className="w-full h-full flex items-center justify-center bg-red-900/20">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-surface-border" />
          </div>
        )}

        {/* Processing overlay progress */}
        {shot.status === "processing" && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-border">
            <motion.div
              className="h-full bg-genesis-500"
              initial={{ width: "0%" }}
              animate={{ width: `${shot.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>

      {/* Shot label */}
      <div className="px-3 py-2 bg-surface-raised">
        <p className="text-xs font-mono text-gray-400 truncate">
          {shot.shotId}
        </p>
        <p
          className={`text-xs mt-0.5 ${
            shot.status === "complete"
              ? "text-green-400"
              : shot.status === "processing"
                ? "text-genesis-400"
                : shot.status === "error"
                  ? "text-red-400"
                  : "text-gray-500"
          }`}
        >
          {shot.status === "complete"
            ? "Complete"
            : shot.status === "processing"
              ? `Rendering ${shot.progress}%`
              : shot.status === "error"
                ? "Failed"
                : "Pending"}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Activity Log Entry ──────────────────────────────────────────────────── */

function LogEntry({ entry }: { entry: ActivityLogEntry }) {
  const color =
    entry.type === "error"
      ? "text-red-400"
      : entry.type === "complete"
        ? "text-green-400"
        : entry.type === "status"
          ? "text-neon-cyan"
          : entry.type === "progress"
            ? "text-genesis-300"
            : "text-gray-400";

  const time = entry.timestamp.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 py-1.5 text-sm font-mono"
    >
      <span className="text-gray-600 flex-shrink-0">{time}</span>
      <span className={color}>{entry.message}</span>
    </motion.div>
  );
}

/* ── Completion Overlay ──────────────────────────────────────────────────── */

function CompletionOverlay({
  onViewMovie,
  countdown,
}: {
  onViewMovie: () => void;
  countdown: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="text-center max-w-md mx-auto px-6"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 10 }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-neon-cyan flex items-center justify-center"
        >
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-heading font-bold text-white mb-2"
        >
          Render Complete!
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-8"
        >
          Your cinematic masterpiece is ready to view.
        </motion.p>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={onViewMovie}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-genesis-600 to-neon-purple text-white font-semibold text-lg shadow-lg shadow-genesis-900/40 hover:shadow-genesis-800/60 transition-shadow"
        >
          View Your Movie
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-4 text-sm text-gray-500"
        >
          Redirecting in {countdown}s...
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Page Component ─────────────────────────────────────────────────── */

export default function RenderProgressPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const projectId = params.id as string;
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // For dev, use a simple token from session
  const token = useMemo(() => {
    if (session?.user?.id) {
      return session.user.id;
    }
    return null;
  }, [session]);

  const {
    isConnected,
    overallProgress,
    currentStage,
    projectStatus,
    shots,
    activityLog,
    eta,
    error,
  } = useRenderSocket(projectId, token);

  // Compute pipeline stage statuses
  const currentStageIndex = getStageIndex(currentStage);
  const stageStatuses = PIPELINE_STAGES.map((_, i) => {
    if (i < currentStageIndex) return "complete" as const;
    if (i === currentStageIndex) return "active" as const;
    return "pending" as const;
  });

  // Shot array sorted by ID
  const shotArray = useMemo(
    () =>
      Array.from(shots.values()).sort((a, b) =>
        a.shotId.localeCompare(b.shotId),
      ),
    [shots],
  );

  // Auto-scroll activity log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop =
        logContainerRef.current.scrollHeight;
    }
  }, [activityLog]);

  // Handle completion
  useEffect(() => {
    if (projectStatus === "completed" && overallProgress >= 100) {
      const timer = setTimeout(() => setShowCompletion(true), 500);
      return () => clearTimeout(timer);
    }
  }, [projectStatus, overallProgress]);

  // Countdown on completion
  useEffect(() => {
    if (!showCompletion) return;
    if (countdown <= 0) {
      router.push(`/projects/${projectId}`);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [showCompletion, countdown, router, projectId]);

  const handleViewMovie = () => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <>
      {/* Completion overlay */}
      <AnimatePresence>
        {showCompletion && (
          <CompletionOverlay
            onViewMovie={handleViewMovie}
            countdown={countdown}
          />
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="min-h-screen bg-gradient-to-b from-surface via-surface-raised to-surface relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-genesis-800/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-2xl font-heading font-bold text-white">
                Rendering Your Movie
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Project {projectId}
              </p>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
              />
              <span className="text-xs text-gray-400">
                {isConnected ? "Live" : "Disconnected"}
              </span>
            </div>
          </motion.div>

          {/* Main grid: Progress + Pipeline | Shot Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ─── Left Column: Progress + Pipeline ─── */}
            <div className="lg:col-span-4 space-y-6">
              {/* Circular progress card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-surface-raised/80 backdrop-blur-sm rounded-2xl border border-surface-border p-6 flex flex-col items-center"
              >
                <CircularProgress progress={overallProgress} />

                <motion.p
                  key={currentStage}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-sm font-medium text-genesis-300 text-center"
                >
                  {currentStage}
                </motion.p>

                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  {eta && (
                    <span>
                      ETA:{" "}
                      <span className="text-gray-300">{eta}</span>
                    </span>
                  )}
                  <span>
                    Status:{" "}
                    <span
                      className={
                        projectStatus === "completed"
                          ? "text-green-400"
                          : projectStatus === "failed"
                            ? "text-red-400"
                            : "text-genesis-400"
                      }
                    >
                      {projectStatus}
                    </span>
                  </span>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 w-full px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/30 text-xs text-red-400"
                  >
                    {error}
                  </motion.div>
                )}
              </motion.div>

              {/* Pipeline stages */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-surface-raised/80 backdrop-blur-sm rounded-2xl border border-surface-border p-5"
              >
                <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                  Pipeline
                </h3>
                <div className="space-y-1.5">
                  {PIPELINE_STAGES.map((stage, i) => (
                    <PipelineStage
                      key={stage.id}
                      stage={stage}
                      status={stageStatuses[i]}
                      index={i}
                    />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ─── Right Column: Shot Grid + Activity Log ─── */}
            <div className="lg:col-span-8 space-y-6">
              {/* Shot grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-surface-raised/80 backdrop-blur-sm rounded-2xl border border-surface-border p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Shots
                  </h3>
                  <span className="text-xs text-gray-500">
                    {shotArray.filter((s) => s.status === "complete").length}/
                    {shotArray.length} complete
                  </span>
                </div>

                {shotArray.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-surface-border border-t-genesis-500 animate-spin" />
                    Waiting for shots...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    <AnimatePresence mode="popLayout">
                      {shotArray.map((shot) => (
                        <ShotCard key={shot.shotId} shot={shot} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>

              {/* Activity log */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-surface-raised/80 backdrop-blur-sm rounded-2xl border border-surface-border p-5"
              >
                <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                  Activity Log
                </h3>
                <div
                  ref={logContainerRef}
                  className="h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-surface-border scrollbar-track-transparent"
                >
                  {activityLog.length === 0 ? (
                    <p className="text-sm text-gray-600 py-4 text-center">
                      No activity yet...
                    </p>
                  ) : (
                    activityLog.map((entry) => (
                      <LogEntry key={entry.id} entry={entry} />
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
