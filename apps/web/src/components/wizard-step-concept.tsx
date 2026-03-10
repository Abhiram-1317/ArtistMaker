"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { Button } from "@genesis/ui";

/* ── Validation ──────────────────────────────────────────────────────────── */

export const conceptSchema = z.object({
  prompt: z
    .string()
    .min(20, "Your concept needs at least 20 characters to get started")
    .max(2000, "Please keep your concept under 2,000 characters"),
  genre: z.string().min(1, "Please select a genre for your movie"),
});

export type ConceptData = z.infer<typeof conceptSchema>;

/* ── Genre data ──────────────────────────────────────────────────────────── */

const GENRES = [
  { id: "ACTION", emoji: "💥", name: "Action" },
  { id: "DRAMA", emoji: "🎭", name: "Drama" },
  { id: "SCI_FI", emoji: "🚀", name: "Sci-Fi" },
  { id: "FANTASY", emoji: "🏰", name: "Fantasy" },
  { id: "HORROR", emoji: "👻", name: "Horror" },
  { id: "COMEDY", emoji: "😄", name: "Comedy" },
  { id: "ROMANCE", emoji: "💕", name: "Romance" },
  { id: "THRILLER", emoji: "🔍", name: "Thriller" },
  { id: "ANIMATION", emoji: "✨", name: "Animation" },
] as const;

/* ── Inspiration prompts ─────────────────────────────────────────────────── */

const INSPIRATIONS = [
  {
    label: "🚀 Space Explorer",
    prompt:
      "A lone astronaut discovers an ancient alien civilization frozen beneath Europa's ice shelf. As she decodes their technology, she realizes they didn't die — they chose to sleep, and her arrival has triggered the wake-up sequence.",
    genre: "SCI_FI",
  },
  {
    label: "⚔️ Medieval Quest",
    prompt:
      "A blacksmith's apprentice finds a blade that whispers the names of the fallen. With a kingdom crumbling under a tyrant's rule, she must forge alliances across warring territories and uncover an ancient prophecy hidden in the steel itself.",
    genre: "FANTASY",
  },
  {
    label: "🌃 Future Noir",
    prompt:
      "In 2087 Neo-Tokyo, a retired detective with cybernetic implants takes one last case: a missing AI therapist whose patients are all dreaming the same nightmare. The deeper he digs, the more his own memories start to glitch.",
    genre: "THRILLER",
  },
  {
    label: "🌊 Ocean Mystery",
    prompt:
      "A marine biologist on a deep-sea research station detects an impossible signal emanating from the Mariana Trench — a structured melody that matches no known species. When she descends to investigate, she finds structures that predate human civilization.",
    genre: "SCI_FI",
  },
  {
    label: "🎭 Family Drama",
    prompt:
      "Three estranged siblings converge on their childhood farmhouse when their mother's will reveals a secret fourth sibling no one knew about. Over one tense weekend, buried resentments surface alongside a family mystery spanning decades.",
    genre: "DRAMA",
  },
  {
    label: "😈 Haunted Studio",
    prompt:
      "A struggling filmmaker rents a legendary Hollywood studio lot where three directors died under mysterious circumstances. As her crew begins shooting, the film cameras capture things that no one on set can see — until it's too late.",
    genre: "HORROR",
  },
] as const;

/* ── Animation variants ──────────────────────────────────────────────────── */

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
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

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

/* ── Component ───────────────────────────────────────────────────────────── */

interface StepConceptProps {
  initialData: ConceptData;
  onNext: (data: ConceptData) => void;
  onBack: () => void;
}

export function StepConcept({ initialData, onNext, onBack }: StepConceptProps) {
  const [prompt, setPrompt] = useState(initialData.prompt);
  const [genre, setGenre] = useState(initialData.genre);
  const [errors, setErrors] = useState<Partial<Record<keyof ConceptData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ConceptData, boolean>>>({});

  const charCount = prompt.length;
  const charColor =
    charCount === 0
      ? "text-gray-600"
      : charCount < 20
        ? "text-amber-400"
        : charCount > 2000
          ? "text-red-400"
          : "text-gray-400";

  const validate = useCallback(() => {
    const result = conceptSchema.safeParse({ prompt, genre });
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors: Partial<Record<keyof ConceptData, string>> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof ConceptData;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    setErrors(fieldErrors);
    return false;
  }, [prompt, genre]);

  const isValid = useMemo(() => {
    return conceptSchema.safeParse({ prompt, genre }).success;
  }, [prompt, genre]);

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    if (touched.prompt) {
      const result = conceptSchema.shape.prompt.safeParse(value);
      if (result.success) {
        setErrors((prev) => ({ ...prev, prompt: undefined }));
      } else {
        setErrors((prev) => ({ ...prev, prompt: result.error.issues[0]?.message }));
      }
    }
  };

  const handleGenreSelect = (id: string) => {
    setGenre(id);
    setTouched((prev) => ({ ...prev, genre: true }));
    setErrors((prev) => ({ ...prev, genre: undefined }));
  };

  const handleInspirationClick = (inspiration: (typeof INSPIRATIONS)[number]) => {
    setPrompt(inspiration.prompt);
    setGenre(inspiration.genre);
    setTouched({ prompt: true, genre: true });
    setErrors({});
  };

  const handleNext = () => {
    setTouched({ prompt: true, genre: true });
    if (validate()) {
      onNext({ prompt, genre });
    }
  };

  return (
    <motion.div
      key="step-concept"
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
          What&apos;s your movie about?
        </h2>
        <p className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto">
          Describe your story concept. Be as creative and detailed as you like — our AI will bring it to life.
        </p>
      </motion.div>

      {/* Prompt textarea */}
      <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, prompt: true }));
              if (touched.prompt) validate();
            }}
            rows={6}
            maxLength={2000}
            placeholder="A retired detective in 2087 Tokyo discovers an underground network of AI-generated dreams being sold on the black market. When the dreams start bleeding into reality, she must navigate a world where the line between memory and fiction has been erased..."
            className={`w-full px-5 py-4 rounded-2xl bg-surface-raised border text-gray-100 placeholder:text-gray-600 text-sm sm:text-base leading-relaxed resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface ${
              errors.prompt && touched.prompt
                ? "border-red-500/60 focus:ring-red-500/50"
                : "border-surface-border focus:ring-genesis-500/50 focus:border-genesis-500"
            }`}
          />
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="min-h-[1.25rem]">
              {errors.prompt && touched.prompt && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {errors.prompt}
                </motion.p>
              )}
            </div>
            <span className={`text-xs font-mono tabular-nums ${charColor}`}>
              {charCount.toLocaleString()} / 2,000
            </span>
          </div>
        </div>
      </motion.div>

      {/* Genre selection */}
      <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-300">Choose a genre</label>
          {errors.genre && touched.genre && (
            <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-red-400">
              {errors.genre}
            </motion.span>
          )}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2 sm:gap-3">
          {GENRES.map((g) => {
            const isSelected = genre === g.id;
            return (
              <motion.button
                key={g.id}
                type="button"
                onClick={() => handleGenreSelect(g.id)}
                whileTap={{ scale: 0.95 }}
                className={`relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer group ${
                  isSelected
                    ? "bg-genesis-600/15 border-genesis-500/60 ring-2 ring-genesis-500/30 shadow-lg shadow-genesis-500/10"
                    : "bg-surface-raised border-surface-border hover:bg-white/[0.04] hover:border-white/[0.1]"
                }`}
              >
                <span className={`text-xl sm:text-2xl transition-transform duration-200 ${isSelected ? "scale-110" : "group-hover:scale-105"}`}>
                  {g.emoji}
                </span>
                <span className={`text-xs font-medium transition-colors ${isSelected ? "text-genesis-300" : "text-gray-400 group-hover:text-gray-300"}`}>
                  {g.name}
                </span>
                {isSelected && (
                  <motion.div
                    layoutId="genre-selected"
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-genesis-500 flex items-center justify-center"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Inspiration */}
      <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-2 mb-3">
          <SparklesIcon className="w-4 h-4 text-genesis-400" />
          <span className="text-sm font-medium text-gray-300">Need inspiration?</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {INSPIRATIONS.map((insp) => (
            <motion.button
              key={insp.label}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleInspirationClick(insp)}
              className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-raised border border-surface-border hover:bg-white/[0.04] hover:border-genesis-700/50 transition-all duration-200 text-left"
            >
              <span className="text-sm whitespace-nowrap">{insp.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.div variants={fadeUp} transition={{ duration: 0.35 }} className="flex items-center justify-between pt-4 border-t border-surface-border">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>
        <Button size="lg" disabled={!isValid} onClick={handleNext} iconRight={<ArrowRightIcon className="w-4 h-4" />} className="min-w-[200px]">
          Next: Choose Style
        </Button>
      </motion.div>
    </motion.div>
  );
}
