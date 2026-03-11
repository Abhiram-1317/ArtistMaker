"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

/* ── Types ───────────────────────────────────────────────────────────────── */

interface GeneratedItem {
  id: string;
  type: "image" | "video" | "movie";
  url: string;
  prompt: string;
  createdAt: Date;
  isKeyframeOnly?: boolean;
  projectId?: string;
  jobId?: string;
  jobStatus?: string;
  progress?: number;
}

/* ── Tab Button ──────────────────────────────────────────────────────────── */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-6 py-3 text-sm font-medium rounded-lg transition-all ${
        active
          ? "text-white"
          : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-genesis-600/30 border border-genesis-500/40 rounded-lg"
          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function GeneratePage() {
  const [mode, setMode] = useState<"image" | "video" | "movie">("image");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gallery, setGallery] = useState<GeneratedItem[]>([]);
  const [progress, setProgress] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollMovieStatus = (projectId: string, itemId: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate/movie?projectId=${projectId}`);
        if (!res.ok) return;
        const data = await res.json();

        setGallery((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  jobStatus: data.status,
                  progress: data.progress ?? 0,
                  url: data.result?.finalVideoPath || item.url,
                }
              : item,
          ),
        );

        if (data.status === "completed" || data.status === "failed") {
          stopPolling();
        }
      } catch {
        // ignore poll errors
      }
    }, 3000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError("");
    stopPolling();

    const modeLabels = {
      image: "Generating image with FLUX.1-schnell...",
      video: "Generating video (image + Ken Burns motion)...",
      movie: "Queuing full AI movie generation...",
    };
    setProgress(modeLabels[mode]);

    try {
      abortRef.current = new AbortController();

      if (mode === "movie") {
        // Full AI pipeline via API → Bull queue → AI Worker
        const res = await fetch("/api/generate/movie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt.trim(), style: "cinematic" }),
          signal: abortRef.current.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Movie generation failed");
          return;
        }

        const itemId = `gen-${Date.now()}`;
        const newItem: GeneratedItem = {
          id: itemId,
          type: "movie",
          url: "",
          prompt: prompt.trim(),
          createdAt: new Date(),
          projectId: data.projectId,
          jobId: data.jobId,
          jobStatus: "queued",
          progress: 0,
        };

        setGallery((prev) => [newItem, ...prev]);
        setProgress(`Movie queued! Estimated: ${data.estimatedTime}`);

        // Start polling for status
        pollMovieStatus(data.projectId, itemId);
      } else {
        // Direct HuggingFace generation (image or Ken Burns video)
        const endpoint =
          mode === "image" ? "/api/generate/image" : "/api/generate/video";
        const body =
          mode === "image"
            ? { prompt: prompt.trim(), width: 1024, height: 1024 }
            : { prompt: prompt.trim(), numFrames: 24, fps: 8 };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Generation failed");
          return;
        }

        const newItem: GeneratedItem = {
          id: `gen-${Date.now()}`,
          type: data.isKeyframeOnly ? "image" : mode,
          url: data.imageUrl || data.videoUrl,
          prompt: prompt.trim(),
          createdAt: new Date(),
          isKeyframeOnly: data.isKeyframeOnly,
        };

        setGallery((prev) => [newItem, ...prev]);
      }

      setProgress("");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Generation failed. Check your connection and try again.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-6xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">
          AI Generate
        </h1>
        <p className="text-gray-400">
          Create real images and videos using AI. Powered by HuggingFace FLUX.1-schnell.
        </p>
      </motion.div>

      {/* ── Mode Tabs ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 p-1 bg-surface-raised rounded-xl border border-surface-border w-fit">
        <TabButton active={mode === "image"} onClick={() => setMode("image")}>
          🖼️ Image
        </TabButton>
        <TabButton active={mode === "video"} onClick={() => setMode("video")}>
          🎬 Video
        </TabButton>
        <TabButton active={mode === "movie"} onClick={() => setMode("movie")}>
          🎥 Movie
        </TabButton>
      </div>

      {/* ── Prompt Input ───────────────────────────────────────────────── */}
      <motion.div
        layout
        className="mb-8 p-6 bg-surface-raised rounded-2xl border border-surface-border"
      >
        <label className="block text-sm font-medium text-gray-300 mb-3">
          {mode === "image"
            ? "Describe the image you want"
            : mode === "video"
              ? "Describe the video scene"
              : "Describe your movie scene (uses full AI pipeline)"}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            mode === "image"
              ? "A futuristic city skyline at sunset, neon lights reflecting on wet streets, cinematic 4K..."
              : mode === "video"
                ? "A slow camera pan across a misty forest at dawn, golden light filtering through ancient trees..."
                : "A detective walks through a rain-soaked neon city at night, investigating a mysterious disappearance..."
          }
          rows={3}
          className="w-full px-4 py-3 bg-surface border border-surface-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-genesis-500 focus:ring-1 focus:ring-genesis-500 resize-none transition-all"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
        />

        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-gray-500">
            {mode === "image"
              ? "1024×1024 PNG • ~10s generation time"
              : mode === "video"
                ? "1024×576 MP4 • ~15s generation time"
                : "Full AI pipeline • characters + shots + audio + composition"}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className={`px-8 py-3 rounded-xl font-medium text-sm transition-all ${
              loading || !prompt.trim()
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-genesis-600 to-genesis-500 text-white hover:from-genesis-500 hover:to-genesis-400 shadow-lg shadow-genesis-600/20 hover:shadow-genesis-500/30"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {mode === "movie" ? "Queuing..." : "Generating..."}
              </span>
            ) : (
              `Generate ${mode === "image" ? "Image" : mode === "video" ? "Video" : "Movie"}`
            )}
          </button>
        </div>

        {/* Progress message */}
        <AnimatePresence>
          {progress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex items-center gap-3 p-3 bg-genesis-900/30 border border-genesis-700/30 rounded-lg"
            >
              <div className="w-5 h-5 rounded-full border-2 border-genesis-500 border-t-transparent animate-spin flex-shrink-0" />
              <span className="text-sm text-genesis-300">{progress}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 bg-red-900/30 border border-red-700/30 rounded-lg text-sm text-red-300"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Gallery ────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-heading font-semibold text-white mb-4">
          Generated ({gallery.length})
        </h2>

        {gallery.length === 0 ? (
          <div className="text-center py-20 bg-surface-raised rounded-2xl border border-surface-border">
            <div className="text-5xl mb-4">
              {mode === "image" ? "🖼️" : "🎬"}
            </div>
            <p className="text-gray-400 text-lg">
              No generations yet. Enter a prompt and click Generate!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {gallery.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-surface-raised rounded-2xl border border-surface-border overflow-hidden group"
                >
                  {/* Media */}
                  <div className="relative aspect-square bg-black">
                    {item.type === "video" ? (
                      <video
                        src={item.url}
                        controls
                        loop
                        className="w-full h-full object-contain"
                      />
                    ) : item.type === "movie" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                        <div className="text-4xl mb-3">
                          {item.jobStatus === "completed"
                            ? "✅"
                            : item.jobStatus === "failed"
                              ? "❌"
                              : "🎥"}
                        </div>
                        <p className="text-white font-medium mb-1 text-sm">
                          {item.jobStatus === "completed"
                            ? "Movie Complete"
                            : item.jobStatus === "failed"
                              ? "Generation Failed"
                              : item.jobStatus === "active"
                                ? "Generating..."
                                : "Queued"}
                        </p>
                        {item.progress !== undefined &&
                          item.jobStatus !== "completed" &&
                          item.jobStatus !== "failed" && (
                            <div className="w-full max-w-[200px] mt-2">
                              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-genesis-500 rounded-full transition-all duration-500"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                {item.progress}%
                              </p>
                            </div>
                          )}
                        {item.jobId && (
                          <p className="text-xs text-gray-600 mt-2">
                            Job: {item.jobId}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Image
                        src={item.url}
                        alt={item.prompt}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    )}

                    {/* Type badge */}
                    <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-xs font-medium text-white border border-white/10">
                      {item.type === "movie"
                        ? "🎥 Movie"
                        : item.type === "video"
                          ? "🎬 Video"
                          : "🖼️ Image"}
                      {item.isKeyframeOnly && " (Keyframe)"}
                    </div>

                    {/* Download button */}
                    <a
                      href={item.url}
                      download
                      className="absolute top-3 right-3 p-2 bg-black/70 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 hover:bg-white/20"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </a>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {item.prompt}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {item.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
