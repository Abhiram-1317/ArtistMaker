"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@genesis/ui";

/* ── Style presets ───────────────────────────────────────────────────────── */

const STYLE_PRESETS = [
  {
    id: "photorealistic",
    name: "Photorealistic Cinematic",
    description:
      "Ultra-realistic visuals with dramatic lighting, shallow depth of field, and a Hollywood blockbuster feel.",
    emoji: "🎬",
    gradient: "from-amber-500/20 via-orange-600/10 to-transparent",
    border: "border-amber-500/40",
    ring: "ring-amber-500/30",
    glow: "shadow-amber-500/20",
    color: "text-amber-300",
    preview: "/previews/photorealistic.mp4",
  },
  {
    id: "ghibli",
    name: "Studio Ghibli Anime",
    description:
      "Hand-painted watercolor backgrounds, expressive characters, and lush pastoral landscapes inspired by Miyazaki.",
    emoji: "🌿",
    gradient: "from-emerald-500/20 via-green-600/10 to-transparent",
    border: "border-emerald-500/40",
    ring: "ring-emerald-500/30",
    glow: "shadow-emerald-500/20",
    color: "text-emerald-300",
    preview: "/previews/ghibli.mp4",
  },
  {
    id: "pixar",
    name: "Pixar 3D Animation",
    description:
      "Polished 3D rendering with vibrant colors, expressive character design, and Pixar-quality lighting.",
    emoji: "🧸",
    gradient: "from-blue-500/20 via-indigo-600/10 to-transparent",
    border: "border-blue-500/40",
    ring: "ring-blue-500/30",
    glow: "shadow-blue-500/20",
    color: "text-blue-300",
    preview: "/previews/pixar.mp4",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    description:
      "Neon-drenched dystopian cityscapes, holographic UI elements, and a dark futuristic atmosphere.",
    emoji: "🌆",
    gradient: "from-fuchsia-500/20 via-pink-600/10 to-transparent",
    border: "border-fuchsia-500/40",
    ring: "ring-fuchsia-500/30",
    glow: "shadow-fuchsia-500/20",
    color: "text-fuchsia-300",
    preview: "/previews/cyberpunk.mp4",
  },
  {
    id: "fantasy-painting",
    name: "Fantasy Painting",
    description:
      "Rich oil-painting textures, epic compositions, and a grand mythological art style reminiscent of classic fantasy.",
    emoji: "🏰",
    gradient: "from-violet-500/20 via-purple-600/10 to-transparent",
    border: "border-violet-500/40",
    ring: "ring-violet-500/30",
    glow: "shadow-violet-500/20",
    color: "text-violet-300",
    preview: "/previews/fantasy.mp4",
  },
  {
    id: "noir",
    name: "Film Noir Black & White",
    description:
      "High-contrast monochrome cinematography with dramatic shadows, venetian blinds, and 1940s atmosphere.",
    emoji: "🕵️",
    gradient: "from-gray-400/20 via-gray-600/10 to-transparent",
    border: "border-gray-400/40",
    ring: "ring-gray-400/30",
    glow: "shadow-gray-400/20",
    color: "text-gray-300",
    preview: "/previews/noir.mp4",
  },
  {
    id: "retro-80s",
    name: "Retro 80s",
    description:
      "Synthwave color palettes, chrome text, grid landscapes, and VHS-inspired analog warmth.",
    emoji: "📼",
    gradient: "from-pink-500/20 via-cyan-600/10 to-transparent",
    border: "border-pink-500/40",
    ring: "ring-pink-500/30",
    glow: "shadow-pink-500/20",
    color: "text-pink-300",
    preview: "/previews/retro.mp4",
  },
  {
    id: "watercolor",
    name: "Watercolor Dreams",
    description:
      "Soft, flowing watercolor washes with delicate ink outlines and a gentle, storybook atmosphere.",
    emoji: "🎨",
    gradient: "from-sky-500/20 via-teal-600/10 to-transparent",
    border: "border-sky-500/40",
    ring: "ring-sky-500/30",
    glow: "shadow-sky-500/20",
    color: "text-sky-300",
    preview: "/previews/watercolor.mp4",
  },
] as const;

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

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

/* ── Style card sub-component ────────────────────────────────────────── */

function StyleCard({
  style,
  isSelected,
  onSelect,
}: {
  style: (typeof STYLE_PRESETS)[number];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    videoRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.97 }}
      className={`group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer text-left ${
        isSelected
          ? "bg-genesis-600/15 border-genesis-500/60 ring-2 ring-genesis-500/30 shadow-lg shadow-genesis-500/10"
          : `bg-surface-raised border-surface-border hover:border-white/20 hover:shadow-xl ${style.glow}`
      }`}
      style={{
        transform: isHovered && !isSelected ? "scale(1.02)" : undefined,
      }}
    >
      {/* Video / preview area */}
      <div className="relative w-full aspect-video overflow-hidden bg-black/40">
        {/* Gradient placeholder background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-60`} />

        {/* Centered emoji when not hovered */}
        <AnimatePresence>
          {!isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="text-5xl sm:text-6xl drop-shadow-lg">{style.emoji}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mock video element (hidden until preview assets exist) */}
        <video
          ref={videoRef}
          src={style.preview}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
        />

        {/* Hover play overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <PlayIcon className="w-6 h-6 text-white ml-0.5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected checkmark */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-genesis-500 flex items-center justify-center shadow-lg shadow-genesis-500/40 z-10"
          >
            <CheckIcon className="w-4 h-4 text-white" />
          </motion.div>
        )}

        {/* Hover border glow */}
        {isHovered && !isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 rounded-2xl ring-2 pointer-events-none ${style.ring}`}
          />
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex-1 flex flex-col gap-1.5">
        <h3
          className={`font-semibold text-sm sm:text-base transition-colors duration-200 ${
            isSelected ? "text-genesis-300" : "text-white group-hover:text-white"
          }`}
        >
          {style.name}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-400 transition-colors leading-relaxed line-clamp-2">
          {style.description}
        </p>
      </div>
    </motion.button>
  );
}

/* ── Main step component ─────────────────────────────────────────────── */

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export interface StepStyleData {
  style: string;
}

interface StepStyleProps {
  initialData: StepStyleData;
  onNext: (data: StepStyleData) => void;
  onBack: () => void;
}

export function StepStyle({ initialData, onNext, onBack }: StepStyleProps) {
  const [selectedStyle, setSelectedStyle] = useState(initialData.style);

  const isValid = selectedStyle.length > 0;

  const handleNext = () => {
    if (isValid) {
      onNext({ style: selectedStyle });
    }
  };

  return (
    <motion.div
      key="step-style"
      variants={stagger}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      {/* Heading */}
      <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="text-center">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2">
          Choose your visual style
        </h2>
        <p className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto">
          Select the art direction for your movie. Each style defines the look, lighting, and atmosphere of every frame.
        </p>
      </motion.div>

      {/* Style grid */}
      <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {STYLE_PRESETS.map((style) => (
            <StyleCard
              key={style.id}
              style={style}
              isSelected={selectedStyle === style.id}
              onSelect={() =>
                setSelectedStyle((prev) => (prev === style.id ? "" : style.id))
              }
            />
          ))}
        </div>
      </motion.div>

      {/* Selected indicator */}
      <AnimatePresence>
        {isValid && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-genesis-600/15 border border-genesis-500/30 text-sm text-genesis-300">
              <CheckIcon className="w-3.5 h-3.5" />
              {STYLE_PRESETS.find((s) => s.id === selectedStyle)?.name} selected
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
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
          disabled={!isValid}
          onClick={handleNext}
          iconRight={<ArrowRightIcon className="w-4 h-4" />}
          className="min-w-[200px]"
        >
          Next: Characters
        </Button>
      </motion.div>
    </motion.div>
  );
}
