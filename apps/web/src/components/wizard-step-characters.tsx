"use client";

import { useState, useMemo, useId, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input, Modal, ModalContent, ModalClose } from "@genesis/ui";

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface Character {
  id: string;
  name: string;
  description: string;
  age: string;
  build: string;
  features: string;
  traits: string[];
  voice: string;
}

export interface StepCharactersData {
  characters: Character[];
}

/* ── Constants ───────────────────────────────────────────────────────────── */

const PERSONALITY_TRAITS = [
  "Brave",
  "Intelligent",
  "Mysterious",
  "Friendly",
  "Cold",
  "Witty",
  "Compassionate",
  "Ruthless",
  "Cunning",
  "Loyal",
  "Rebellious",
  "Stoic",
  "Charismatic",
  "Anxious",
  "Optimistic",
  "Cynical",
] as const;

const VOICE_OPTIONS = [
  { id: "deep-authoritative", label: "Deep & Authoritative" },
  { id: "warm-friendly", label: "Warm & Friendly" },
  { id: "young-energetic", label: "Young & Energetic" },
  { id: "raspy-weathered", label: "Raspy & Weathered" },
  { id: "soft-soothing", label: "Soft & Soothing" },
  { id: "sharp-commanding", label: "Sharp & Commanding" },
  { id: "playful-mischievous", label: "Playful & Mischievous" },
  { id: "monotone-robotic", label: "Monotone & Robotic" },
] as const;

const AGE_RANGES = [
  "Child (5-12)",
  "Teen (13-17)",
  "Young Adult (18-25)",
  "Adult (26-40)",
  "Middle-aged (41-60)",
  "Elder (60+)",
] as const;

/* ── Genre-based character templates ──────────────────────────────────────── */

const GENRE_CHARACTERS: Record<string, Array<{ name: string; description: string; age: string; build: string; features: string; traits: string[]; voice: string }>> = {
  SCI_FI: [
    { name: "Commander Reyes", description: "A decorated starship commander haunted by a first-contact mission gone wrong. Now leads humanity's most advanced vessel into unknown space.", age: "Adult (26-40)", build: "Athletic", features: "Cybernetic right eye implant, silver-streaked temples", traits: ["Brave", "Intelligent", "Stoic"], voice: "deep-authoritative" },
    { name: "ARIA-7", description: "The ship's AI who has begun exhibiting signs of emotional awareness. Questions the nature of consciousness while navigating crew dynamics.", age: "Young Adult (18-25)", build: "Slim", features: "Holographic projection with blue luminescent patterns", traits: ["Intelligent", "Curious", "Compassionate"], voice: "soft-soothing" },
    { name: "Dr. Kai Tanaka", description: "Chief science officer obsessed with proving parallel dimensions exist. Brilliant but reckless in the pursuit of discovery.", age: "Adult (26-40)", build: "Average", features: "Round spectacles, perpetually ink-stained hands", traits: ["Intelligent", "Rebellious", "Optimistic"], voice: "young-energetic" },
  ],
  FANTASY: [
    { name: "Elara Nightwhisper", description: "Last heir to a forgotten magical bloodline. Discovered her powers the night her village was razed by the Shadow Legion.", age: "Young Adult (18-25)", build: "Slim", features: "Violet eyes that glow when channeling magic, raven-black hair", traits: ["Brave", "Mysterious", "Rebellious"], voice: "young-energetic" },
    { name: "Thorne Ironhand", description: "A disgraced knight who broke his oath to save a child condemned by the crown. Wanders as a sellsword seeking redemption.", age: "Adult (26-40)", build: "Muscular", features: "Burn scars across left arm, a missing ring finger", traits: ["Loyal", "Stoic", "Compassionate"], voice: "raspy-weathered" },
    { name: "The Oracle of Dusk", description: "An ageless seer dwelling between realms of shadow and dream. Speaks in riddles yet always tells the truth.", age: "Elder (60+)", build: "Slim", features: "Milky-white blind eyes, intricate facial tattoos", traits: ["Mysterious", "Intelligent", "Cynical"], voice: "soft-soothing" },
  ],
  THRILLER: [
    { name: "Agent Sarah Cross", description: "Ex-CIA operative pulled back in for one last mission. Discovers the conspiracy leads to someone she trusted completely.", age: "Adult (26-40)", build: "Athletic", features: "Scar across left eyebrow, intense grey eyes", traits: ["Brave", "Cunning", "Anxious"], voice: "sharp-commanding" },
    { name: "Marcus Webb", description: "Tech billionaire whose prediction algorithm may have caused the very catastrophe he predicted. Running out of time to fix it.", age: "Adult (26-40)", build: "Average", features: "Always wears a smartwatch on each wrist, prematurely grey", traits: ["Intelligent", "Ruthless", "Charismatic"], voice: "warm-friendly" },
    { name: "Detective Rho", description: "Internal affairs investigator who realizes the corruption runs to the very top. Trusts no one but can't do it alone.", age: "Middle-aged (41-60)", build: "Heavy-set", features: "Deep frown lines, calloused knuckles", traits: ["Cynical", "Loyal", "Stoic"], voice: "raspy-weathered" },
  ],
  ACTION: [
    { name: "Zara Okafor", description: "Former special forces turned mercenary with a strict moral code. Never takes a job that harms civilians.", age: "Young Adult (18-25)", build: "Athletic", features: "Braided hair, tribal tattoo across shoulders", traits: ["Brave", "Loyal", "Rebellious"], voice: "sharp-commanding" },
    { name: "Viktor Kross", description: "Arms dealer turned reluctant ally. Knows every black market dealer on five continents but wants out of the game.", age: "Middle-aged (41-60)", build: "Muscular", features: "Gold tooth, sleeve tattoos, ever-present cigar", traits: ["Cunning", "Witty", "Cynical"], voice: "raspy-weathered" },
  ],
  HORROR: [
    { name: "Dr. Evelyn Marsh", description: "Parapsychologist who debunks hauntings — until she encounters one she cannot explain. The entity knows her name.", age: "Adult (26-40)", build: "Average", features: "Dark circles under eyes, always carries an EMF reader", traits: ["Intelligent", "Anxious", "Brave"], voice: "soft-soothing" },
    { name: "Tommy Novak", description: "A teenager who moved to the old house on the hill. Hears whispers through the walls that tell him things no one else knows.", age: "Teen (13-17)", build: "Slim", features: "Pale complexion, nervous habit of cracking knuckles", traits: ["Anxious", "Loyal", "Rebellious"], voice: "young-energetic" },
  ],
  DOCUMENTARY: [
    { name: "Narrator", description: "The guiding voice of the documentary. Weaves facts and personal anecdotes into a compelling narrative journey.", age: "Middle-aged (41-60)", build: "Average", features: "Distinguished appearance, warm smile", traits: ["Intelligent", "Compassionate", "Charismatic"], voice: "warm-friendly" },
    { name: "The Subject", description: "The central figure whose story drives the documentary. Complex, flawed, and utterly authentic.", age: "Adult (26-40)", build: "Average", features: "Expressive eyes, weathered hands from years of work", traits: ["Brave", "Stoic", "Optimistic"], voice: "raspy-weathered" },
  ],
  DRAMA: [
    { name: "Claire Beaumont", description: "A celebrated novelist facing writer's block after a family tragedy. Returns to her childhood home to find answers.", age: "Adult (26-40)", build: "Slim", features: "Graceful hands, reading glasses on a chain", traits: ["Intelligent", "Compassionate", "Anxious"], voice: "soft-soothing" },
    { name: "James Beaumont", description: "Claire's estranged brother who never left their hometown. Carries resentment but also a secret their mother entrusted to him alone.", age: "Adult (26-40)", build: "Average", features: "Flannel shirts, a worn wedding ring he still wears", traits: ["Loyal", "Cynical", "Stoic"], voice: "warm-friendly" },
  ],
  COMEDY: [
    { name: "Max Sterling", description: "Self-proclaimed 'life coach' whose own life is a spectacular disaster. Accidentally stumbles into genuinely helping people.", age: "Adult (26-40)", build: "Average", features: "Over-styled hair, questionable fashion choices", traits: ["Witty", "Charismatic", "Optimistic"], voice: "playful-mischievous" },
    { name: "Priya Sharma", description: "Max's long-suffering best friend and accountant who keeps getting dragged into increasingly absurd schemes.", age: "Young Adult (18-25)", build: "Petite", features: "Perpetual eye-roll expression, color-coded planner", traits: ["Intelligent", "Cynical", "Loyal"], voice: "sharp-commanding" },
  ],
  ROMANCE: [
    { name: "Luca Moretti", description: "A Tuscan vineyard owner who swore off love after a broken engagement. Meets someone who challenges every wall he built.", age: "Adult (26-40)", build: "Athletic", features: "Sun-kissed skin, warm brown eyes, paint-stained fingers", traits: ["Charismatic", "Stoic", "Compassionate"], voice: "warm-friendly" },
    { name: "Sophie Chen", description: "A travel writer on assignment who wasn't looking for love. Her deadline and her heart are both approaching fast.", age: "Young Adult (18-25)", build: "Average", features: "Freckled nose, always carries a leather journal", traits: ["Witty", "Rebellious", "Optimistic"], voice: "young-energetic" },
  ],
  ANIMATION: [
    { name: "Pip", description: "A small creature made of starlight who fell from the sky. Must find their way home before their glow fades forever.", age: "Child (5-12)", build: "Petite", features: "Luminous body, huge expressive eyes, tiny wings", traits: ["Brave", "Optimistic", "Friendly"], voice: "playful-mischievous" },
    { name: "Grumble", description: "An ancient stone guardian who hasn't moved in a thousand years. Reluctantly becomes Pip's protector and guide.", age: "Elder (60+)", build: "Heavy-set", features: "Moss-covered body, one cracked eye, rumbling voice", traits: ["Cynical", "Loyal", "Stoic"], voice: "deep-authoritative" },
  ],
  EXPERIMENTAL: [
    { name: "The Observer", description: "A narrative entity that exists between frames. Questions whether they are the character or the audience.", age: "Young Adult (18-25)", build: "Average", features: "Features shift and change, never quite in focus", traits: ["Mysterious", "Intelligent", "Anxious"], voice: "monotone-robotic" },
    { name: "Echo", description: "A reflection that has gained autonomy. Moves in reverse time, trying to communicate a warning.", age: "Young Adult (18-25)", build: "Slim", features: "Mirror-like skin, movements are slightly delayed", traits: ["Mysterious", "Brave", "Compassionate"], voice: "soft-soothing" },
  ],
};

/* ── Mock character extraction ───────────────────────────────────────────── */

interface SuggestedCharacter {
  name: string;
  description: string;
}

function extractCharactersFromPrompt(prompt: string): SuggestedCharacter[] {
  if (!prompt || prompt.length < 20) return [];

  const suggestions: SuggestedCharacter[] = [];

  // Pattern: "a/an/the [role/descriptor]" → extract character archetypes
  const rolePatterns = [
    { pattern: /\b(?:a|an|the)\s+(lone\s+)?astronaut\b/i, name: "The Astronaut", desc: "A space explorer venturing into the unknown" },
    { pattern: /\b(?:a|an|the)\s+detective\b/i, name: "The Detective", desc: "A sharp-minded investigator with a troubled past" },
    { pattern: /\b(?:a|an|the)\s+(?:blacksmith(?:'s)?\s+)?apprentice\b/i, name: "The Apprentice", desc: "A young student learning their craft" },
    { pattern: /\b(?:a|an|the)\s+marine\s+biologist\b/i, name: "The Biologist", desc: "A scientist fascinated by the ocean's mysteries" },
    { pattern: /\b(?:a|an|the)\s+filmmaker\b/i, name: "The Filmmaker", desc: "A creative visionary behind the camera" },
    { pattern: /\bsibling/i, name: "The Eldest Sibling", desc: "The responsible firstborn carrying family secrets" },
    { pattern: /\b(?:a|an|the)\s+(?:retired\s+)?(?:cop|officer|agent)\b/i, name: "The Agent", desc: "A seasoned operative pulled back into action" },
    { pattern: /\b(?:a|an|the)\s+(?:young\s+)?(?:woman|girl|heroine)\b/i, name: "The Heroine", desc: "A determined protagonist on a transformative journey" },
    { pattern: /\b(?:a|an|the)\s+(?:young\s+)?(?:man|boy|hero)\b/i, name: "The Hero", desc: "A courageous protagonist facing impossible odds" },
    { pattern: /\b(?:a|an|the)\s+(?:king|queen|ruler|tyrant)\b/i, name: "The Ruler", desc: "A powerful figure who commands from the throne" },
    { pattern: /\b(?:a|an|the)\s+scientist\b/i, name: "The Scientist", desc: "A brilliant mind pushing the boundaries of knowledge" },
    { pattern: /\b(?:a|an|the)\s+(?:AI|robot|android)\b/i, name: "The AI", desc: "An artificial intelligence grappling with consciousness" },
  ];

  for (const { pattern, name, desc } of rolePatterns) {
    if (pattern.test(prompt)) {
      suggestions.push({ name, description: desc });
    }
  }

  // Also search for proper nouns (capitalized words that could be names)
  const properNouns = prompt.match(/\b[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})?\b/g);
  if (properNouns) {
    const excludeWords = new Set([
      "The", "She", "Her", "His", "When", "With", "From", "Over", "Into",
      "They", "Their", "What", "Where", "How", "But", "And", "For", "Not",
      "This", "That", "Each", "Every", "Some", "All", "Tokyo", "Neo",
      "Europa", "Hollywood", "Mariana", "Trench",
    ]);
    for (const noun of properNouns) {
      if (!excludeWords.has(noun) && !suggestions.some((s) => s.name.includes(noun))) {
        suggestions.push({
          name: noun,
          description: `A character mentioned in your story concept`,
        });
      }
    }
  }

  return suggestions.slice(0, 6);
}

/* ── Animation variants ──────────────────────────────────────────────────── */

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const cardVariant = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
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

/* ── Character form modal ────────────────────────────────────────────────── */

const EMPTY_FORM: Omit<Character, "id"> = {
  name: "",
  description: "",
  age: "",
  build: "",
  features: "",
  traits: [],
  voice: "",
};

function CharacterFormModal({
  open,
  onOpenChange,
  onSave,
  editingCharacter,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (character: Character) => void;
  editingCharacter: Character | null;
}) {
  const formId = useId();
  const [form, setForm] = useState<Omit<Character, "id">>(
    editingCharacter ? { ...editingCharacter } : { ...EMPTY_FORM },
  );

  // Reset form whenever modal opens or the character being edited changes
  useEffect(() => {
    if (open) {
      setForm(editingCharacter ? { ...editingCharacter } : { ...EMPTY_FORM });
    }
  }, [open, editingCharacter]);

  // Reset form when modal opens with new data
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setForm(editingCharacter ? { ...editingCharacter } : { ...EMPTY_FORM });
    }
    onOpenChange(next);
  };

  const toggleTrait = (trait: string) => {
    setForm((prev) => ({
      ...prev,
      traits: prev.traits.includes(trait)
        ? prev.traits.filter((t) => t !== trait)
        : prev.traits.length < 5
          ? [...prev.traits, trait]
          : prev.traits,
    }));
  };

  const isValid = form.name.trim().length >= 2 && form.description.trim().length >= 5;

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      id: editingCharacter?.id ?? `char-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      features: form.features.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent
        title={editingCharacter ? "Edit Character" : "Add Character"}
        description="Define your character's identity, appearance, and personality."
        className="sm:max-w-xl"
      >
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor={`${formId}-name`} className="block text-sm font-medium text-gray-300 mb-1.5">
              Name <span className="text-red-400">*</span>
            </label>
            <Input
              id={`${formId}-name`}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Commander Reyes"
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor={`${formId}-desc`} className="block text-sm font-medium text-gray-300 mb-1.5">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id={`${formId}-desc`}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="A brief description of the character's role, backstory, or motivation..."
              className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-surface-border text-gray-100 placeholder:text-gray-600 text-sm leading-relaxed resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-genesis-500/50 focus:border-genesis-500"
            />
          </div>

          {/* Appearance row */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${formId}-age`} className="block text-sm font-medium text-gray-300 mb-1.5">
                Age Range
              </label>
              <select
                id={`${formId}-age`}
                value={form.age}
                onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-raised border border-surface-border text-gray-100 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-genesis-500/50 focus:border-genesis-500 appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#12121a]">Select age...</option>
                {AGE_RANGES.map((age) => (
                  <option key={age} value={age} className="bg-[#12121a]">{age}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${formId}-build`} className="block text-sm font-medium text-gray-300 mb-1.5">
                Build
              </label>
              <Input
                id={`${formId}-build`}
                value={form.build}
                onChange={(e) => setForm((p) => ({ ...p, build: e.target.value }))}
                placeholder="e.g. Athletic, Slender"
                className="w-full"
              />
            </div>
          </div>

          {/* Notable features */}
          <div>
            <label htmlFor={`${formId}-features`} className="block text-sm font-medium text-gray-300 mb-1.5">
              Notable Features
            </label>
            <Input
              id={`${formId}-features`}
              value={form.features}
              onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))}
              placeholder="e.g. Cybernetic left eye, scar across jaw"
              className="w-full"
            />
          </div>

          {/* Personality traits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Personality Traits
              </label>
              <span className="text-xs text-gray-500">{form.traits.length}/5</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_TRAITS.map((trait) => {
                const selected = form.traits.includes(trait);
                return (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => toggleTrait(trait)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                      selected
                        ? "bg-genesis-600/20 border-genesis-500/50 text-genesis-300"
                        : "bg-surface-raised border-surface-border text-gray-400 hover:text-gray-300 hover:border-white/15"
                    }`}
                  >
                    {trait}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice */}
          <div>
            <label htmlFor={`${formId}-voice`} className="block text-sm font-medium text-gray-300 mb-1.5">
              Voice Characteristics
            </label>
            <select
              id={`${formId}-voice`}
              value={form.voice}
              onChange={(e) => setForm((p) => ({ ...p, voice: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-raised border border-surface-border text-gray-100 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-genesis-500/50 focus:border-genesis-500 appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#12121a]">Select voice...</option>
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#12121a]">{v.label}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <ModalClose asChild>
              <Button variant="ghost" size="md">
                Cancel
              </Button>
            </ModalClose>
            <Button
              size="md"
              disabled={!isValid}
              onClick={handleSave}
            >
              {editingCharacter ? "Save Changes" : "Add Character"}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

/* ── Character card ──────────────────────────────────────────────────────── */

function CharacterCard({
  character,
  onEdit,
  onDelete,
}: {
  character: Character;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      variants={cardVariant}
      initial="initial"
      animate="animate"
      exit="exit"
      className="group relative rounded-2xl border border-surface-border bg-surface-raised p-4 sm:p-5 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.03]"
    >
      {/* Top row: avatar + name + actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-genesis-600/15 border border-genesis-500/30 flex items-center justify-center shrink-0">
            <UserIcon className="w-5 h-5 text-genesis-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm sm:text-base">{character.name}</h4>
            {character.age && (
              <span className="text-xs text-gray-500">{character.age}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-500 hover:text-genesis-400 hover:bg-genesis-500/10 transition-colors"
            aria-label={`Edit ${character.name}`}
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            aria-label={`Delete ${character.name}`}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-3">
        {character.description}
      </p>

      {/* Tags row */}
      <div className="flex flex-wrap gap-1.5">
        {character.traits.slice(0, 3).map((trait) => (
          <span
            key={trait}
            className="px-2 py-0.5 rounded-full bg-genesis-600/10 border border-genesis-500/20 text-[11px] text-genesis-300"
          >
            {trait}
          </span>
        ))}
        {character.traits.length > 3 && (
          <span className="px-2 py-0.5 rounded-full bg-surface-overlay text-[11px] text-gray-500">
            +{character.traits.length - 3}
          </span>
        )}
        {character.voice && (
          <span className="px-2 py-0.5 rounded-full bg-surface-overlay border border-surface-border text-[11px] text-gray-400">
            🎙 {VOICE_OPTIONS.find((v) => v.id === character.voice)?.label ?? character.voice}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ── Suggested character card ────────────────────────────────────────────── */

function SuggestedCard({
  suggestion,
  alreadyAdded,
  onAdd,
}: {
  suggestion: SuggestedCharacter;
  alreadyAdded: boolean;
  onAdd: () => void;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={`flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
        alreadyAdded
          ? "bg-genesis-600/10 border-genesis-500/30"
          : "bg-surface-raised border-surface-border hover:border-white/15"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-surface-overlay flex items-center justify-center shrink-0">
          <UserIcon className="w-4 h-4 text-gray-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{suggestion.name}</p>
          <p className="text-xs text-gray-500 truncate">{suggestion.description}</p>
        </div>
      </div>
      <Button
        variant={alreadyAdded ? "ghost" : "secondary"}
        size="sm"
        disabled={alreadyAdded}
        onClick={onAdd}
      >
        {alreadyAdded ? "Added" : "Add"}
      </Button>
    </motion.div>
  );
}

/* ── Main step component ─────────────────────────────────────────────────── */

interface StepCharactersProps {
  initialData: StepCharactersData;
  prompt: string;
  genre: string;
  onNext: (data: StepCharactersData) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function StepCharacters({
  initialData,
  prompt,
  genre,
  onNext,
  onBack,
  onSkip,
}: StepCharactersProps) {
  const [characters, setCharacters] = useState<Character[]>(initialData.characters);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-detect characters from step 1 prompt
  const suggestions = useMemo(() => extractCharactersFromPrompt(prompt), [prompt]);

  // AI Generate characters based on genre
  const handleAIGenerate = () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      const genreKey = genre.toUpperCase().replace(/[- ]/g, "_");
      const templates = GENRE_CHARACTERS[genreKey] ?? GENRE_CHARACTERS.SCI_FI ?? [];
      const generatedChars: Character[] = templates.map((t) => ({
        id: `char-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: t.name,
        description: t.description,
        age: t.age,
        build: t.build,
        features: t.features,
        traits: t.traits,
        voice: t.voice,
      }));
      // Add only characters whose names aren't already present
      setCharacters((prev) => {
        const existingNames = new Set(prev.map((c) => c.name));
        const newChars = generatedChars.filter((c) => !existingNames.has(c.name));
        return [...prev, ...newChars];
      });
      setIsGenerating(false);
    }, 1500);
  };

  const addedNames = useMemo(
    () => new Set(characters.map((c) => c.name)),
    [characters],
  );

  const handleAddSuggested = (suggestion: SuggestedCharacter) => {
    const newChar: Character = {
      id: `char-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: suggestion.name,
      description: suggestion.description,
      age: "",
      build: "",
      features: "",
      traits: [],
      voice: "",
    };
    setCharacters((prev) => [...prev, newChar]);
  };

  const handleSave = (character: Character) => {
    setCharacters((prev) => {
      const idx = prev.findIndex((c) => c.id === character.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = character;
        return updated;
      }
      return [...prev, character];
    });
    setEditingCharacter(null);
  };

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const handleOpenAdd = () => {
    setEditingCharacter(null);
    setModalOpen(true);
  };

  const handleNext = () => {
    onNext({ characters });
  };

  return (
    <>
      <motion.div
        key="step-characters"
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
            Define your characters
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto">
            We&apos;ll automatically extract characters from your story, or add them manually
          </p>
        </motion.div>

        {/* Auto-detected characters */}
        {suggestions.length > 0 && (
          <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon className="w-4 h-4 text-genesis-400" />
              <span className="text-sm font-medium text-gray-300">
                Characters detected from your story
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestions.map((s) => (
                <SuggestedCard
                  key={s.name}
                  suggestion={s}
                  alreadyAdded={addedNames.has(s.name)}
                  onAdd={() => handleAddSuggested(s)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Character list */}
        <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-300">
                Your Characters
                {characters.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500">({characters.length})</span>
                )}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleAIGenerate}
                disabled={isGenerating}
                iconLeft={<SparklesIcon className="w-4 h-4" />}
              >
                {isGenerating ? "Generating…" : "AI Generate"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenAdd}
                iconLeft={<PlusIcon className="w-4 h-4" />}
              >
                Add Manually
              </Button>
            </div>
          </div>

          {characters.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-surface-border bg-surface-raised/50"
            >
              <div className="w-14 h-14 rounded-full bg-surface-overlay flex items-center justify-center mb-4">
                <UserIcon className="w-7 h-7 text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm mb-1">No characters added yet</p>
              <p className="text-gray-600 text-xs mb-4">
                Add characters from suggestions above or create your own
              </p>
              <Button variant="ghost" size="sm" onClick={handleOpenAdd}>
                <PlusIcon className="w-4 h-4 mr-1.5" />
                Create First Character
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {characters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    onEdit={() => handleEdit(char)}
                    onDelete={() => handleDelete(char.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2 decoration-gray-700 hover:decoration-gray-500"
            >
              Skip for now
            </button>
            <Button
              size="lg"
              onClick={handleNext}
              iconRight={<ArrowRightIcon className="w-4 h-4" />}
              className="min-w-[200px]"
            >
              Next: Settings
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Character form modal */}
      <CharacterFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
        editingCharacter={editingCharacter}
      />
    </>
  );
}
