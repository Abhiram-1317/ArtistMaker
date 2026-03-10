"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Badge, Spinner } from "@genesis/ui";
import type { Character } from "./wizard-step-characters";
import type { StepSettingsData } from "./wizard-step-settings";

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface ReviewData {
  prompt: string;
  genre: string;
  style: string;
  characters: Character[];
  settings: StepSettingsData;
}

/* ── Constants ───────────────────────────────────────────────────────────── */

const MOCK_CREDIT_BALANCE = 50;

const GENRE_MAP: Record<string, { emoji: string; name: string }> = {
  ACTION: { emoji: "💥", name: "Action" },
  DRAMA: { emoji: "🎭", name: "Drama" },
  SCI_FI: { emoji: "🚀", name: "Sci-Fi" },
  FANTASY: { emoji: "🏰", name: "Fantasy" },
  HORROR: { emoji: "👻", name: "Horror" },
  COMEDY: { emoji: "😄", name: "Comedy" },
  ROMANCE: { emoji: "💕", name: "Romance" },
  THRILLER: { emoji: "🔍", name: "Thriller" },
  ANIMATION: { emoji: "✨", name: "Animation" },
};

const STYLE_MAP: Record<string, { emoji: string; name: string; color: string }> = {
  photorealistic: { emoji: "🎬", name: "Photorealistic Cinematic", color: "text-amber-300" },
  ghibli: { emoji: "🌿", name: "Studio Ghibli Anime", color: "text-emerald-300" },
  pixar: { emoji: "🧸", name: "Pixar 3D Animation", color: "text-blue-300" },
  cyberpunk: { emoji: "🌆", name: "Cyberpunk Neon", color: "text-fuchsia-300" },
  "fantasy-painting": { emoji: "🏰", name: "Fantasy Painting", color: "text-violet-300" },
  noir: { emoji: "🕵️", name: "Film Noir Black & White", color: "text-gray-300" },
  "retro-80s": { emoji: "📼", name: "Retro 80s", color: "text-pink-300" },
  watercolor: { emoji: "🎨", name: "Watercolor Dreams", color: "text-sky-300" },
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function estimateCost(settings: {
  duration: number;
  resolution: string;
  frameRate: string;
  bgMusic: boolean;
  soundEffects: boolean;
}): { credits: number; timeMinutes: number } {
  const resMultiplier = settings.resolution === "4K" ? 5 : settings.resolution === "1080p" ? 2 : 1;
  const fpsMultiplier = settings.frameRate === "60fps" ? 1.5 : settings.frameRate === "30fps" ? 1.1 : 1;
  const audioMultiplier = (settings.bgMusic ? 1.15 : 1) * (settings.soundEffects ? 1.1 : 1);

  const baseCredits = Math.ceil(settings.duration / 15);
  const credits = Math.ceil(baseCredits * resMultiplier * fpsMultiplier * audioMultiplier);

  const baseTime = settings.duration * 0.3;
  const timeMinutes = Math.ceil(baseTime * resMultiplier * fpsMultiplier * 0.5);

  return { credits, timeMinutes };
}

/* ── Animation variants ──────────────────────────────────────────────────── */

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

/* ── Icons ───────────────────────────────────────────────────────────────── */

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
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

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function CreditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function SectionCard({
  icon,
  title,
  stepIndex,
  onEdit,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  stepIndex: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised overflow-hidden">
      <div className="px-5 py-3.5 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
        </div>
        <button
          type="button"
          onClick={() => onEdit(stepIndex)}
          className="flex items-center gap-1.5 text-xs font-medium text-genesis-400 hover:text-genesis-300 transition-colors"
        >
          <PencilIcon className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 text-left w-full group"
    >
      <div
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
          checked
            ? "bg-genesis-600 border-genesis-500"
            : "bg-surface border-surface-border group-hover:border-genesis-500/50"
        }`}
      >
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <CheckIcon className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div>
        <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
          {label}
        </span>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </button>
  );
}

/* ── Loading overlay ─────────────────────────────────────────────────────── */

function CreationOverlay({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="text-center space-y-6"
      >
        <div className="relative mx-auto w-20 h-20">
          <Spinner size={80} className="w-20 h-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">🎬</span>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{message}</h3>
          <p className="text-sm text-gray-400">This may take a moment...</p>
        </div>
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-genesis-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Step Component ─────────────────────────────────────────────────── */

interface StepReviewProps {
  data: ReviewData;
  onEdit: (step: number) => void;
  onBack: () => void;
  onSubmit: () => Promise<void>;
}

export function StepReview({ data, onEdit, onBack, onSubmit }: StepReviewProps) {
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rightsAccepted, setRightsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Cost ────────────────────────────────────────────────────── */
  const cost = useMemo(
    () => estimateCost(data.settings),
    [data.settings],
  );

  const insufficientCredits = cost.credits > MOCK_CREDIT_BALANCE;
  const newBalance = MOCK_CREDIT_BALANCE - cost.credits;
  const lowBalance = newBalance >= 0 && newBalance < 10;

  /* ── Derived data ───────────────────────────────────────────── */
  const genre = GENRE_MAP[data.genre] ?? { emoji: "🎬", name: data.genre };
  const style = STYLE_MAP[data.style] ?? { emoji: "🎨", name: data.style, color: "text-gray-300" };

  /* ── Validation ─────────────────────────────────────────────── */
  const canSubmit = termsAccepted && rightsAccepted && !insufficientCredits && !submitting;

  /* ── Submit ─────────────────────────────────────────────────── */
  const handleGenerate = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  /* ── Prompt preview ─────────────────────────────────────────── */
  const promptPreview = data.prompt.length > 150 && !promptExpanded
    ? data.prompt.slice(0, 150) + "..."
    : data.prompt;

  return (
    <>
      {/* Creation overlay */}
      <AnimatePresence>
        {submitting && <CreationOverlay message="Setting up your movie..." />}
      </AnimatePresence>

      <motion.div
        key="step-review"
        variants={stagger}
        initial="initial"
        animate="animate"
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        {/* ── Heading ──────────────────────────────────────────── */}
        <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2">
            Review your movie
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto">
            Everything looks good? Hit generate to bring your vision to life
          </p>
        </motion.div>

        {/* ── Project title ────────────────────────────────────── */}
        <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Project Title</p>
            <h3 className="text-xl font-bold text-white">
              {data.settings.title || "Untitled Movie"}
            </h3>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════ *
         *  SUMMARY CARDS
         * ══════════════════════════════════════════════════════ */}

        {/* A. Story Concept */}
        <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
          <SectionCard
            icon={<span className="text-base">💡</span>}
            title="Story Concept"
            stepIndex={0}
            onEdit={onEdit}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="info">{genre.emoji} {genre.name}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {promptPreview}
                </p>
                {data.prompt.length > 150 && (
                  <button
                    type="button"
                    onClick={() => setPromptExpanded(!promptExpanded)}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-genesis-400 hover:text-genesis-300 transition-colors"
                  >
                    <ChevronDownIcon
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        promptExpanded ? "rotate-180" : ""
                      }`}
                    />
                    {promptExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* B. Visual Style */}
        <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
          <SectionCard
            icon={<span className="text-base">🎨</span>}
            title="Visual Style"
            stepIndex={1}
            onEdit={onEdit}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-2xl border border-surface-border">
                {style.emoji}
              </div>
              <div>
                <p className={`text-sm font-semibold ${style.color}`}>{style.name}</p>
                <p className="text-xs text-gray-500">Visual style preset</p>
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* C. Characters */}
        <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
          <SectionCard
            icon={<span className="text-base">👥</span>}
            title="Characters"
            stepIndex={2}
            onEdit={onEdit}
          >
            {data.characters.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No characters defined — AI will auto-generate</p>
            ) : (
              <div className="space-y-3">
                {data.characters.map((char) => (
                  <div key={char.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-genesis-600/20 border border-genesis-500/30 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-genesis-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{char.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {[char.age, char.build, char.traits.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </motion.div>

        {/* D. Settings */}
        <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
          <SectionCard
            icon={<span className="text-base">⚙️</span>}
            title="Settings"
            stepIndex={3}
            onEdit={onEdit}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <SettingPill label="Duration" value={formatDuration(data.settings.duration)} />
              <SettingPill label="Aspect Ratio" value={data.settings.aspectRatio} />
              <SettingPill label="Resolution" value={data.settings.resolution} />
              <SettingPill label="Frame Rate" value={data.settings.frameRate} />
              <SettingPill label="Color Grading" value={data.settings.colorGrading.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} />
              <SettingPill label="Music" value={data.settings.bgMusic ? "On" : "Off"} />
              <SettingPill label="Sound FX" value={data.settings.soundEffects ? "On" : "Off"} />
            </div>
          </SectionCard>
        </motion.div>

        {/* ══════════════════════════════════════════════════════ *
         *  CREDIT CONFIRMATION
         * ══════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
          <div className="rounded-2xl border border-surface-border bg-surface-raised overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
              <CreditIcon className="w-4 h-4 text-genesis-400" />
              <h3 className="text-sm font-semibold text-gray-300">Credit Summary</h3>
            </div>

            <div className="p-5 space-y-4">
              {/* Grid stats */}
              <div className="grid grid-cols-1 xs:grid-cols-3 gap-4">
                {/* Total cost */}
                <div className="text-center p-4 rounded-xl bg-surface border border-surface-border">
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <SparklesIcon className="w-4 h-4 text-genesis-400" />
                    <span className="text-xs text-gray-500">Total Cost</span>
                  </div>
                  <p className="text-2xl font-bold text-white tabular-nums">{cost.credits}</p>
                  <p className="text-xs text-gray-500 mt-0.5">credits</p>
                </div>

                {/* Current balance */}
                <div className="text-center p-4 rounded-xl bg-surface border border-surface-border">
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <CreditIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-gray-500">Balance</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400 tabular-nums">{MOCK_CREDIT_BALANCE}</p>
                  <p className="text-xs text-gray-500 mt-0.5">credits</p>
                </div>

                {/* New balance */}
                <div className="text-center p-4 rounded-xl bg-surface border border-surface-border">
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <ClockIcon className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-500">After</span>
                  </div>
                  <p className={`text-2xl font-bold tabular-nums ${
                    insufficientCredits ? "text-red-400" : lowBalance ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {insufficientCredits ? "—" : newBalance}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">credits</p>
                </div>
              </div>

              {/* Est. generation time */}
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-400">
                <ClockIcon className="w-4 h-4" />
                <span>Estimated generation time: <strong className="text-white">
                  {cost.timeMinutes < 60
                    ? `${cost.timeMinutes} min`
                    : `${Math.floor(cost.timeMinutes / 60)}h ${cost.timeMinutes % 60}m`}
                </strong></span>
              </div>

              {/* Warnings */}
              <AnimatePresence>
                {insufficientCredits && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
                      <WarningIcon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-300">Insufficient Credits</p>
                        <p className="text-xs text-red-400/80 mt-0.5">
                          You need {cost.credits - MOCK_CREDIT_BALANCE} more credits.
                          Lower quality settings or purchase more credits to continue.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                {lowBalance && !insufficientCredits && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <WarningIcon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-300">Low Balance Warning</p>
                        <p className="text-xs text-amber-400/80 mt-0.5">
                          After this generation you&apos;ll have {newBalance} credits remaining.
                          Consider topping up your balance.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════ *
         *  TERMS ACCEPTANCE
         * ══════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
          <div className="rounded-2xl border border-surface-border bg-surface-raised p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheckIcon className="w-4 h-4 text-genesis-400" />
              <h3 className="text-sm font-semibold text-gray-300">Agreements</h3>
            </div>

            <Checkbox
              checked={termsAccepted}
              onChange={setTermsAccepted}
              label="I agree to the Terms of Service"
              description="By proceeding, you accept our content generation terms and usage policies."
            />
            <Checkbox
              checked={rightsAccepted}
              onChange={setRightsAccepted}
              label="This is my original content or I have rights to use it"
              description="You confirm that your concept, characters, and references don't infringe on third-party rights."
            />
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════ *
         *  ERROR TOAST
         * ══════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <WarningIcon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-300">Creation failed</p>
                  <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════ *
         *  NAVIGATION / GENERATE BUTTON
         * ══════════════════════════════════════════════════════ */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-surface-border"
        >
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Settings
          </button>

          <div className="flex items-center gap-3">
            {insufficientCredits ? (
              <Button
                size="lg"
                className="min-w-[220px]"
                onClick={() => {
                  /* placeholder: redirect to purchase page */
                }}
              >
                Buy Credits
              </Button>
            ) : (
              <Button
                size="lg"
                disabled={!canSubmit}
                loading={submitting}
                onClick={handleGenerate}
                className="min-w-[220px]"
              >
                {submitting ? "Creating..." : "Generate My Movie 🎬"}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

/* ── Tiny helper ─────────────────────────────────────────────────────────── */

function SettingPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-surface border border-surface-border text-center">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-white capitalize">{value}</p>
    </div>
  );
}
