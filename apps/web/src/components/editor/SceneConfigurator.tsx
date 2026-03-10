"use client";

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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

export type TimeOfDay =
  | "dawn"
  | "morning"
  | "afternoon"
  | "golden-hour"
  | "evening"
  | "night"
  | "midnight";

export type Weather =
  | "clear"
  | "cloudy"
  | "overcast"
  | "rainy"
  | "stormy"
  | "snowy"
  | "foggy"
  | "windy"
  | "hazy";

export type Mood =
  | "tense"
  | "peaceful"
  | "exciting"
  | "melancholy"
  | "romantic"
  | "mysterious"
  | "comedic"
  | "horrific"
  | "nostalgic"
  | "triumphant";

export type ShotType =
  | "establishing"
  | "wide"
  | "medium"
  | "close-up"
  | "extreme-close-up"
  | "over-the-shoulder"
  | "two-shot"
  | "pov"
  | "aerial"
  | "insert";

export type CameraMovement =
  | "static"
  | "pan-left"
  | "pan-right"
  | "tilt-up"
  | "tilt-down"
  | "dolly-in"
  | "dolly-out"
  | "tracking"
  | "crane"
  | "handheld"
  | "steadicam"
  | "whip-pan"
  | "zoom-in"
  | "zoom-out";

export type LightingPreset =
  | "natural"
  | "golden-hour"
  | "blue-hour"
  | "high-key"
  | "low-key"
  | "silhouette"
  | "neon"
  | "candlelight"
  | "overcast-soft"
  | "harsh-sunlight"
  | "moonlight";

export interface DialogueLine {
  id: string;
  characterName: string;
  text: string;
  parenthetical: string;
  timingSeconds: number;
}

export interface SceneShot {
  id: string;
  shotType: ShotType;
  cameraMovement: CameraMovement;
  duration: number;
  description: string;
  cameraPosition: { x: number; y: number; z: number };
  focalLength: number;
  depthOfField: boolean;
  lensEffects: { filmGrain: boolean; vignette: boolean; motionBlur: boolean; chromatic: boolean };
}

export interface ConfiguratorScene {
  id: string;
  sceneNumber: number;
  title: string;
  location: string;
  timeOfDay: TimeOfDay;
  weather: Weather;
  mood: Mood;
  action: string;
  dialogue: DialogueLine[];
  shots: SceneShot[];
  lightingPreset: LightingPreset;
  autoLighting: boolean;
  lightingNotes: string;
  thumbnailUrl: string | null;
}

export interface SceneConfiguratorProps {
  initialScenes?: ConfiguratorScene[];
  characters?: string[];
  onChange?: (scenes: ConfiguratorScene[]) => void;
  onSave?: (scene: ConfiguratorScene) => void;
  onDelete?: (sceneId: string) => void;
}

/** Form values for react-hook-form */
interface SceneFormValues {
  title: string;
  location: string;
  timeOfDay: TimeOfDay;
  weather: Weather;
  mood: Mood;
  action: string;
  dialogue: DialogueLine[];
  lightingPreset: LightingPreset;
  autoLighting: boolean;
  lightingNotes: string;
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Constants
 * ══════════════════════════════════════════════════════════════════════════ */

const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string; icon: string }[] = [
  { value: "dawn", label: "Dawn", icon: "🌅" },
  { value: "morning", label: "Morning", icon: "☀️" },
  { value: "afternoon", label: "Afternoon", icon: "🌤️" },
  { value: "golden-hour", label: "Golden Hour", icon: "🌇" },
  { value: "evening", label: "Evening", icon: "🌆" },
  { value: "night", label: "Night", icon: "🌙" },
  { value: "midnight", label: "Midnight", icon: "🌑" },
];

const WEATHER_OPTIONS: { value: Weather; label: string; icon: string }[] = [
  { value: "clear", label: "Clear", icon: "☀️" },
  { value: "cloudy", label: "Cloudy", icon: "⛅" },
  { value: "overcast", label: "Overcast", icon: "☁️" },
  { value: "rainy", label: "Rainy", icon: "🌧️" },
  { value: "stormy", label: "Stormy", icon: "⛈️" },
  { value: "snowy", label: "Snowy", icon: "❄️" },
  { value: "foggy", label: "Foggy", icon: "🌫️" },
  { value: "windy", label: "Windy", icon: "💨" },
  { value: "hazy", label: "Hazy", icon: "🌁" },
];

const MOOD_OPTIONS: { value: Mood; label: string }[] = [
  { value: "tense", label: "Tense" },
  { value: "peaceful", label: "Peaceful" },
  { value: "exciting", label: "Exciting" },
  { value: "melancholy", label: "Melancholy" },
  { value: "romantic", label: "Romantic" },
  { value: "mysterious", label: "Mysterious" },
  { value: "comedic", label: "Comedic" },
  { value: "horrific", label: "Horrific" },
  { value: "nostalgic", label: "Nostalgic" },
  { value: "triumphant", label: "Triumphant" },
];

const SHOT_TYPE_OPTIONS: { value: ShotType; label: string }[] = [
  { value: "establishing", label: "Establishing" },
  { value: "wide", label: "Wide" },
  { value: "medium", label: "Medium" },
  { value: "close-up", label: "Close-Up" },
  { value: "extreme-close-up", label: "Extreme Close-Up" },
  { value: "over-the-shoulder", label: "Over the Shoulder" },
  { value: "two-shot", label: "Two Shot" },
  { value: "pov", label: "POV" },
  { value: "aerial", label: "Aerial" },
  { value: "insert", label: "Insert" },
];

const CAMERA_MOVEMENT_OPTIONS: { value: CameraMovement; label: string }[] = [
  { value: "static", label: "Static" },
  { value: "pan-left", label: "Pan Left" },
  { value: "pan-right", label: "Pan Right" },
  { value: "tilt-up", label: "Tilt Up" },
  { value: "tilt-down", label: "Tilt Down" },
  { value: "dolly-in", label: "Dolly In" },
  { value: "dolly-out", label: "Dolly Out" },
  { value: "tracking", label: "Tracking" },
  { value: "crane", label: "Crane" },
  { value: "handheld", label: "Handheld" },
  { value: "steadicam", label: "Steadicam" },
  { value: "whip-pan", label: "Whip Pan" },
  { value: "zoom-in", label: "Zoom In" },
  { value: "zoom-out", label: "Zoom Out" },
];

const LIGHTING_PRESET_OPTIONS: { value: LightingPreset; label: string; color: string }[] = [
  { value: "natural", label: "Natural", color: "#fbbf24" },
  { value: "golden-hour", label: "Golden Hour", color: "#f59e0b" },
  { value: "blue-hour", label: "Blue Hour", color: "#3b82f6" },
  { value: "high-key", label: "High Key", color: "#e5e7eb" },
  { value: "low-key", label: "Low Key", color: "#374151" },
  { value: "silhouette", label: "Silhouette", color: "#1f2937" },
  { value: "neon", label: "Neon", color: "#a855f7" },
  { value: "candlelight", label: "Candlelight", color: "#d97706" },
  { value: "overcast-soft", label: "Overcast Soft", color: "#9ca3af" },
  { value: "harsh-sunlight", label: "Harsh Sunlight", color: "#fde047" },
  { value: "moonlight", label: "Moonlight", color: "#93c5fd" },
];

const DEFAULT_CHARACTERS = [
  "SARAH",
  "MARCUS",
  "DETECTIVE CHEN",
  "WAITRESS",
  "NARRATOR",
];

/* ── Sample data ─────────────────────────────────────────────────────── */

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultShot(index: number): SceneShot {
  return {
    id: makeId(),
    shotType: index === 0 ? "establishing" : "medium",
    cameraMovement: "static",
    duration: 3,
    description: "",
    cameraPosition: { x: 0, y: 1.5, z: 5 },
    focalLength: 50,
    depthOfField: false,
    lensEffects: { filmGrain: false, vignette: false, motionBlur: false, chromatic: false },
  };
}

function createDefaultScene(sceneNumber: number): ConfiguratorScene {
  return {
    id: makeId(),
    sceneNumber,
    title: `Scene ${sceneNumber}`,
    location: "",
    timeOfDay: "afternoon",
    weather: "clear",
    mood: "peaceful",
    action: "",
    dialogue: [],
    shots: [createDefaultShot(0)],
    lightingPreset: "natural",
    autoLighting: true,
    lightingNotes: "",
    thumbnailUrl: null,
  };
}

const SAMPLE_SCENES: ConfiguratorScene[] = [
  {
    id: "scene-1",
    sceneNumber: 1,
    title: "City Awakens",
    location: "EXT. DOWNTOWN SKYLINE - ESTABLISHING",
    timeOfDay: "dawn",
    weather: "clear",
    mood: "peaceful",
    action: "The city skyline emerges from the morning mist. Traffic begins to fill the streets below as the first rays of sunlight catch the glass facades of towering buildings.",
    dialogue: [],
    shots: [
      { id: "sh-1a", shotType: "establishing", cameraMovement: "crane", duration: 4.5, description: "Wide aerial establishing shot, slowly descending", cameraPosition: { x: 0, y: 30, z: 100 }, focalLength: 35, depthOfField: false, lensEffects: { filmGrain: false, vignette: true, motionBlur: false, chromatic: false } },
      { id: "sh-1b", shotType: "medium", cameraMovement: "tracking", duration: 3.0, description: "Follow protagonist on sidewalk", cameraPosition: { x: 2, y: 1.5, z: 4 }, focalLength: 50, depthOfField: true, lensEffects: { filmGrain: false, vignette: false, motionBlur: false, chromatic: false } },
      { id: "sh-1c", shotType: "close-up", cameraMovement: "static", duration: 2.5, description: "Close-up on face, expression of determination", cameraPosition: { x: 0, y: 1.6, z: 1.5 }, focalLength: 85, depthOfField: true, lensEffects: { filmGrain: false, vignette: false, motionBlur: false, chromatic: false } },
    ],
    lightingPreset: "golden-hour",
    autoLighting: true,
    lightingNotes: "",
    thumbnailUrl: null,
  },
  {
    id: "scene-2",
    sceneNumber: 2,
    title: "The Meeting",
    location: "INT. DOWNTOWN CAFÉ - DAY",
    timeOfDay: "morning",
    weather: "cloudy",
    mood: "tense",
    action: "Sarah sits alone at a corner table, nervously stirring her coffee. The café is half-empty. Marcus enters through the front door, spots her, hesitates.",
    dialogue: [
      { id: "dl-1", characterName: "SARAH", text: "I wasn't sure you'd come.", parenthetical: "not looking up", timingSeconds: 5 },
      { id: "dl-2", characterName: "MARCUS", text: "I almost didn't.", parenthetical: "sitting down", timingSeconds: 8 },
      { id: "dl-3", characterName: "SARAH", text: "We need to talk about what happened.", parenthetical: "quietly", timingSeconds: 11 },
    ],
    shots: [
      { id: "sh-2a", shotType: "wide", cameraMovement: "static", duration: 5.0, description: "Wide shot of café interior", cameraPosition: { x: -3, y: 2, z: 8 }, focalLength: 35, depthOfField: false, lensEffects: { filmGrain: false, vignette: false, motionBlur: false, chromatic: false } },
      { id: "sh-2b", shotType: "two-shot", cameraMovement: "dolly-in", duration: 3.5, description: "Two-shot as Marcus sits", cameraPosition: { x: 0, y: 1.4, z: 3 }, focalLength: 50, depthOfField: true, lensEffects: { filmGrain: false, vignette: false, motionBlur: false, chromatic: false } },
      { id: "sh-2c", shotType: "close-up", cameraMovement: "static", duration: 2.0, description: "Sarah's reaction close-up", cameraPosition: { x: -0.5, y: 1.5, z: 1.2 }, focalLength: 85, depthOfField: true, lensEffects: { filmGrain: true, vignette: false, motionBlur: false, chromatic: false } },
    ],
    lightingPreset: "overcast-soft",
    autoLighting: true,
    lightingNotes: "Warm interior lighting contrasting with cold exterior through windows",
    thumbnailUrl: null,
  },
  {
    id: "scene-3",
    sceneNumber: 3,
    title: "The Chase",
    location: "EXT. NARROW ALLEYWAY - NIGHT",
    timeOfDay: "night",
    weather: "rainy",
    mood: "exciting",
    action: "Footsteps echo through the rain-slicked alley. A figure sprints between dumpsters and fire escapes, glancing back over their shoulder. Neon signs reflect in puddles.",
    dialogue: [],
    shots: [
      { id: "sh-3a", shotType: "wide", cameraMovement: "tracking", duration: 6.0, description: "Track alongside running figure", cameraPosition: { x: 3, y: 1.5, z: 2 }, focalLength: 24, depthOfField: false, lensEffects: { filmGrain: true, vignette: true, motionBlur: true, chromatic: false } },
      { id: "sh-3b", shotType: "over-the-shoulder", cameraMovement: "handheld", duration: 4.0, description: "Over-the-shoulder POV running", cameraPosition: { x: 0, y: 1.7, z: 1 }, focalLength: 35, depthOfField: false, lensEffects: { filmGrain: true, vignette: false, motionBlur: true, chromatic: true } },
    ],
    lightingPreset: "neon",
    autoLighting: false,
    lightingNotes: "Mix of neon reflections in puddles, harsh street lamps creating contrast zones",
    thumbnailUrl: null,
  },
];

/* ══════════════════════════════════════════════════════════════════════════
 *  Icons
 * ══════════════════════════════════════════════════════════════════════════ */

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function IconFilm() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" />
    </svg>
  );
}

function IconGripVertical() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function IconMessageSquare() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconLightbulb() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" />
    </svg>
  );
}

function IconCrosshair() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Utility helpers
 * ══════════════════════════════════════════════════════════════════════════ */

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Select component (styled)
 * ══════════════════════════════════════════════════════════════════════════ */

function Select({
  value,
  onChange,
  options,
  label,
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-400 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-surface-raised border border-surface-border text-gray-100 text-sm rounded-lg px-3 py-2 pr-8 appearance-none cursor-pointer focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#12121a]">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
          <IconChevronDown />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Camera Configuration Modal
 * ══════════════════════════════════════════════════════════════════════════ */

function CameraConfigModal({
  shot,
  open,
  onClose,
  onSave,
}: {
  shot: SceneShot;
  open: boolean;
  onClose: () => void;
  onSave: (shot: SceneShot) => void;
}) {
  const [local, setLocal] = useState<SceneShot>(shot);

  useEffect(() => {
    if (open) setLocal(shot);
  }, [open, shot]);

  const updatePos = useCallback((axis: "x" | "y" | "z", val: number) => {
    setLocal((prev) => ({
      ...prev,
      cameraPosition: { ...prev.cameraPosition, [axis]: val },
    }));
  }, []);

  const updateLens = useCallback((key: keyof SceneShot["lensEffects"]) => {
    setLocal((prev) => ({
      ...prev,
      lensEffects: { ...prev.lensEffects, [key]: !prev.lensEffects[key] },
    }));
  }, []);

  return (
    <Modal open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <ModalContent className="max-w-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <IconCamera /> Camera Configuration
            </h2>
            <ModalClose />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Left: Camera preview */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Camera Preview
              </div>

              {/* 2D top-down camera diagram */}
              <div className="relative w-full aspect-square bg-black/40 border border-surface-border rounded-lg overflow-hidden">
                {/* Grid lines */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                  {/* Grid */}
                  {Array.from({ length: 9 }).map((_, i) => (
                    <g key={i}>
                      <line x1={(i + 1) * 20} y1="0" x2={(i + 1) * 20} y2="200" stroke="#1f2937" strokeWidth="0.5" />
                      <line x1="0" y1={(i + 1) * 20} x2="200" y2={(i + 1) * 20} stroke="#1f2937" strokeWidth="0.5" />
                    </g>
                  ))}
                  {/* Center cross */}
                  <line x1="100" y1="0" x2="100" y2="200" stroke="#374151" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="100" x2="200" y2="100" stroke="#374151" strokeWidth="1" strokeDasharray="4" />

                  {/* Subject position */}
                  <circle cx="100" cy="100" r="6" fill="#6b7280" stroke="#9ca3af" strokeWidth="1" />
                  <text x="100" y="118" textAnchor="middle" fill="#9ca3af" fontSize="8">Subject</text>

                  {/* Camera position */}
                  {(() => {
                    const cx = 100 + (local.cameraPosition.x / 20) * 80;
                    const cy = 100 - (local.cameraPosition.z / 20) * 80;
                    return (
                      <>
                        {/* Line from camera to subject */}
                        <line x1={cx} y1={cy} x2="100" y2="100" stroke="#a855f7" strokeWidth="1" strokeDasharray="3" opacity="0.5" />
                        {/* FOV cone */}
                        {(() => {
                          const fovAngle = Math.atan(36 / (2 * local.focalLength)) * 2;
                          const angleToSubject = Math.atan2(100 - cy, 100 - cx);
                          const coneLen = 40;
                          const leftX = cx + Math.cos(angleToSubject - fovAngle / 2) * coneLen;
                          const leftY = cy + Math.sin(angleToSubject - fovAngle / 2) * coneLen;
                          const rightX = cx + Math.cos(angleToSubject + fovAngle / 2) * coneLen;
                          const rightY = cy + Math.sin(angleToSubject + fovAngle / 2) * coneLen;
                          return (
                            <polygon
                              points={`${cx},${cy} ${leftX},${leftY} ${rightX},${rightY}`}
                              fill="rgba(168, 85, 247, 0.15)"
                              stroke="rgba(168, 85, 247, 0.3)"
                              strokeWidth="0.5"
                            />
                          );
                        })()}
                        {/* Camera dot */}
                        <circle cx={cx} cy={cy} r="5" fill="#a855f7" stroke="#c084fc" strokeWidth="1.5" />
                        <text x={cx} y={cy - 10} textAnchor="middle" fill="#c084fc" fontSize="7">CAM</text>
                      </>
                    );
                  })()}

                  {/* Axis labels */}
                  <text x="195" y="105" textAnchor="end" fill="#4b5563" fontSize="7">X+</text>
                  <text x="105" y="8" textAnchor="start" fill="#4b5563" fontSize="7">Z+</text>
                </svg>

                {/* Height indicator (Y axis) */}
                <div className="absolute right-2 top-2 bottom-2 w-6 flex flex-col items-center">
                  <span className="text-[8px] text-gray-600">Y</span>
                  <div className="flex-1 w-1 bg-gray-800 rounded relative my-1">
                    <div
                      className="absolute w-3 h-3 -left-1 bg-purple-500 rounded-full border border-purple-400"
                      style={{
                        bottom: `${clamp((local.cameraPosition.y / 10) * 100, 0, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[8px] text-gray-600">{local.cameraPosition.y.toFixed(1)}m</span>
                </div>
              </div>

              {/* Focal length visualization */}
              <div className="text-center">
                <span className="text-xs text-gray-500">
                  {local.focalLength}mm · {local.focalLength < 35 ? "Wide" : local.focalLength < 70 ? "Normal" : "Telephoto"}
                </span>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Camera Controls
              </div>

              {/* Position sliders */}
              <div className="space-y-3">
                {(["x", "y", "z"] as const).map((axis) => (
                  <div key={axis}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-gray-400 uppercase font-mono">{axis}-axis</span>
                      <span className="text-gray-500 font-mono">
                        {local.cameraPosition[axis].toFixed(1)}m
                      </span>
                    </div>
                    <input
                      type="range"
                      min={axis === "y" ? 0 : -20}
                      max={axis === "y" ? 10 : 20}
                      step={0.1}
                      value={local.cameraPosition[axis]}
                      onChange={(e) => updatePos(axis, parseFloat(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {/* Focal length */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-gray-400">Focal Length</span>
                  <span className="text-gray-500 font-mono">{local.focalLength}mm</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={200}
                  step={1}
                  value={local.focalLength}
                  onChange={(e) => setLocal((p) => ({ ...p, focalLength: parseInt(e.target.value) }))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
                  <span>12mm Wide</span>
                  <span>50mm</span>
                  <span>200mm Tele</span>
                </div>
              </div>

              {/* Depth of field */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={local.depthOfField}
                  onChange={() => setLocal((p) => ({ ...p, depthOfField: !p.depthOfField }))}
                  className="rounded border-surface-border bg-surface-raised text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Depth of Field</span>
              </label>

              {/* Lens effects */}
              <div>
                <div className="text-xs font-medium text-gray-400 mb-2">Lens Effects</div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["filmGrain", "Film Grain"],
                      ["vignette", "Vignette"],
                      ["motionBlur", "Motion Blur"],
                      ["chromatic", "Chromatic"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={local.lensEffects[key]}
                        onChange={() => updateLens(key)}
                        className="rounded border-surface-border bg-surface-raised text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-xs text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-surface-border">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => { onSave(local); onClose(); }}
            >
              Apply Settings
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Delete Confirmation Modal
 * ══════════════════════════════════════════════════════════════════════════ */

function DeleteConfirmModal({
  open,
  sceneName,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  sceneName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <ModalContent className="max-w-sm">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <IconTrash />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">Delete Scene?</h3>
          <p className="text-sm text-gray-400 mb-6">
            Are you sure you want to delete &ldquo;{sceneName}&rdquo;? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={onConfirm}>
              Delete Scene
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Section Heading
 * ══════════════════════════════════════════════════════════════════════════ */

function SectionHeading({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Main Component
 * ══════════════════════════════════════════════════════════════════════════ */

export default function SceneConfigurator({
  initialScenes,
  characters: propCharacters,
  onChange,
  onSave,
  onDelete,
}: SceneConfiguratorProps) {
  /* ── State ─────────────────────────────────────────────────────────── */
  const [scenes, setScenes] = useState<ConfiguratorScene[]>(
    initialScenes ?? SAMPLE_SCENES,
  );
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    scenes[0]?.id ?? null,
  );
  const [cameraModalShot, setCameraModalShot] = useState<SceneShot | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [aiExpandingAction, setAiExpandingAction] = useState(false);

  const characters = propCharacters ?? DEFAULT_CHARACTERS;
  const selectedScene = scenes.find((s) => s.id === selectedSceneId) ?? null;

  /* ── Drag-to-reorder scenes (sidebar) ──────────────────────────────── */
  const [dragSceneId, setDragSceneId] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleSceneDragStart = useCallback((sceneId: string) => {
    setDragSceneId(sceneId);
  }, []);
  const handleSceneDragOver = useCallback(
    (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      if (dragSceneId) setDragOverIdx(idx);
    },
    [dragSceneId],
  );
  const handleSceneDrop = useCallback(
    (_e: React.DragEvent, dropIdx: number) => {
      if (!dragSceneId) return;
      const fromIdx = scenes.findIndex((s) => s.id === dragSceneId);
      if (fromIdx === -1 || fromIdx === dropIdx) {
        setDragSceneId(null);
        setDragOverIdx(null);
        return;
      }
      const next = [...scenes];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(dropIdx > fromIdx ? dropIdx - 1 : dropIdx, 0, moved!);
      // Renumber
      next.forEach((s, i) => { s.sceneNumber = i + 1; });
      setScenes(next);
      onChange?.(next);
      setDragSceneId(null);
      setDragOverIdx(null);
    },
    [dragSceneId, scenes, onChange],
  );
  const handleSceneDragEnd = useCallback(() => {
    setDragSceneId(null);
    setDragOverIdx(null);
  }, []);

  /* ── react-hook-form ───────────────────────────────────────────────── */
  const form = useForm<SceneFormValues>({
    defaultValues: selectedScene
      ? {
          title: selectedScene.title,
          location: selectedScene.location,
          timeOfDay: selectedScene.timeOfDay,
          weather: selectedScene.weather,
          mood: selectedScene.mood,
          action: selectedScene.action,
          dialogue: selectedScene.dialogue,
          lightingPreset: selectedScene.lightingPreset,
          autoLighting: selectedScene.autoLighting,
          lightingNotes: selectedScene.lightingNotes,
        }
      : undefined,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
  } = form;

  const dialogueFields = useFieldArray({ control, name: "dialogue" });
  const actionText = watch("action") ?? "";
  const wordCount = useMemo(
    () => actionText.trim().split(/\s+/).filter(Boolean).length,
    [actionText],
  );

  // Reset form when selected scene changes
  useEffect(() => {
    if (selectedScene) {
      reset({
        title: selectedScene.title,
        location: selectedScene.location,
        timeOfDay: selectedScene.timeOfDay,
        weather: selectedScene.weather,
        mood: selectedScene.mood,
        action: selectedScene.action,
        dialogue: selectedScene.dialogue,
        lightingPreset: selectedScene.lightingPreset,
        autoLighting: selectedScene.autoLighting,
        lightingNotes: selectedScene.lightingNotes,
      });
    }
  }, [selectedSceneId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Scene mutations ───────────────────────────────────────────────── */
  const updateScene = useCallback(
    (sceneId: string, updates: Partial<ConfiguratorScene>) => {
      setScenes((prev) => {
        const next = prev.map((s) =>
          s.id === sceneId ? { ...s, ...updates } : s,
        );
        onChange?.(next);
        return next;
      });
    },
    [onChange],
  );

  const handleFormSave = useCallback(
    (data: SceneFormValues) => {
      if (!selectedScene) return;
      const updated: ConfiguratorScene = {
        ...selectedScene,
        title: data.title,
        location: data.location,
        timeOfDay: data.timeOfDay,
        weather: data.weather,
        mood: data.mood,
        action: data.action,
        dialogue: data.dialogue,
        lightingPreset: data.lightingPreset,
        autoLighting: data.autoLighting,
        lightingNotes: data.lightingNotes,
      };
      updateScene(selectedScene.id, updated);
      onSave?.(updated);
    },
    [selectedScene, updateScene, onSave],
  );

  const addScene = useCallback(() => {
    const next = [...scenes];
    const newScene = createDefaultScene(next.length + 1);
    next.push(newScene);
    setScenes(next);
    setSelectedSceneId(newScene.id);
    onChange?.(next);
  }, [scenes, onChange]);

  const deleteScene = useCallback(() => {
    if (!selectedScene) return;
    const next = scenes.filter((s) => s.id !== selectedScene.id);
    next.forEach((s, i) => { s.sceneNumber = i + 1; });
    setScenes(next);
    setSelectedSceneId(next[0]?.id ?? null);
    setDeleteModalOpen(false);
    onDelete?.(selectedScene.id);
    onChange?.(next);
  }, [selectedScene, scenes, onDelete, onChange]);

  const duplicateScene = useCallback(() => {
    if (!selectedScene) return;
    const dup: ConfiguratorScene = {
      ...selectedScene,
      id: makeId(),
      sceneNumber: scenes.length + 1,
      title: `${selectedScene.title} (Copy)`,
      shots: selectedScene.shots.map((s) => ({ ...s, id: makeId() })),
      dialogue: selectedScene.dialogue.map((d) => ({ ...d, id: makeId() })),
    };
    const next = [...scenes, dup];
    setScenes(next);
    setSelectedSceneId(dup.id);
    onChange?.(next);
  }, [selectedScene, scenes, onChange]);

  /* ── Shot mutations ────────────────────────────────────────────────── */
  const addShot = useCallback(() => {
    if (!selectedScene) return;
    const newShot = createDefaultShot(selectedScene.shots.length);
    updateScene(selectedScene.id, {
      shots: [...selectedScene.shots, newShot],
    });
  }, [selectedScene, updateScene]);

  const updateShot = useCallback(
    (shotId: string, updates: Partial<SceneShot>) => {
      if (!selectedScene) return;
      updateScene(selectedScene.id, {
        shots: selectedScene.shots.map((s) =>
          s.id === shotId ? { ...s, ...updates } : s,
        ),
      });
    },
    [selectedScene, updateScene],
  );

  const removeShot = useCallback(
    (shotId: string) => {
      if (!selectedScene) return;
      updateScene(selectedScene.id, {
        shots: selectedScene.shots.filter((s) => s.id !== shotId),
      });
    },
    [selectedScene, updateScene],
  );

  /* ── AI Expand action text ─────────────────────────────────────────── */
  const handleAiExpand = useCallback(() => {
    setAiExpandingAction(true);
    // Simulate AI response
    setTimeout(() => {
      const current = actionText;
      const expanded = current
        ? `${current}\n\nThe camera slowly pans across the scene, revealing subtle details in the environment. The ambient sound builds as the tension between the characters becomes palpable. A slight breeze catches the edge of a curtain, casting shifting patterns of light across the floor.`
        : "The scene opens with a measured stillness. The environment tells its own story through carefully placed details — a half-empty cup of coffee, scattered papers, the faint hum of fluorescent lights. Each element contributes to the atmosphere, creating a lived-in world that draws the audience deeper into the narrative.";
      setValue("action", expanded);
      setAiExpandingAction(false);
    }, 1500);
  }, [actionText, setValue]);

  /* ── Camera modal handlers ─────────────────────────────────────────── */
  const openCameraModal = useCallback((shot: SceneShot) => {
    setCameraModalShot(shot);
    setCameraModalOpen(true);
  }, []);

  const handleCameraSave = useCallback(
    (updated: SceneShot) => {
      updateShot(updated.id, updated);
    },
    [updateShot],
  );

  /* ══════════════════════════════════════════════════════════════════════
   *  Render
   * ══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col sm:flex-row h-full min-h-0 bg-surface rounded-xl border border-surface-border overflow-hidden">
      {/* ════════════════════════════════════════════════════════════════
       *  Scene List Sidebar
       * ════════════════════════════════════════════════════════════════ */}
      <div className="w-full sm:w-[200px] flex-shrink-0 border-b sm:border-b-0 sm:border-r border-surface-border bg-surface-raised/50 flex flex-col max-h-[200px] sm:max-h-none">
        {/* Header */}
        <div className="p-3 border-b border-surface-border">
          <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <IconFilm /> Scenes
          </h2>
        </div>

        {/* Scene cards */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {scenes.map((scene, idx) => {
            const isSelected = scene.id === selectedSceneId;
            const totalDuration = scene.shots.reduce((sum, s) => sum + s.duration, 0);
            const isDragOver = dragOverIdx === idx;

            return (
              <div
                key={scene.id}
                className={`group relative rounded-lg p-2.5 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-purple-600/15 border border-purple-500/30 shadow-sm"
                    : "hover:bg-white/5 border border-transparent"
                } ${isDragOver ? "border-cyan-400 bg-cyan-400/5" : ""}`}
                onClick={() => setSelectedSceneId(scene.id)}
                draggable
                onDragStart={() => handleSceneDragStart(scene.id)}
                onDragOver={(e) => handleSceneDragOver(e, idx)}
                onDrop={(e) => handleSceneDrop(e, idx)}
                onDragEnd={handleSceneDragEnd}
              >
                {/* Drag handle */}
                <div className="absolute left-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 text-gray-500">
                  <IconGripVertical />
                </div>

                {/* Thumbnail placeholder */}
                <div className="w-full aspect-video bg-black/30 rounded mb-2 flex items-center justify-center border border-surface-border overflow-hidden">
                  {scene.thumbnailUrl ? (
                    <Image src={scene.thumbnailUrl} alt="" fill sizes="200px" className="object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-0.5">
                      <IconFilm />
                      <span className="text-[8px] text-gray-600">Scene {scene.sceneNumber}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="pl-3">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={isSelected ? "info" : "default"}
                      className="!text-[9px] !py-0 !px-1"
                    >
                      {scene.sceneNumber}
                    </Badge>
                    <span className="text-xs font-medium text-gray-200 truncate flex-1">
                      {scene.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                    <span>{scene.shots.length} shots</span>
                    <span>·</span>
                    <span>{formatDuration(totalDuration)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add scene button */}
        <div className="p-2 border-t border-surface-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            iconLeft={<IconPlus />}
            onClick={addScene}
          >
            Add Scene
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
       *  Scene Detail Panel
       * ════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto">
        {selectedScene ? (
          <form
            onSubmit={handleSubmit(handleFormSave)}
            className="p-6 space-y-8 max-w-4xl"
          >
            {/* ── Header / Actions ───────────────────────────────────── */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Scene {selectedScene.sceneNumber}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedScene.location || "No location set"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<IconCopy />}
                  onClick={duplicateScene}
                  type="button"
                >
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<IconTrash />}
                  onClick={() => setDeleteModalOpen(true)}
                  type="button"
                  className="text-red-400 hover:text-red-300"
                >
                  Delete
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={<IconSave />}
                  type="submit"
                >
                  Save Scene
                </Button>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
             *  A. Basic Info
             * ═══════════════════════════════════════════════════════════ */}
            <section>
              <SectionHeading icon={<IconFilm />} title="Basic Info" />

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 mb-4">
                <div>
                  <Input
                    label="Title"
                    {...register("title", { required: true })}
                    placeholder="Scene title..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Scene Number
                  </label>
                  <div className="bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-300 font-mono">
                    {selectedScene.sceneNumber}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Location Description
                </label>
                <textarea
                  {...register("location")}
                  placeholder="INT. DOWNTOWN CAFÉ - DAY"
                  rows={2}
                  className="w-full bg-surface-raised border border-surface-border text-gray-100 text-sm rounded-lg px-3 py-2 resize-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder:text-gray-600"
                />
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-3 gap-4">
                <Controller
                  control={control}
                  name="timeOfDay"
                  render={({ field }) => (
                    <Select
                      label="Time of Day"
                      value={field.value}
                      onChange={field.onChange}
                      options={TIME_OF_DAY_OPTIONS.map((o) => ({
                        value: o.value,
                        label: `${o.icon} ${o.label}`,
                      }))}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="weather"
                  render={({ field }) => (
                    <Select
                      label="Weather"
                      value={field.value}
                      onChange={field.onChange}
                      options={WEATHER_OPTIONS.map((o) => ({
                        value: o.value,
                        label: `${o.icon} ${o.label}`,
                      }))}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="mood"
                  render={({ field }) => (
                    <Select
                      label="Mood / Tone"
                      value={field.value}
                      onChange={field.onChange}
                      options={MOOD_OPTIONS}
                    />
                  )}
                />
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
             *  B. Action Description
             * ═══════════════════════════════════════════════════════════ */}
            <section>
              <SectionHeading icon={<IconSparkles />} title="Action Description">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500 font-mono">
                    {wordCount} word{wordCount !== 1 ? "s" : ""}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<IconSparkles />}
                    onClick={handleAiExpand}
                    type="button"
                    loading={aiExpandingAction}
                  >
                    AI Expand
                  </Button>
                </div>
              </SectionHeading>

              <textarea
                {...register("action")}
                placeholder="Describe what happens in this scene..."
                rows={6}
                className="w-full bg-surface-raised border border-surface-border text-gray-100 text-sm rounded-lg px-4 py-3 resize-y focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder:text-gray-600 leading-relaxed font-mono"
              />
            </section>

            {/* ═══════════════════════════════════════════════════════════
             *  C. Dialogue
             * ═══════════════════════════════════════════════════════════ */}
            <section>
              <SectionHeading icon={<IconMessageSquare />} title="Dialogue">
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<IconPlus />}
                  onClick={() =>
                    dialogueFields.append({
                      id: makeId(),
                      characterName: characters[0] ?? "",
                      text: "",
                      parenthetical: "",
                      timingSeconds: 0,
                    })
                  }
                  type="button"
                >
                  Add Line
                </Button>
              </SectionHeading>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {dialogueFields.fields.map((field, idx) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="bg-surface-raised/50 border border-surface-border rounded-lg p-3 group relative"
                    >
                      {/* Drag handle + line number */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <span className="text-[9px] text-gray-600 font-mono">
                            #{idx + 1}
                          </span>
                          <div className="cursor-grab text-gray-600 hover:text-gray-400">
                            <IconGripVertical />
                          </div>
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            {/* Character selector */}
                            <Controller
                              control={control}
                              name={`dialogue.${idx}.characterName`}
                              render={({ field: f }) => (
                                <Select
                                  value={f.value}
                                  onChange={f.onChange}
                                  options={characters.map((c) => ({
                                    value: c,
                                    label: c,
                                  }))}
                                  label="Character"
                                />
                              )}
                            />
                            {/* Parenthetical */}
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-1">
                                Delivery
                              </label>
                              <input
                                {...register(`dialogue.${idx}.parenthetical`)}
                                placeholder="(quietly)"
                                className="w-full bg-surface-raised border border-surface-border text-gray-100 text-sm rounded-lg px-3 py-2 placeholder:text-gray-600 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors italic"
                              />
                            </div>
                            {/* Timing */}
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-1">
                                Timing (sec)
                              </label>
                              <input
                                type="number"
                                step={0.5}
                                min={0}
                                {...register(`dialogue.${idx}.timingSeconds`, {
                                  valueAsNumber: true,
                                })}
                                className="w-full bg-surface-raised border border-surface-border text-gray-100 text-sm rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                              />
                            </div>
                          </div>
                          {/* Dialogue text */}
                          <textarea
                            {...register(`dialogue.${idx}.text`)}
                            placeholder="Dialogue text..."
                            rows={2}
                            className="w-full bg-surface-raised border border-surface-border text-gray-100 text-sm rounded-lg px-3 py-2 resize-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder:text-gray-600"
                          />
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => dialogueFields.remove(idx)}
                          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1 mt-1"
                          title="Remove line"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {dialogueFields.fields.length === 0 && (
                  <div className="text-center py-8 text-gray-600 text-sm">
                    No dialogue lines yet. Click &ldquo;Add Line&rdquo; to begin.
                  </div>
                )}
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
             *  D. Camera Instructions / Shots
             * ═══════════════════════════════════════════════════════════ */}
            <section>
              <SectionHeading icon={<IconCamera />} title="Camera Instructions">
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<IconPlus />}
                  onClick={addShot}
                  type="button"
                >
                  Add Shot
                </Button>
              </SectionHeading>

              <div className="space-y-3">
                {selectedScene.shots.map((shot, idx) => (
                  <div
                    key={shot.id}
                    className="bg-surface-raised/50 border border-surface-border rounded-lg p-4 group relative"
                  >
                    <div className="flex items-start gap-4">
                      {/* Shot number & type badge */}
                      <div className="flex flex-col items-center gap-1 pt-0.5">
                        <span className="w-7 h-7 rounded-md bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300">
                          {idx + 1}
                        </span>
                        <div className="cursor-grab text-gray-600 hover:text-gray-400">
                          <IconGripVertical />
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <Select
                            label="Shot Type"
                            value={shot.shotType}
                            onChange={(v) =>
                              updateShot(shot.id, {
                                shotType: v as ShotType,
                              })
                            }
                            options={SHOT_TYPE_OPTIONS}
                          />
                          <Select
                            label="Camera Movement"
                            value={shot.cameraMovement}
                            onChange={(v) =>
                              updateShot(shot.id, {
                                cameraMovement: v as CameraMovement,
                              })
                            }
                            options={CAMERA_MOVEMENT_OPTIONS}
                          />
                          {/* Duration slider */}
                          <div>
                            <div className="flex justify-between text-xs font-medium text-gray-400 mb-1">
                              <span>Duration</span>
                              <span className="font-mono text-gray-500">
                                {formatDuration(shot.duration)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0.5}
                              max={30}
                              step={0.5}
                              value={shot.duration}
                              onChange={(e) =>
                                updateShot(shot.id, {
                                  duration: parseFloat(e.target.value),
                                })
                              }
                              className="w-full accent-purple-500 cursor-pointer mt-1"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <input
                          type="text"
                          value={shot.description}
                          onChange={(e) =>
                            updateShot(shot.id, { description: e.target.value })
                          }
                          placeholder="Shot description..."
                          className="w-full bg-surface-raised border border-surface-border text-gray-100 text-sm rounded-lg px-3 py-2 placeholder:text-gray-600 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        />

                        {/* Quick info badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="default" className="!text-[9px]">
                            {shot.focalLength}mm
                          </Badge>
                          {shot.depthOfField && (
                            <Badge variant="info" className="!text-[9px]">
                              DoF
                            </Badge>
                          )}
                          {shot.lensEffects.filmGrain && (
                            <Badge variant="default" className="!text-[9px]">
                              Grain
                            </Badge>
                          )}
                          {shot.lensEffects.vignette && (
                            <Badge variant="default" className="!text-[9px]">
                              Vignette
                            </Badge>
                          )}
                          {shot.lensEffects.motionBlur && (
                            <Badge variant="default" className="!text-[9px]">
                              Blur
                            </Badge>
                          )}
                          {shot.lensEffects.chromatic && (
                            <Badge variant="default" className="!text-[9px]">
                              Chromatic
                            </Badge>
                          )}

                          <div className="flex-1" />

                          <Button
                            variant="ghost"
                            size="sm"
                            iconLeft={<IconCrosshair />}
                            onClick={() => openCameraModal(shot)}
                            type="button"
                            className="!text-xs"
                          >
                            Configure Camera
                          </Button>
                        </div>
                      </div>

                      {/* Remove shot */}
                      <button
                        type="button"
                        onClick={() => removeShot(shot.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1 mt-1"
                        title="Remove shot"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                ))}

                {selectedScene.shots.length === 0 && (
                  <div className="text-center py-8 text-gray-600 text-sm">
                    No shots configured. Click &ldquo;Add Shot&rdquo; to begin.
                  </div>
                )}
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
             *  E. Lighting Setup
             * ═══════════════════════════════════════════════════════════ */}
            <section>
              <SectionHeading icon={<IconLightbulb />} title="Lighting Setup" />

              {/* Preset selector (visual grid) */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Lighting Preset
                </label>
                <Controller
                  control={control}
                  name="lightingPreset"
                  render={({ field }) => (
                    <div className="grid grid-cols-4 gap-2">
                      {LIGHTING_PRESET_OPTIONS.map((preset) => {
                        const isActive = field.value === preset.value;
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => field.onChange(preset.value)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                              isActive
                                ? "bg-purple-600/15 border-purple-500/40 text-white"
                                : "border-surface-border text-gray-400 hover:border-gray-600 hover:text-gray-300"
                            }`}
                          >
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: preset.color }}
                            />
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              {/* Auto-lighting toggle */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Controller
                    control={control}
                    name="autoLighting"
                    render={({ field }) => (
                      <div
                        onClick={() => field.onChange(!field.value)}
                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                          field.value ? "bg-purple-600" : "bg-gray-700"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            field.value ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    )}
                  />
                  <div>
                    <span className="text-sm text-gray-300 flex items-center gap-1.5">
                      <IconSun /> Time-based Auto-Lighting
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">
                      Automatically adjust lighting based on time of day setting
                    </span>
                  </div>
                </label>
              </div>

              {/* Custom lighting notes */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Custom Lighting Notes
                </label>
                <textarea
                  {...register("lightingNotes")}
                  placeholder="Additional lighting details, practical lights, color gels..."
                  rows={3}
                  className="w-full bg-surface-raised border border-surface-border text-gray-100 text-sm rounded-lg px-3 py-2 resize-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder:text-gray-600"
                />
              </div>
            </section>

            {/* Bottom spacer */}
            <div className="h-8" />
          </form>
        ) : (
          /* ── Empty state ─────────────────────────────────────────────── */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-surface-raised border border-surface-border flex items-center justify-center mx-auto mb-4 text-gray-600">
                <IconFilm />
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Select a scene from the sidebar or create a new one
              </p>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<IconPlus />}
                onClick={addScene}
              >
                Create Scene
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
       *  Modals
       * ════════════════════════════════════════════════════════════════ */}
      {cameraModalShot && (
        <CameraConfigModal
          shot={cameraModalShot}
          open={cameraModalOpen}
          onClose={() => setCameraModalOpen(false)}
          onSave={handleCameraSave}
        />
      )}

      <DeleteConfirmModal
        open={deleteModalOpen}
        sceneName={selectedScene?.title ?? ""}
        onConfirm={deleteScene}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
