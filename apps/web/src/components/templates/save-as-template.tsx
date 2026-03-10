"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TEMPLATE_CATEGORIES } from "@/lib/templates-data";
import type { TemplateCategory } from "@/lib/templates-data";

/* ── Icons ────────────────────────────────────────────────────────────────── */

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  );
}

/* ── Props ────────────────────────────────────────────────────────────────── */

interface SaveAsTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  projectData?: {
    title?: string;
    description?: string;
    genre?: string;
    stylePreset?: string;
    characters?: Array<Record<string, unknown>>;
    scenes?: Array<Record<string, unknown>>;
    settings?: Record<string, unknown>;
  };
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function SaveAsTemplate({ isOpen, onClose, projectData }: SaveAsTemplateProps) {
  const [name, setName] = useState(projectData?.title ?? "");
  const [description, setDescription] = useState(projectData?.description ?? "");
  const [category, setCategory] = useState<TemplateCategory>("STORY_STARTER");
  const [tagsInput, setTagsInput] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          description: description.trim() || undefined,
          promptTemplate: projectData?.description,
          genre: projectData?.genre,
          stylePreset: projectData?.stylePreset,
          characterTemplates: projectData?.characters,
          sceneTemplates: projectData?.scenes,
          settingsTemplate: projectData?.settings,
          isPublic,
          tags,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setError(null);
        setTimeout(() => {
          onClose();
          setSaved(false);
        }, 1500);
      } else {
        setError("Failed to save template. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) return null;

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
          className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-surface-elevated shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-genesis-600/20">
                <BookmarkIcon className="w-5 h-5 text-genesis-400" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-white">Save as Template</h2>
                <p className="text-xs text-gray-500">Create a reusable template from this project</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <XIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {saved ? (
            <div className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="text-5xl mb-4"
              >
                ✅
              </motion.div>
              <p className="text-white font-medium">Template saved successfully!</p>
            </div>
          ) : (
            <>
              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Template Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-genesis-500/40 transition-all"
                    placeholder="My awesome template..."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-genesis-500/40 transition-all resize-none"
                    placeholder="Describe what this template is about..."
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                          category === cat.value
                            ? "bg-genesis-600/30 text-genesis-300 ring-1 ring-genesis-500/40"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-genesis-500/40 transition-all"
                    placeholder="action, sci-fi, chase..."
                  />
                </div>

                {/* Public toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">Share publicly</p>
                    <p className="text-xs text-gray-500">Let others discover and use your template</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPublic ? "bg-genesis-600" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        isPublic ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Included items summary */}
                {projectData && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs font-medium text-gray-400 mb-1.5">Will include:</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      {projectData.description && <span className="px-2 py-0.5 rounded bg-white/5">Story prompt</span>}
                      {projectData.genre && <span className="px-2 py-0.5 rounded bg-white/5">Genre: {projectData.genre}</span>}
                      {projectData.characters && projectData.characters.length > 0 && (
                        <span className="px-2 py-0.5 rounded bg-white/5">{projectData.characters.length} characters</span>
                      )}
                      {projectData.scenes && projectData.scenes.length > 0 && (
                        <span className="px-2 py-0.5 rounded bg-white/5">{projectData.scenes.length} scenes</span>
                      )}
                      {projectData.settings && <span className="px-2 py-0.5 rounded bg-white/5">Settings</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/5">
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
                  onClick={handleSave}
                  disabled={isSaving || !name.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-genesis-600 to-genesis-500 text-white text-sm font-medium hover:from-genesis-500 hover:to-genesis-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-genesis-500/20"
                >
                  <BookmarkIcon className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save Template"}
                </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
