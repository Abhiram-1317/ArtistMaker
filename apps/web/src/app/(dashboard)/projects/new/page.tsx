"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useToast } from "@genesis/ui";
import { WizardProgress } from "@/components/wizard-progress";
import { StepConcept, type ConceptData } from "@/components/wizard-step-concept";
import { StepStyle, type StepStyleData } from "@/components/wizard-step-style";
import { StepCharacters, type StepCharactersData, type Character } from "@/components/wizard-step-characters";
import { StepSettings, type StepSettingsData } from "@/components/wizard-step-settings";
import { StepReview } from "@/components/wizard-step-review";

/* ── Shared wizard state ─────────────────────────────────────────────────── */

interface WizardData {
  prompt: string;
  genre: string;
  style: string;
  characters: Character[];
  settings: StepSettingsData;
}

const STEP_LABELS = ["Step 1 of 5", "Step 2 of 5", "Step 3 of 5", "Step 4 of 5", "Step 5 of 5"];

/* ── Animation ───────────────────────────────────────────────────────────── */

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -24 },
};

/* ── Icons ───────────────────────────────────────────────────────────────── */

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

/* ── Page component ──────────────────────────────────────────────────────── */

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    prompt: "",
    genre: "",
    style: "",
    characters: [],
    settings: {
      title: "",
      duration: 30,
      aspectRatio: "16:9",
      resolution: "1080p",
      frameRate: "24fps",
      cameraIntensity: 40,
      colorGrading: "neutral",
      bgMusic: true,
      soundEffects: true,
    },
  });

  /* ── Step handlers ─────────────────────────────────────────── */

  const handleConceptNext = (data: ConceptData) => {
    setWizardData((prev) => ({ ...prev, ...data }));
    setCurrentStep(1);
  };

  const handleStyleNext = (data: StepStyleData) => {
    setWizardData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleCharactersNext = (data: StepCharactersData) => {
    setWizardData((prev) => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleSkipCharacters = () => {
    setCurrentStep(3);
  };

  const handleSettingsNext = (data: StepSettingsData) => {
    setWizardData((prev) => ({ ...prev, settings: data }));
    setCurrentStep(4);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleEdit = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: wizardData.prompt,
        genre: wizardData.genre,
        style: wizardData.style,
        characters: wizardData.characters,
        settings: wizardData.settings,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error || "Failed to create project. Please try again.";
      toast({ variant: "error", title: "Creation failed", description: message });
      throw new Error(message);
    }

    const data = await res.json();
    toast({ variant: "success", title: "Project created!", description: `"${data.project.title}" is being set up.` });
    router.push(`/dashboard`);
  };

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 sm:px-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-overlay transition-colors touch-target"
          aria-label="Back to dashboard"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-lg sm:text-xl font-bold text-white">Create New Movie</h1>
          <p className="text-xs sm:text-sm text-gray-500">{STEP_LABELS[currentStep]}</p>
        </div>
      </div>

      {/* ── Progress ────────────────────────────────────────────── */}
      <div className="mb-6 sm:mb-10">
        <WizardProgress currentStep={currentStep} />
      </div>

      {/* ── Step content ────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {currentStep === 0 && (
          <StepConcept
            key="step-concept"
            initialData={{ prompt: wizardData.prompt, genre: wizardData.genre }}
            onNext={handleConceptNext}
            onBack={() => {
              window.location.href = "/dashboard";
            }}
          />
        )}

        {currentStep === 1 && (
          <StepStyle
            key="step-style"
            initialData={{ style: wizardData.style }}
            onNext={handleStyleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 2 && (
          <StepCharacters
            key="step-characters"
            initialData={{ characters: wizardData.characters }}
            prompt={wizardData.prompt}
            genre={wizardData.genre}
            onNext={handleCharactersNext}
            onBack={handleBack}
            onSkip={handleSkipCharacters}
          />
        )}

        {currentStep === 3 && (
          <StepSettings
            key="step-settings"
            initialData={wizardData.settings}
            prompt={wizardData.prompt}
            onNext={handleSettingsNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <StepReview
            key="step-review"
            data={wizardData}
            onEdit={handleEdit}
            onBack={handleBack}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
