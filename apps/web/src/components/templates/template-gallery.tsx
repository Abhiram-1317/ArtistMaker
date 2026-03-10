"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Badge } from "@genesis/ui";
import type { TemplateData, TemplateCategory } from "@/lib/templates-data";
import { TEMPLATE_CATEGORIES, genreIcons } from "@/lib/templates-data";
import { TemplatePreview } from "./template-preview";

/* ── Animation variants ───────────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

/* ── Icons ────────────────────────────────────────────────────────────────── */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return filled ? (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function FireIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
    </svg>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l3-9 6 6 6-6 3 9H3zm0 0h18v2H3v-2z" />
    </svg>
  );
}

/* ── Props ────────────────────────────────────────────────────────────────── */

interface TemplateGalleryProps {
  templates: TemplateData[];
  title?: string;
  showFilters?: boolean;
  showSearch?: boolean;
  columns?: 2 | 3 | 4;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function TemplateGallery({
  templates,
  title = "Template Gallery",
  showFilters = true,
  showSearch = true,
  columns = 3,
}: TemplateGalleryProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "newest">("popular");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateData | null>(null);

  const filtered = useMemo(() => {
    let result = [...templates];

    if (activeCategory !== "ALL") {
      result = result.filter((t) => t.category === activeCategory);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q)),
      );
    }

    if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "newest") {
      result.reverse();
    } else {
      result.sort((a, b) => b.usageCount - a.usageCount);
    }

    return result;
  }, [templates, activeCategory, search, sortBy]);

  const gridCols =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 4
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-heading text-xl font-bold text-white">{title}</h2>

        {showSearch && (
          <div className="relative max-w-xs w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-genesis-500/40 focus:border-genesis-500/40 transition-all"
            />
          </div>
        )}
      </div>

      {/* Category filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCategory === "ALL"
                ? "bg-genesis-600/30 text-genesis-300 ring-1 ring-genesis-500/40"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            All Templates
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeCategory === cat.value
                  ? "bg-genesis-600/30 text-genesis-300 ring-1 ring-genesis-500/40"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Sort by:</span>
        {(["popular", "rating", "newest"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              sortBy === s
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {s === "popular" ? "Most Popular" : s === "rating" ? "Top Rated" : "Newest"}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-600">{filtered.length} templates</span>
      </div>

      {/* Grid */}
      <motion.div
        className={`grid ${gridCols} gap-4`}
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((template) => (
            <motion.div
              key={template.id}
              variants={fadeUp}
              layout
              transition={{ duration: 0.3 }}
              className="group glass-hover cursor-pointer relative overflow-hidden"
              onClick={() => setPreviewTemplate(template)}
            >
              {/* Preview area */}
              <div className="aspect-[16/10] rounded-xl bg-surface border border-surface-border mb-3 overflow-hidden relative">
                {template.previewUrl ? (
                  <Image
                    src={template.previewUrl}
                    alt={template.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-genesis-950/40 to-neon-pink/5 flex items-center justify-center">
                    <span className="text-4xl opacity-30 group-hover:opacity-50 transition-opacity">
                      {template.genre ? genreIcons[template.genre] ?? "🎬" : TEMPLATE_CATEGORIES.find((c) => c.value === template.category)?.icon ?? "📋"}
                    </span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {template.isPremium && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-semibold backdrop-blur-sm">
                      <CrownIcon className="w-3 h-3" /> PRO
                    </span>
                  )}
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="default">
                    {TEMPLATE_CATEGORIES.find((c) => c.value === template.category)?.label ?? template.category}
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <h3 className="font-medium text-white group-hover:text-genesis-300 transition-colors truncate text-sm">
                {template.name}
              </h3>
              {template.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {template.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FireIcon className="w-3 h-3 text-orange-400" />
                  {template.usageCount.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <StarIcon className="w-3 h-3 text-amber-400" filled />
                  {template.rating.toFixed(1)}
                </span>
                {template.genre && (
                  <>
                    <span>&middot;</span>
                    <span className="flex items-center gap-1">
                      {genreIcons[template.genre]} {template.genre.replace("_", " ")}
                    </span>
                  </>
                )}
              </div>

              {/* Tags */}
              {template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-gray-500">
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-gray-500">
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-genesis-500/30 transition-colors pointer-events-none" />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="glass p-12 text-center rounded-2xl">
          <SearchIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No templates found</p>
          <p className="text-gray-600 text-sm mt-1">Try adjusting your filters or search terms</p>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}
