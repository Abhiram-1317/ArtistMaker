"use client";

import { motion } from "framer-motion";

/* ── Step definitions ────────────────────────────────────────────────────── */

export const WIZARD_STEPS = [
  { id: "concept", label: "Concept", icon: "💡" },
  { id: "style", label: "Style", icon: "🎨" },
  { id: "characters", label: "Characters", icon: "👥" },
  { id: "settings", label: "Settings", icon: "⚙️" },
  { id: "review", label: "Review", icon: "✅" },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

/* ── Component ───────────────────────────────────────────────────────────── */

interface WizardProgressProps {
  currentStep: number; // 0-indexed
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  const progress = (currentStep / (WIZARD_STEPS.length - 1)) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step dots + labels */}
      <div className="relative flex items-center justify-between">
        {/* Background track */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-surface-border" />

        {/* Active track */}
        <motion.div
          className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-genesis-600 to-genesis-400"
          initial={{ width: "0%" }}
          animate={{
            width: `${progress}%`,
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ maxWidth: "calc(100% - 2rem)" }}
        />

        {/* Step circles */}
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center gap-1 sm:gap-2"
            >
              {/* Circle */}
              <motion.div
                className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-colors duration-300 ${
                  isCompleted
                    ? "bg-genesis-600 border-genesis-600 text-white"
                    : isCurrent
                      ? "bg-genesis-600/20 border-genesis-500 text-genesis-400 ring-4 ring-genesis-500/20"
                      : "bg-surface-raised border-surface-border text-gray-600"
                }`}
                initial={false}
                animate={
                  isCurrent
                    ? { scale: [1, 1.1, 1] }
                    : { scale: 1 }
                }
                transition={
                  isCurrent
                    ? { duration: 0.4, ease: "easeOut" }
                    : { duration: 0.2 }
                }
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </motion.div>

              {/* Label */}
              <span
                className={`text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors duration-300 hidden xs:block ${
                  isCompleted
                    ? "text-genesis-400"
                    : isCurrent
                      ? "text-white"
                      : "text-gray-600"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
