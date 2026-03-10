"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input, Badge } from "@genesis/ui";

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface StepSettingsData {
  title: string;
  duration: number;
  aspectRatio: string;
  resolution: string;
  frameRate: string;
  cameraIntensity: number;
  colorGrading: string;
  bgMusic: boolean;
  soundEffects: boolean;
}

/* ── Constants ───────────────────────────────────────────────────────────── */

const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9", desc: "Standard", icon: "📺" },
  { id: "9:16", label: "9:16", desc: "Vertical / TikTok", icon: "📱" },
  { id: "1:1", label: "1:1", desc: "Square / Instagram", icon: "⬜" },
  { id: "21:9", label: "21:9", desc: "Cinematic", icon: "🎬" },
] as const;

const RESOLUTIONS = [
  { id: "720p", label: "720p", desc: "Fast, lower cost", credits: 1, pro: false },
  { id: "1080p", label: "1080p", desc: "Recommended", credits: 2, pro: false },
  { id: "4K", label: "4K", desc: "Pro only", credits: 5, pro: true },
] as const;

const FRAME_RATES = [
  { id: "24fps", label: "24 fps", desc: "Cinematic", pro: false },
  { id: "30fps", label: "30 fps", desc: "Smooth", pro: false },
  { id: "60fps", label: "60 fps", desc: "Pro only", pro: true },
] as const;

const COLOR_GRADING = [
  { id: "neutral", label: "Neutral" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
  { id: "vintage", label: "Vintage" },
  { id: "desaturated", label: "Desaturated" },
  { id: "high-contrast", label: "High Contrast" },
  { id: "teal-orange", label: "Teal & Orange" },
  { id: "noir", label: "Film Noir" },
] as const;

const MOCK_CREDIT_BALANCE = 50;

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

  const baseTime = settings.duration * 0.3; // ~0.3 min per second of video
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

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
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

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
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

function CreditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" />
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

/* ── Sub-components ──────────────────────────────────────────────────────── */

function SectionHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 ${className ?? ""}`}>
      {children}
    </h3>
  );
}

function OptionCard({
  selected,
  onClick,
  disabled,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-xl border p-3 sm:p-4 text-left transition-all duration-200 ${
        disabled
          ? "opacity-50 cursor-not-allowed border-surface-border bg-surface-raised"
          : selected
            ? "border-genesis-500/50 bg-genesis-600/10 ring-1 ring-genesis-500/30"
            : "border-surface-border bg-surface-raised hover:border-white/15 hover:bg-white/[0.03]"
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold text-amber-300 uppercase tracking-wide">
      <LockIcon className="w-2.5 h-2.5" />
      Pro
    </span>
  );
}

function ToggleSwitch({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="flex items-center justify-between w-full p-4 rounded-xl border border-surface-border bg-surface-raised hover:border-white/15 transition-all duration-200"
    >
      <div className="text-left">
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          enabled ? "bg-genesis-600" : "bg-surface-overlay"
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}

/* ── Main Step Component ─────────────────────────────────────────────────── */

interface StepSettingsProps {
  initialData: StepSettingsData;
  prompt: string;
  onNext: (data: StepSettingsData) => void;
  onBack: () => void;
}

export function StepSettings({ initialData, prompt, onNext, onBack }: StepSettingsProps) {
  const [settings, setSettings] = useState<StepSettingsData>(() => ({
    ...initialData,
    title: initialData.title || generateTitle(prompt),
  }));
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const update = useCallback(
    <K extends keyof StepSettingsData>(key: K, value: StepSettingsData[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  /* ── Cost estimate ──────────────────────────────────────────── */
  const cost = useMemo(
    () =>
      estimateCost({
        duration: settings.duration,
        resolution: settings.resolution,
        frameRate: settings.frameRate,
        bgMusic: settings.bgMusic,
        soundEffects: settings.soundEffects,
      }),
    [settings.duration, settings.resolution, settings.frameRate, settings.bgMusic, settings.soundEffects],
  );

  const insufficientCredits = cost.credits > MOCK_CREDIT_BALANCE;

  /* ── Duration slider marks ──────────────────────────────────── */
  const durationMarks = [15, 30, 60, 120, 180, 300];
  const durationPercent = ((settings.duration - 15) / (300 - 15)) * 100;

  /* ── Validation ─────────────────────────────────────────────── */
  const isValid = settings.title.trim().length >= 2;

  const handleNext = () => {
    if (!isValid) return;
    onNext({ ...settings, title: settings.title.trim() });
  };

  return (
    <motion.div
      key="step-settings"
      variants={stagger}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      {/* ── Heading ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="text-center">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2">
          Configure your movie
        </h2>
        <p className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto">
          Fine-tune the technical settings and review the estimated cost
        </p>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════ *
       *  A. BASIC SETTINGS
       * ══════════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
        <SectionHeading>Basic Settings</SectionHeading>

        <div className="space-y-6">
          {/* Project title */}
          <div>
            <label htmlFor="project-title" className="block text-sm font-medium text-gray-300 mb-1.5">
              Project Title
            </label>
            <Input
              id="project-title"
              value={settings.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="My Untitled Movie"
              className="w-full"
            />
          </div>

          {/* Duration slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="duration-slider" className="text-sm font-medium text-gray-300">
                Duration
              </label>
              <span className="text-sm font-semibold text-genesis-300 tabular-nums">
                {formatDuration(settings.duration)}
              </span>
            </div>

            {/* Custom slider */}
            <div className="relative pt-1 pb-2">
              <input
                id="duration-slider"
                type="range"
                min={15}
                max={300}
                step={5}
                value={settings.duration}
                onChange={(e) => update("duration", Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-surface-overlay accent-genesis-500
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-genesis-400
                  [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-genesis-600
                  [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-genesis-500/30
                  [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-genesis-400
                  [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-genesis-600
                  [&::-moz-range-thumb]:shadow-lg"
                style={{
                  background: `linear-gradient(to right, rgb(var(--genesis-500)) 0%, rgb(var(--genesis-500)) ${durationPercent}%, rgb(var(--surface-overlay)) ${durationPercent}%, rgb(var(--surface-overlay)) 100%)`,
                }}
              />
              {/* Marks */}
              <div className="flex justify-between mt-1.5 px-0.5">
                {durationMarks.map((mark) => (
                  <button
                    type="button"
                    key={mark}
                    onClick={() => update("duration", mark)}
                    className={`text-[10px] tabular-nums transition-colors ${
                      settings.duration === mark ? "text-genesis-400 font-medium" : "text-gray-600 hover:text-gray-400"
                    }`}
                  >
                    {formatDuration(mark)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Aspect ratio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3">
              {ASPECT_RATIOS.map((ar) => (
                <OptionCard
                  key={ar.id}
                  selected={settings.aspectRatio === ar.id}
                  onClick={() => update("aspectRatio", ar.id)}
                >
                  <div className="text-center">
                    <span className="text-xl mb-1 block">{ar.icon}</span>
                    <p className="text-sm font-semibold text-white">{ar.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{ar.desc}</p>
                  </div>
                </OptionCard>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════ *
       *  B. QUALITY SETTINGS
       * ══════════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
        <SectionHeading>Quality Settings</SectionHeading>

        <div className="space-y-6">
          {/* Resolution */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Resolution
            </label>
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
              {RESOLUTIONS.map((res) => (
                <OptionCard
                  key={res.id}
                  selected={settings.resolution === res.id}
                  onClick={() => !res.pro && update("resolution", res.id)}
                  disabled={res.pro}
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <p className="text-sm font-semibold text-white">{res.label}</p>
                      {res.pro && <ProBadge />}
                    </div>
                    <p className="text-[11px] text-gray-500">{res.desc}</p>
                    {res.id === "1080p" && !res.pro && (
                      <Badge variant="success" className="mt-1.5 text-[10px]">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  {res.pro && (
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        className="text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2 decoration-amber-600 hover:decoration-amber-400 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          /* navigate to upgrade */
                        }}
                      >
                        Upgrade to Pro →
                      </button>
                    </div>
                  )}
                </OptionCard>
              ))}
            </div>
          </div>

          {/* Frame rate */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Frame Rate
            </label>
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
              {FRAME_RATES.map((fr) => (
                <OptionCard
                  key={fr.id}
                  selected={settings.frameRate === fr.id}
                  onClick={() => !fr.pro && update("frameRate", fr.id)}
                  disabled={fr.pro}
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <p className="text-sm font-semibold text-white">{fr.label}</p>
                      {fr.pro && <ProBadge />}
                    </div>
                    <p className="text-[11px] text-gray-500">{fr.desc}</p>
                  </div>
                  {fr.pro && (
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        className="text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2 decoration-amber-600 hover:decoration-amber-400 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          /* navigate to upgrade */
                        }}
                      >
                        Upgrade to Pro →
                      </button>
                    </div>
                  )}
                </OptionCard>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════ *
       *  C. ADVANCED SETTINGS (collapsible)
       * ══════════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
        <button
          type="button"
          onClick={() => setAdvancedOpen((prev) => !prev)}
          className="flex items-center justify-between w-full px-5 py-3.5 rounded-xl border border-surface-border bg-surface-raised hover:border-white/15 transition-all duration-200"
        >
          <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Advanced Settings
          </span>
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
              advancedOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {advancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                {/* Camera movement intensity */}
                <div className="p-4 rounded-xl border border-surface-border bg-surface-raised">
                  <div className="flex items-center justify-between mb-3">
                    <label htmlFor="camera-slider" className="text-sm font-medium text-gray-300">
                      Camera Movement
                    </label>
                    <span className="text-xs text-gray-500 tabular-nums">
                      {settings.cameraIntensity <= 20
                        ? "Static"
                        : settings.cameraIntensity <= 40
                          ? "Subtle"
                          : settings.cameraIntensity <= 60
                            ? "Moderate"
                            : settings.cameraIntensity <= 80
                              ? "Dynamic"
                              : "Intense"}
                    </span>
                  </div>
                  <input
                    id="camera-slider"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={settings.cameraIntensity}
                    onChange={(e) => update("cameraIntensity", Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-overlay accent-genesis-500
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-genesis-400
                      [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-genesis-600
                      [&::-webkit-slider-thumb]:shadow-md
                      [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                      [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-genesis-400
                      [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-genesis-600"
                  />
                  <div className="flex justify-between mt-1 text-[10px] text-gray-600">
                    <span>Static</span>
                    <span>Dynamic</span>
                  </div>
                </div>

                {/* Color grading */}
                <div className="p-4 rounded-xl border border-surface-border bg-surface-raised">
                  <label htmlFor="color-grading" className="block text-sm font-medium text-gray-300 mb-2">
                    Color Grading Preset
                  </label>
                  <select
                    id="color-grading"
                    value={settings.colorGrading}
                    onChange={(e) => update("colorGrading", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-surface-border text-gray-100 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-genesis-500/50 focus:border-genesis-500 appearance-none cursor-pointer"
                  >
                    {COLOR_GRADING.map((cg) => (
                      <option key={cg.id} value={cg.id} className="bg-[#12121a]">
                        {cg.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Audio toggles */}
                <ToggleSwitch
                  enabled={settings.bgMusic}
                  onChange={(val) => update("bgMusic", val)}
                  label="Background Music"
                  description="Auto-generate a soundtrack that matches the mood"
                />
                <ToggleSwitch
                  enabled={settings.soundEffects}
                  onChange={(val) => update("soundEffects", val)}
                  label="Sound Effects"
                  description="Add contextual sound effects to scenes"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════ *
       *  D. COST ESTIMATE
       * ══════════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
        <div className="rounded-2xl border border-surface-border bg-surface-raised overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-genesis-400" />
            <h3 className="text-sm font-semibold text-gray-300">Cost Estimate</h3>
          </div>

          <div className="p-5 grid grid-cols-1 xs:grid-cols-3 gap-4">
            {/* Credits needed */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <CreditIcon className="w-4 h-4 text-genesis-400" />
                <span className="text-xs text-gray-500">Credits Needed</span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{cost.credits}</p>
            </div>

            {/* Generation time */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ClockIcon className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-500">Est. Time</span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                {cost.timeMinutes < 60
                  ? `${cost.timeMinutes}m`
                  : `${Math.floor(cost.timeMinutes / 60)}h ${cost.timeMinutes % 60}m`}
              </p>
            </div>

            {/* Credit balance */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <CreditIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-gray-500">Balance</span>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${insufficientCredits ? "text-red-400" : "text-emerald-400"}`}>
                {MOCK_CREDIT_BALANCE}
              </p>
            </div>
          </div>

          {/* Insufficient credits warning */}
          <AnimatePresence>
            {insufficientCredits && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mx-5 mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <WarningIcon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-300">Insufficient Credits</p>
                    <p className="text-xs text-red-400/80 mt-0.5">
                      You need {cost.credits - MOCK_CREDIT_BALANCE} more credits. Lower quality settings or{" "}
                      <button
                        type="button"
                        className="text-red-300 underline underline-offset-2 hover:text-red-200 transition-colors"
                      >
                        purchase credits
                      </button>
                      .
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════ *
       *  NAVIGATION
       * ══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between pt-4 border-t border-surface-border"
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>

        <Button
          size="lg"
          disabled={!isValid || insufficientCredits}
          onClick={handleNext}
          iconRight={<ArrowRightIcon className="w-4 h-4" />}
          className="min-w-[200px]"
        >
          Review
        </Button>
      </motion.div>
    </motion.div>
  );
}

/* ── Title generator (mock) ──────────────────────────────────────────────── */

function generateTitle(prompt: string): string {
  if (!prompt || prompt.length < 10) return "Untitled Movie";

  // Extract a few key words from the prompt to create a title
  const words = prompt
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4);

  if (words.length === 0) return "Untitled Movie";

  // Capitalize first letter of each word
  const title = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return title;
}
