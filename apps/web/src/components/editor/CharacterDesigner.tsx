"use client";

import { useState, useCallback, useId, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalClose,
  Badge,
} from "@genesis/ui";

/* ══════════════════════════════════════════════════════════════════════════
 *  Types
 * ══════════════════════════════════════════════════════════════════════════ */

export interface ReferenceImage {
  id: string;
  label: string;
  url: string | null;
  generating: boolean;
}

export interface DesignerCharacter {
  id: string;
  name: string;
  description: string;
  age: string;
  build: string;
  height: string;
  features: string;
  traits: string[];
  voiceStyle: string;
  accent: string;
  sampleText: string;
  voiceSampleUrl: string | null;
  referenceImages: ReferenceImage[];
  avatarUrl: string | null;
}

export interface CharacterDesignerProps {
  /** Initial list of characters */
  initialCharacters?: DesignerCharacter[];
  /** Called whenever the character list changes */
  onChange?: (characters: DesignerCharacter[]) => void;
  /** Collaboration: map of characterId → { userId, displayName } for locked characters */
  characterLocks?: Map<string, { userId: string; displayName: string }>;
  /** Collaboration: whether the current user has edit permission */
  canEdit?: boolean;
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Constants
 * ══════════════════════════════════════════════════════════════════════════ */

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

const AGE_RANGES = [
  "Child (5-12)",
  "Teen (13-17)",
  "Young Adult (18-25)",
  "Adult (26-40)",
  "Middle-aged (41-60)",
  "Elder (60+)",
] as const;

const BUILD_OPTIONS = [
  "Slim",
  "Average",
  "Athletic",
  "Muscular",
  "Heavy-set",
  "Petite",
] as const;

const HEIGHT_OPTIONS = ["Short", "Average", "Tall", "Very Tall"] as const;

const VOICE_STYLES = [
  { id: "deep-authoritative", label: "Deep & Authoritative" },
  { id: "warm-friendly", label: "Warm & Friendly" },
  { id: "young-energetic", label: "Young & Energetic" },
  { id: "raspy-weathered", label: "Raspy & Weathered" },
  { id: "soft-soothing", label: "Soft & Soothing" },
  { id: "sharp-commanding", label: "Sharp & Commanding" },
  { id: "playful-mischievous", label: "Playful & Mischievous" },
  { id: "monotone-robotic", label: "Monotone & Robotic" },
] as const;

const ACCENTS = [
  { id: "neutral", label: "Neutral / Standard" },
  { id: "british", label: "British" },
  { id: "southern-us", label: "Southern US" },
  { id: "new-york", label: "New York" },
  { id: "australian", label: "Australian" },
  { id: "irish", label: "Irish" },
  { id: "french", label: "French" },
  { id: "german", label: "German" },
  { id: "japanese", label: "Japanese" },
  { id: "russian", label: "Russian" },
] as const;

const REFERENCE_SLOTS: { id: string; label: string }[] = [
  { id: "front", label: "Front View" },
  { id: "side", label: "Side View" },
  { id: "three-quarter", label: "3/4 View" },
  { id: "expressions", label: "Expressions" },
];

function makeRefImages(): ReferenceImage[] {
  return REFERENCE_SLOTS.map((slot) => ({
    id: slot.id,
    label: slot.label,
    url: null,
    generating: false,
  }));
}

function makeId() {
  return `char-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Icons (inline SVG, matching project convention)
 * ══════════════════════════════════════════════════════════════════════════ */

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" /><path d="M5 12h14" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" />
    </svg>
  );
}

function IconImage({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function IconPlay({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

function IconMic({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Animation Variants
 * ══════════════════════════════════════════════════════════════════════════ */

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.25 },
};

const slideContent = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.3 },
};

const sidebarItem = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { duration: 0.2 },
};

/* ══════════════════════════════════════════════════════════════════════════
 *  Character Creation Modal
 * ══════════════════════════════════════════════════════════════════════════ */

function CreateCharacterModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (character: DesignerCharacter) => void;
}) {
  const formId = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  const isValid = name.trim().length >= 2;

  const handleCreate = () => {
    if (!isValid) return;
    onCreate({
      id: makeId(),
      name: name.trim(),
      description: description.trim(),
      age: "",
      build: "",
      height: "",
      features: "",
      traits: [],
      voiceStyle: "",
      accent: "neutral",
      sampleText: "",
      voiceSampleUrl: null,
      referenceImages: makeRefImages(),
      avatarUrl: null,
    });
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        title="New Character"
        description="Create a character for your project."
        className="sm:max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor={`${formId}-name`}
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Name <span className="text-red-400">*</span>
            </label>
            <Input
              id={`${formId}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Commander Reyes"
            />
          </div>

          <div>
            <label
              htmlFor={`${formId}-desc`}
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Description
            </label>
            <textarea
              id={`${formId}-desc`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief backstory, role in the story, or visual description…"
              className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-surface-border text-gray-100 placeholder:text-gray-600 text-sm leading-relaxed resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-genesis-500/50 focus:border-genesis-500"
            />
          </div>

          {/* AI Generate from description */}
          <button
            type="button"
            disabled={!description.trim()}
            onClick={() => {
              if (!isValid) return;
              const char: DesignerCharacter = {
                id: makeId(),
                name: name.trim(),
                description: description.trim(),
                age: "Adult (26-40)",
                build: "Athletic",
                height: "Average",
                features: "",
                traits: ["Brave", "Intelligent"],
                voiceStyle: "warm-friendly",
                accent: "neutral",
                sampleText: "",
                voiceSampleUrl: null,
                referenceImages: makeRefImages(),
                avatarUrl: null,
              };
              onCreate(char);
              onOpenChange(false);
            }}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${
              description.trim()
                ? "border-purple-500/40 text-purple-400 hover:bg-purple-500/10 cursor-pointer"
                : "border-dashed border-purple-500/30 text-purple-400/60 cursor-not-allowed"
            }`}
          >
            <IconSparkles className="w-4 h-4" />
            Generate from Description
          </button>

          <div className="flex items-center justify-end gap-3 pt-2">
            <ModalClose asChild>
              <Button variant="ghost" size="md">
                Cancel
              </Button>
            </ModalClose>
            <Button
              variant="primary"
              size="md"
              disabled={!isValid}
              onClick={handleCreate}
            >
              Create Character
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Reference Image Slot
 * ══════════════════════════════════════════════════════════════════════════ */

function RefImageSlot({
  image,
  onGenerate,
  onRegenerate,
}: {
  image: ReferenceImage;
  onGenerate: () => void;
  onRegenerate: () => void;
}) {
  return (
    <div className="group relative aspect-square rounded-xl border border-surface-border bg-surface-raised overflow-hidden transition-all duration-200 hover:border-purple-500/40">
      {image.url ? (
        <>
          <Image
            src={image.url}
            alt={image.label}
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            className="object-cover"
          />
          {/* Regenerate overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur text-white text-xs font-medium hover:bg-white/20 transition-colors"
            >
              <IconRefresh className="w-3.5 h-3.5" />
              Regenerate
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={onGenerate}
          disabled={image.generating}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-purple-400 transition-colors"
        >
          {image.generating ? (
            <>
              <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              <span className="text-[11px]">Generating…</span>
            </>
          ) : (
            <>
              <IconImage className="w-6 h-6" />
              <span className="text-[11px] font-medium">Generate</span>
            </>
          )}
        </button>
      )}
      {/* Label */}
      <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-gradient-to-t from-black/70 to-transparent">
        <span className="text-[10px] font-medium text-gray-300">
          {image.label}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Main Component
 * ══════════════════════════════════════════════════════════════════════════ */

export default function CharacterDesigner({
  initialCharacters = [],
  onChange,
  characterLocks = new Map(),
  canEdit = true,
}: CharacterDesignerProps) {
  const [characters, setCharacters] =
    useState<DesignerCharacter[]>(initialCharacters);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCharacters[0]?.id ?? null,
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [customTraitInput, setCustomTraitInput] = useState("");
  const [voicePlaying, setVoicePlaying] = useState(false);

  const selected = characters.find((c) => c.id === selectedId) ?? null;

  /* ── Propagate changes ─────────────────────────────────────────────── */
  const updateCharacters = useCallback(
    (next: DesignerCharacter[]) => {
      setCharacters(next);
      onChange?.(next);
    },
    [onChange],
  );

  /* ── CRUD helpers ──────────────────────────────────────────────────── */
  const handleCreate = useCallback(
    (char: DesignerCharacter) => {
      const next = [...characters, char];
      updateCharacters(next);
      setSelectedId(char.id);
    },
    [characters, updateCharacters],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const next = characters.filter((c) => c.id !== id);
      updateCharacters(next);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? null);
      }
    },
    [characters, selectedId, updateCharacters],
  );

  const updateSelected = useCallback(
    (patch: Partial<DesignerCharacter>) => {
      if (!selectedId) return;
      const next = characters.map((c) =>
        c.id === selectedId ? { ...c, ...patch } : c,
      );
      updateCharacters(next);
    },
    [characters, selectedId, updateCharacters],
  );

  /* ── Trait toggling ────────────────────────────────────────────────── */
  const toggleTrait = useCallback(
    (trait: string) => {
      if (!selected) return;
      const has = selected.traits.includes(trait);
      updateSelected({
        traits: has
          ? selected.traits.filter((t) => t !== trait)
          : [...selected.traits, trait],
      });
    },
    [selected, updateSelected],
  );

  const addCustomTrait = useCallback(() => {
    const t = customTraitInput.trim();
    if (!t || !selected || selected.traits.includes(t)) return;
    updateSelected({ traits: [...selected.traits, t] });
    setCustomTraitInput("");
  }, [customTraitInput, selected, updateSelected]);

  /* ── Reference image placeholders ──────────────────────────────────── */
  const handleGenerateRef = useCallback(
    (slotId: string) => {
      if (!selected) return;
      // Mark generating
      const imgs = selected.referenceImages.map((img) =>
        img.id === slotId ? { ...img, generating: true } : img,
      );
      updateSelected({ referenceImages: imgs });

      // Simulate generation (placeholder)
      setTimeout(() => {
        setCharacters((prev) =>
          prev.map((c) => {
            if (c.id !== selected.id) return c;
            return {
              ...c,
              referenceImages: c.referenceImages.map((img) =>
                img.id === slotId
                  ? {
                      ...img,
                      generating: false,
                      url: `https://placehold.co/512x512/1a1a26/a855f7?text=${encodeURIComponent(img.label)}`,
                    }
                  : img,
              ),
            };
          }),
        );
      }, 2000);
    },
    [selected, updateSelected],
  );

  const handleRegenerateAll = useCallback(() => {
    if (!selected) return;
    for (const img of selected.referenceImages) {
      handleGenerateRef(img.id);
    }
  }, [selected, handleGenerateRef]);

  /* ══════════════════════════════════════════════════════════════════════
   *  JSX
   * ══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex h-full min-h-0 bg-surface rounded-xl border border-surface-border overflow-hidden">
      {/* ── Left sidebar: character list ─────────────────────────────── */}
      <div className="w-16 flex-shrink-0 border-r border-surface-border bg-surface-raised/50 flex flex-col items-center py-3 gap-2 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {characters.map((char) => {
            const isActive = char.id === selectedId;
            const lock = characterLocks.get(char.id);
            return (
              <motion.button
                key={char.id}
                layout
                {...sidebarItem}
                onClick={() => setSelectedId(char.id)}
                className={`group relative w-12 flex flex-col items-center gap-1 transition-all duration-200 ${
                  isActive ? "" : "opacity-60 hover:opacity-100"
                }`}
                title={lock ? `Being edited by ${lock.displayName}` : char.name}
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden transition-all duration-200 ${
                    lock
                      ? "ring-2 ring-amber-500 ring-offset-1 ring-offset-surface"
                      : isActive
                        ? "ring-2 ring-purple-500 ring-offset-1 ring-offset-surface"
                        : "border border-surface-border hover:border-purple-500/40"
                  }`}
                >
                  {char.avatarUrl ? (
                    <Image
                      src={char.avatarUrl}
                      alt={char.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-300">
                        {char.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                {/* Name label */}
                <span
                  className={`text-[9px] leading-tight text-center w-full truncate ${
                    isActive ? "text-white font-medium" : "text-gray-500"
                  }`}
                >
                  {char.name}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Add button */}
        <button
          onClick={() => setCreateModalOpen(true)}
          className="w-10 h-10 rounded-lg border border-dashed border-surface-border flex items-center justify-center text-gray-500 hover:text-purple-400 hover:border-purple-500/40 transition-all mt-1"
          title="Add Character"
        >
          <IconPlus className="w-4 h-4" />
        </button>
      </div>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              {...slideContent}
              className="p-6 space-y-8"
            >
              {/* ── Collaboration lock banner ────────────────────────── */}
              {(() => {
                const selectedLock = characterLocks.get(selected.id);
                if (!selectedLock) return null;
                return (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Being edited by {selectedLock.displayName}
                  </div>
                );
              })()}

              {/* ── Read-only badge ──────────────────────────────────── */}
              {!canEdit && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500/10 border border-gray-500/20 text-xs text-gray-400">
                  You have view-only access to this project.
                </div>
              )}

              {/* ── Header ───────────────────────────────────────────── */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center border border-surface-border">
                    {selected.avatarUrl ? (
                      <Image
                        src={selected.avatarUrl}
                        alt={selected.name}
                        fill
                        sizes="48px"
                        className="rounded-xl object-cover"
                      />
                    ) : (
                      <IconUser className="w-6 h-6 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-bold text-white">
                      {selected.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {selected.traits.length > 0
                        ? selected.traits.slice(0, 3).join(" · ")
                        : "No traits selected"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(selected.id)}
                  iconLeft={<IconTrash className="w-3.5 h-3.5" />}
                  disabled={!canEdit || characterLocks.has(selected.id)}
                >
                  Delete
                </Button>
              </div>

              {/* ── Reference Images ─────────────────────────────────── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Reference Images
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerateAll}
                    iconLeft={<IconRefresh className="w-3.5 h-3.5" />}
                  >
                    Regenerate All
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selected.referenceImages.map((img) => (
                    <RefImageSlot
                      key={img.id}
                      image={img}
                      onGenerate={() => handleGenerateRef(img.id)}
                      onRegenerate={() => handleGenerateRef(img.id)}
                    />
                  ))}
                </div>
              </section>

              {/* ── Profile ──────────────────────────────────────────── */}
              <section>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  Profile
                </h3>
                <div className="space-y-4">
                  {/* Name */}
                  <Input
                    label="Name"
                    value={selected.name}
                    onChange={(e) =>
                      updateSelected({ name: e.target.value })
                    }
                    placeholder="Character name"
                  />

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={selected.description}
                      onChange={(e) =>
                        updateSelected({ description: e.target.value })
                      }
                      rows={3}
                      placeholder="Backstory, motivation, role in the story…"
                      className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-surface-border text-gray-100 placeholder:text-gray-600 text-sm leading-relaxed resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-genesis-500/50 focus:border-genesis-500"
                    />
                  </div>

                  {/* Appearance grid */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Appearance
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Age */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Age Range
                        </label>
                        <select
                          value={selected.age}
                          onChange={(e) =>
                            updateSelected({ age: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-surface-border text-gray-100 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-genesis-500/50 focus:border-genesis-500 appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-[#12121a]">
                            Select…
                          </option>
                          {AGE_RANGES.map((a) => (
                            <option key={a} value={a} className="bg-[#12121a]">
                              {a}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Build */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Build
                        </label>
                        <select
                          value={selected.build}
                          onChange={(e) =>
                            updateSelected({ build: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-surface-border text-gray-100 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-genesis-500/50 focus:border-genesis-500 appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-[#12121a]">
                            Select…
                          </option>
                          {BUILD_OPTIONS.map((b) => (
                            <option key={b} value={b} className="bg-[#12121a]">
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Height */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Height
                        </label>
                        <select
                          value={selected.height}
                          onChange={(e) =>
                            updateSelected({ height: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-surface-border text-gray-100 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-genesis-500/50 focus:border-genesis-500 appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-[#12121a]">
                            Select…
                          </option>
                          {HEIGHT_OPTIONS.map((h) => (
                            <option key={h} value={h} className="bg-[#12121a]">
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notable features */}
                  <Input
                    label="Notable Features"
                    value={selected.features}
                    onChange={(e) =>
                      updateSelected({ features: e.target.value })
                    }
                    placeholder="e.g. Cybernetic left eye, scar across jaw"
                  />
                </div>
              </section>

              {/* ── Personality ───────────────────────────────────────── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Personality Traits
                  </h3>
                  <span className="text-xs text-gray-500">
                    {selected.traits.length} selected
                  </span>
                </div>

                {/* Preset traits */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {PERSONALITY_TRAITS.map((trait) => {
                    const active = selected.traits.includes(trait);
                    return (
                      <button
                        key={trait}
                        type="button"
                        onClick={() => toggleTrait(trait)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                          active
                            ? "bg-genesis-600/20 border-genesis-500/50 text-genesis-300"
                            : "bg-surface-raised border-surface-border text-gray-400 hover:text-gray-300 hover:border-white/15"
                        }`}
                      >
                        {trait}
                      </button>
                    );
                  })}
                </div>

                {/* Custom traits (user-added) */}
                {selected.traits
                  .filter(
                    (t) =>
                      !PERSONALITY_TRAITS.includes(
                        t as (typeof PERSONALITY_TRAITS)[number],
                      ),
                  )
                  .map((t) => (
                    <Badge
                      key={t}
                      variant="info"
                      className="mr-1.5 mb-1.5 cursor-pointer"
                    >
                      {t}
                      <button
                        onClick={() => toggleTrait(t)}
                        className="ml-1 hover:text-white"
                        aria-label={`Remove ${t}`}
                      >
                        <IconX className="w-3 h-3 inline" />
                      </button>
                    </Badge>
                  ))}

                {/* Add custom trait */}
                <div className="flex gap-2 mt-2">
                  <Input
                    size="sm"
                    value={customTraitInput}
                    onChange={(e) => setCustomTraitInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomTrait()}
                    placeholder="Add custom trait…"
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addCustomTrait}
                    disabled={!customTraitInput.trim()}
                  >
                    Add
                  </Button>
                </div>
              </section>

              {/* ── Voice ────────────────────────────────────────────── */}
              <section>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  Voice
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Voice style */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Voice Style
                      </label>
                      <select
                        value={selected.voiceStyle}
                        onChange={(e) =>
                          updateSelected({ voiceStyle: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-surface-border text-gray-100 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-genesis-500/50 focus:border-genesis-500 appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#12121a]">
                          Select…
                        </option>
                        {VOICE_STYLES.map((v) => (
                          <option
                            key={v.id}
                            value={v.id}
                            className="bg-[#12121a]"
                          >
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Accent */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Accent
                      </label>
                      <select
                        value={selected.accent}
                        onChange={(e) =>
                          updateSelected({ accent: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-surface-border text-gray-100 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-genesis-500/50 focus:border-genesis-500 appearance-none cursor-pointer"
                      >
                        {ACCENTS.map((a) => (
                          <option
                            key={a.id}
                            value={a.id}
                            className="bg-[#12121a]"
                          >
                            {a.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sample text */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Sample Text
                    </label>
                    <textarea
                      value={selected.sampleText}
                      onChange={(e) =>
                        updateSelected({ sampleText: e.target.value })
                      }
                      rows={2}
                      placeholder="Type a line for this character to preview their voice…"
                      className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-surface-border text-gray-100 placeholder:text-gray-600 text-sm leading-relaxed resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-genesis-500/50 focus:border-genesis-500"
                    />
                  </div>

                  {/* Generate + player */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      iconLeft={<IconMic className="w-3.5 h-3.5" />}
                      disabled={!selected.voiceStyle || !selected.sampleText.trim()}
                    >
                      Generate Voice Sample
                    </Button>

                    {selected.voiceSampleUrl && (
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => setVoicePlaying(!voicePlaying)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            voicePlaying
                              ? "bg-purple-600 text-white"
                              : "bg-surface-raised border border-surface-border text-gray-400 hover:text-white"
                          }`}
                        >
                          <IconPlay className="w-3.5 h-3.5" />
                        </button>
                        {/* Waveform placeholder */}
                        <div className="flex-1 h-8 rounded-lg bg-surface-raised border border-surface-border flex items-center px-3 gap-[2px]">
                          {Array.from({ length: 30 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-[3px] rounded-full bg-purple-500/40"
                              style={{
                                height: `${8 + Math.random() * 16}px`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </motion.div>
          ) : (
            /* ── Empty state ─────────────────────────────────────────── */
            <motion.div
              key="empty"
              {...fadeUp}
              className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-surface-border flex items-center justify-center mb-4">
                <IconUser className="w-8 h-8 text-purple-400/60" />
              </div>
              <h3 className="text-lg font-heading font-bold text-white mb-1">
                No Character Selected
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mb-5">
                Create a character to start designing their appearance,
                personality, and voice.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => setCreateModalOpen(true)}
                iconLeft={<IconPlus className="w-4 h-4" />}
              >
                Create Character
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Create modal ─────────────────────────────────────────────── */}
      <CreateCharacterModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreate={handleCreate}
      />
    </div>
  );
}
