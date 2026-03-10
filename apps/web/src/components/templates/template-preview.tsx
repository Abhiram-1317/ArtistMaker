"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@genesis/ui";
import type { TemplateData } from "@/lib/templates-data";
import { TEMPLATE_CATEGORIES, genreIcons } from "@/lib/templates-data";
import { useRouter } from "next/navigation";

/* ── Icons ────────────────────────────────────────────────────────────────── */

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function FilmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5" />
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

/* ── Props ────────────────────────────────────────────────────────────────── */

interface TemplatePreviewProps {
  template: TemplateData;
  onClose: () => void;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function TemplatePreview({ template, onClose }: TemplatePreviewProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState(template.name);

  const characters = (template.characterTemplates as Array<Record<string, unknown>>) ?? [];
  const scenes = (template.sceneTemplates as Array<Record<string, unknown>>) ?? [];
  const settings = (template.settingsTemplate as Record<string, unknown>) ?? {};
  const categoryInfo = TEMPLATE_CATEGORIES.find((c) => c.value === template.category);

  async function handleUseTemplate() {
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/templates/${template.id}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: projectTitle }),
      });
      if (res.ok) {
        const { data } = await res.json();
        router.push(`/dashboard/projects/${data.id}`);
      } else {
        setError("Failed to create project. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-surface-elevated shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-surface-elevated/95 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{categoryInfo?.icon}</span>
              <div>
                <h2 className="font-heading text-lg font-bold text-white">{template.name}</h2>
                <p className="text-xs text-gray-500">{categoryInfo?.label}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <XIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Preview image area */}
            <div className="aspect-video rounded-xl bg-surface border border-surface-border overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-genesis-950/40 to-neon-pink/5 flex items-center justify-center">
                <span className="text-6xl opacity-20">
                  {template.genre ? genreIcons[template.genre] ?? "🎬" : categoryInfo?.icon ?? "📋"}
                </span>
              </div>
              {/* Meta badges */}
              <div className="absolute bottom-3 left-3 flex gap-2">
                {template.genre && (
                  <Badge variant="info">
                    {genreIcons[template.genre]} {template.genre.replace("_", " ")}
                  </Badge>
                )}
                {template.isPremium && (
                  <Badge variant="warning">PRO</Badge>
                )}
              </div>
              <div className="absolute bottom-3 right-3 flex gap-2">
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-xs text-white">
                  <StarIcon className="w-3 h-3 text-amber-400" /> {template.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-xs text-white">
                  {template.usageCount.toLocaleString()} uses
                </span>
              </div>
            </div>

            {/* Description */}
            {template.description && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Description</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{template.description}</p>
              </div>
            )}

            {/* Prompt */}
            {template.promptTemplate && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Story Prompt</h3>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-sm text-gray-300 italic leading-relaxed">&ldquo;{template.promptTemplate}&rdquo;</p>
                </div>
              </div>
            )}

            {/* Characters */}
            {characters.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-genesis-400" />
                  Characters ({characters.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {characters.map((char, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-sm font-medium text-white">{String(char.name ?? "")}</p>
                      {typeof char.description === "string" && char.description && (
                        <p className="text-xs text-gray-500 mt-1">{char.description}</p>
                      )}
                      {Array.isArray(char.personalityTraits) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(char.personalityTraits as string[]).slice(0, 4).map((trait) => (
                            <span key={trait} className="px-1.5 py-0.5 rounded text-[10px] bg-genesis-500/10 text-genesis-400">
                              {trait}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scenes */}
            {scenes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <FilmIcon className="w-4 h-4 text-genesis-400" />
                  Scenes ({scenes.length})
                </h3>
                <div className="space-y-2">
                  {scenes.map((scene, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-genesis-600/20 text-genesis-400 text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{String(scene.title ?? "")}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          {typeof scene.timeOfDay === "string" && <span>{scene.timeOfDay.replace("_", " ")}</span>}
                          {typeof scene.mood === "string" && (
                            <>
                              <span>&middot;</span>
                              <span>{scene.mood}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings */}
            {Object.keys(settings).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Settings</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {typeof settings.resolution === "string" && (
                    <div className="p-2.5 rounded-lg bg-white/5 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Resolution</p>
                      <p className="text-sm font-medium text-white mt-0.5">{settings.resolution}</p>
                    </div>
                  )}
                  {typeof settings.fps === "number" && (
                    <div className="p-2.5 rounded-lg bg-white/5 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">FPS</p>
                      <p className="text-sm font-medium text-white mt-0.5">{settings.fps}</p>
                    </div>
                  )}
                  {typeof settings.aspectRatio === "string" && (
                    <div className="p-2.5 rounded-lg bg-white/5 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Aspect Ratio</p>
                      <p className="text-sm font-medium text-white mt-0.5">{settings.aspectRatio}</p>
                    </div>
                  )}
                  {typeof settings.duration === "number" && (
                    <div className="p-2.5 rounded-lg bg-white/5 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Duration</p>
                      <p className="text-sm font-medium text-white mt-0.5">{settings.duration}s</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {template.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-lg text-xs bg-white/5 text-gray-400">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Customize section */}
            <div className="border-t border-white/5 pt-6">
              <h3 className="text-sm font-semibold text-white mb-3">Customize & Create</h3>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Project Title</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-genesis-500/40 transition-all"
                  placeholder="Enter project title..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 border-t border-white/5 bg-surface-elevated/95 backdrop-blur-sm">
            {error && (
              <p className="text-xs text-red-400 mb-3">{error}</p>
            )}
            <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleUseTemplate}
              disabled={isCreating || !projectTitle.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-genesis-600 to-genesis-500 text-white text-sm font-medium hover:from-genesis-500 hover:to-genesis-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-genesis-500/20"
            >
              <RocketIcon className="w-4 h-4" />
              {isCreating ? "Creating..." : "Use Template"}
            </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
