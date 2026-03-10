"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button, Badge } from "@genesis/ui";

/* ══════════════════════════════════════════════════════════════════════════
 *  Types
 * ══════════════════════════════════════════════════════════════════════════ */

export type ShotStatus = "pending" | "rendering" | "complete" | "error";

export interface TimelineShot {
  id: string;
  sceneNumber: number;
  shotNumber: number;
  /** Duration in seconds */
  duration: number;
  thumbnailUrl: string | null;
  status: ShotStatus;
  description: string;
}

export interface DialogueBlock {
  id: string;
  characterName: string;
  line: string;
  /** Start time in seconds */
  startTime: number;
  /** Duration in seconds */
  duration: number;
}

export interface AudioBlock {
  id: string;
  label: string;
  startTime: number;
  duration: number;
  type: "music" | "sfx";
}

export interface TimelineEditorProps {
  shots?: TimelineShot[];
  dialogueBlocks?: DialogueBlock[];
  audioBlocks?: AudioBlock[];
  fps?: number;
  resolution?: { width: number; height: number };
  onShotSelect?: (shot: TimelineShot) => void;
  onShotReorder?: (shots: TimelineShot[]) => void;
  onShotResize?: (shotId: string, newDuration: number) => void;
  onShotAction?: (
    shotId: string,
    action: "edit" | "regenerate" | "delete" | "duplicate",
  ) => void;
  onRenderSettings?: () => void;
  onExport?: () => void;
  /** Collaboration: map of shotId → { userId, displayName, color } for selected shots */
  shotSelections?: Map<string, { userId: string; displayName: string; color: string }>;
  /** Collaboration: remote playhead position (seconds) */
  remotePlayhead?: number | null;
  /** Collaboration: callback when local playhead changes */
  onPlayheadSync?: (position: number) => void;
  /** Collaboration: whether user has edit permission */
  canEdit?: boolean;
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Constants
 * ══════════════════════════════════════════════════════════════════════════ */

const MIN_ZOOM = 25;
const MAX_ZOOM = 400;
const DEFAULT_ZOOM = 100;
/** Pixels per second at 100% zoom */
const BASE_PX_PER_SEC = 80;
const TRACK_HEIGHT = 56;
const RULER_HEIGHT = 28;
const MIN_TIMELINE_HEIGHT = 160;
const MAX_TIMELINE_HEIGHT = 500;

const STATUS_COLORS: Record<ShotStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-gray-600/40", text: "text-gray-400", label: "Pending" },
  rendering: { bg: "bg-amber-600/40", text: "text-amber-400", label: "Rendering" },
  complete: { bg: "bg-emerald-600/40", text: "text-emerald-400", label: "Complete" },
  error: { bg: "bg-red-600/40", text: "text-red-400", label: "Error" },
};

/* ══════════════════════════════════════════════════════════════════════════
 *  Sample Data
 * ══════════════════════════════════════════════════════════════════════════ */

const SAMPLE_SHOTS: TimelineShot[] = [
  { id: "s1", sceneNumber: 1, shotNumber: 1, duration: 4.5, thumbnailUrl: null, status: "complete", description: "Wide establishing shot of city skyline at dawn" },
  { id: "s2", sceneNumber: 1, shotNumber: 2, duration: 3.0, thumbnailUrl: null, status: "complete", description: "Medium shot of protagonist walking" },
  { id: "s3", sceneNumber: 1, shotNumber: 3, duration: 2.5, thumbnailUrl: null, status: "rendering", description: "Close-up on face, expression of determination" },
  { id: "s4", sceneNumber: 2, shotNumber: 1, duration: 5.0, thumbnailUrl: null, status: "pending", description: "Interior café, warm lighting" },
  { id: "s5", sceneNumber: 2, shotNumber: 2, duration: 3.5, thumbnailUrl: null, status: "pending", description: "Two-shot dialogue" },
  { id: "s6", sceneNumber: 2, shotNumber: 3, duration: 2.0, thumbnailUrl: null, status: "error", description: "Reaction close-up" },
  { id: "s7", sceneNumber: 3, shotNumber: 1, duration: 6.0, thumbnailUrl: null, status: "pending", description: "Tracking shot through hallway" },
  { id: "s8", sceneNumber: 3, shotNumber: 2, duration: 4.0, thumbnailUrl: null, status: "pending", description: "Over-the-shoulder reveal" },
];

const SAMPLE_DIALOGUE: DialogueBlock[] = [
  { id: "d1", characterName: "SARAH", line: "I wasn't sure you'd come.", startTime: 5.0, duration: 2.5 },
  { id: "d2", characterName: "MARCUS", line: "I almost didn't.", startTime: 8.0, duration: 1.5 },
  { id: "d3", characterName: "SARAH", line: "We need to talk about what happened.", startTime: 10.0, duration: 3.0 },
];

const SAMPLE_AUDIO: AudioBlock[] = [
  { id: "m1", label: "Ambient City", startTime: 0, duration: 10, type: "music" },
  { id: "m2", label: "Café Piano", startTime: 10, duration: 10.5, type: "music" },
  { id: "fx1", label: "Footsteps", startTime: 3, duration: 2, type: "sfx" },
  { id: "fx2", label: "Door Open", startTime: 10, duration: 0.8, type: "sfx" },
  { id: "fx3", label: "Cup Clink", startTime: 14, duration: 0.5, type: "sfx" },
];

const CHARACTER_COLORS: Record<string, string> = {
  SARAH: "#c084fc",
  MARCUS: "#f472b6",
  WAITRESS: "#22d3ee",
};

/* ══════════════════════════════════════════════════════════════════════════
 *  Icons
 * ══════════════════════════════════════════════════════════════════════════ */

function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function IconSkipBack() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="11 19 2 12 11 5 11 19" /><polygon points="22 19 13 12 22 5 22 19" />
    </svg>
  );
}

function IconSkipForward() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="13 19 22 12 13 5 13 19" /><polygon points="2 19 11 12 2 5 2 19" />
    </svg>
  );
}

function IconMaximize() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconMagnet() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 15-4-4 6.75-6.77a7.79 7.79 0 0 1 11 11L13 22l-4-4 6.39-6.36a2.14 2.14 0 0 0-3-3L6 15" /><path d="m5 8 4 4" /><path d="m12 15 4 4" />
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

function IconVolume() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function IconMusic() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Utility helpers
 * ══════════════════════════════════════════════════════════════════════════ */

/** Format seconds into SMPTE-style timecode HH:MM:SS:FF */
function formatTimecode(seconds: number, fps: number): string {
  const totalFrames = Math.floor(seconds * fps);
  const ff = totalFrames % fps;
  const totalSecs = Math.floor(seconds);
  const ss = totalSecs % 60;
  const mm = Math.floor(totalSecs / 60) % 60;
  const hh = Math.floor(totalSecs / 3600);
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}:${pad(ff)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Format seconds compactly: e.g. "3.5s" */
function formatDuration(sec: number): string {
  return sec % 1 === 0 ? `${sec}s` : `${sec.toFixed(1)}s`;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Sub-components
 * ══════════════════════════════════════════════════════════════════════════ */

/* ── Context Menu ──────────────────────────────────────────────────────── */

interface ContextMenuState {
  x: number;
  y: number;
  shotId: string;
}

function ShotContextMenu({
  menu,
  onAction,
  onClose,
}: {
  menu: ContextMenuState;
  onAction: (action: "edit" | "regenerate" | "delete" | "duplicate") => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: globalThis.MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const items = [
    { action: "edit" as const, label: "Edit Shot", icon: <IconPencil /> },
    { action: "regenerate" as const, label: "Regenerate", icon: <IconRefresh /> },
    { action: "duplicate" as const, label: "Duplicate", icon: <IconCopy /> },
    { action: "delete" as const, label: "Delete", icon: <IconTrash />, danger: true },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className="fixed z-[100] py-1 w-44 rounded-lg border border-surface-border bg-surface-raised shadow-2xl"
      style={{ left: menu.x, top: menu.y }}
    >
      {items.map(({ action, label, icon, danger }) => (
        <button
          key={action}
          onClick={() => { onAction(action); onClose(); }}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
            danger
              ? "text-red-400 hover:bg-red-500/10"
              : "text-gray-300 hover:bg-purple-500/10 hover:text-white"
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </motion.div>
  );
}

/* ── Time Ruler ──────────────────────────────────────────────────────────── */

function TimeRuler({
  totalWidth,
  pxPerSec,
  scrollLeft,
  visibleWidth,
}: {
  totalWidth: number;
  pxPerSec: number;
  scrollLeft: number;
  visibleWidth: number;
}) {
  // Decide tick interval based on zoom
  let majorInterval = 1; // seconds
  if (pxPerSec < 30) majorInterval = 10;
  else if (pxPerSec < 60) majorInterval = 5;
  else if (pxPerSec < 120) majorInterval = 2;

  const startSec = Math.floor(scrollLeft / pxPerSec / majorInterval) * majorInterval;
  const endSec = Math.ceil((scrollLeft + visibleWidth) / pxPerSec / majorInterval) * majorInterval + majorInterval;

  const ticks: { sec: number; x: number }[] = [];
  for (let s = startSec; s <= endSec; s += majorInterval) {
    if (s < 0) continue;
    ticks.push({ sec: s, x: s * pxPerSec });
  }

  return (
    <div
      className="relative h-full border-b border-surface-border select-none"
      style={{ width: totalWidth }}
    >
      {ticks.map(({ sec, x }) => (
        <div key={sec} className="absolute top-0 h-full" style={{ left: x }}>
          <div className="w-px h-3 bg-gray-600" />
          <span className="absolute top-3 left-1 text-[9px] text-gray-500 font-mono whitespace-nowrap">
            {sec >= 60 ? `${Math.floor(sec / 60)}:${pad(sec % 60)}` : `${sec}s`}
          </span>
        </div>
      ))}
      {/* Sub-ticks */}
      {majorInterval <= 2 &&
        ticks.map(({ sec, x }) => {
          const sub = [];
          const subCount = majorInterval === 1 ? 4 : 4;
          const subStep = (majorInterval * pxPerSec) / subCount;
          for (let i = 1; i < subCount; i++) {
            sub.push(
              <div
                key={`${sec}-sub-${i}`}
                className="absolute top-0 w-px h-1.5 bg-gray-700"
                style={{ left: x + i * subStep }}
              />,
            );
          }
          return sub;
        })}
    </div>
  );
}

/* ── Waveform (decorative) ───────────────────────────────────────────── */

function MiniWaveform({ width, color }: { width: number; color: string }) {
  const barCount = Math.max(4, Math.floor(width / 4));
  return (
    <div className="flex items-center gap-[1px] h-full px-1" style={{ width }}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-full min-w-[1px]"
          style={{
            height: `${20 + Math.sin(i * 0.7) * 30 + Math.random() * 20}%`,
            backgroundColor: color,
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Main Component
 * ══════════════════════════════════════════════════════════════════════════ */

export default function TimelineEditor({
  shots: propShots,
  dialogueBlocks: propDialogue,
  audioBlocks: propAudio,
  fps = 24,
  resolution = { width: 1920, height: 1080 },
  onShotSelect,
  onShotReorder,
  onShotResize,
  onShotAction,
  onRenderSettings,
  onExport,
  shotSelections = new Map(),
  remotePlayhead,
  onPlayheadSync: _onPlayheadSync,
  canEdit = true,
}: TimelineEditorProps) {
  /* ── State ─────────────────────────────────────────────────────────── */
  const [shots, setShots] = useState<TimelineShot[]>(propShots ?? SAMPLE_SHOTS);
  const [dialogue] = useState<DialogueBlock[]>(propDialogue ?? SAMPLE_DIALOGUE);
  const [audio] = useState<AudioBlock[]>(propAudio ?? SAMPLE_AUDIO);

  const [selectedShotId, setSelectedShotId] = useState<string | null>(shots[0]?.id ?? null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [timelineHeight, setTimelineHeight] = useState(240);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isDraggingResize, setIsDraggingResize] = useState(false);
  const [dragResizeShotId, setDragResizeShotId] = useState<string | null>(null);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);

  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* ── Derived values ────────────────────────────────────────────────── */
  const pxPerSec = (BASE_PX_PER_SEC * zoom) / 100;
  const totalDuration = useMemo(
    () => shots.reduce((sum, s) => sum + s.duration, 0),
    [shots],
  );
  const totalWidth = Math.max(totalDuration * pxPerSec + 200, 800);
  const _selectedShot = shots.find((s) => s.id === selectedShotId) ?? null;

  /** Compute cumulative start time for each shot */
  const shotStartTimes = useMemo(() => {
    const map = new Map<string, number>();
    let t = 0;
    for (const s of shots) {
      map.set(s.id, t);
      t += s.duration;
    }
    return map;
  }, [shots]);

  /* ── Playback ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (playing) {
      playIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1 / fps;
          if (next >= totalDuration) {
            setPlaying(false);
            return 0;
          }
          return next;
        });
      }, 1000 / fps);
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [playing, fps, totalDuration]);

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    if (!playing || !timelineScrollRef.current) return;
    const el = timelineScrollRef.current;
    const playheadX = currentTime * pxPerSec;
    if (playheadX > el.scrollLeft + el.clientWidth - 60) {
      el.scrollLeft = playheadX - 60;
    }
  }, [currentTime, playing, pxPerSec]);

  // Sync prop shots
  useEffect(() => {
    if (propShots) setShots(propShots);
  }, [propShots]);

  /* ── Transport controls ────────────────────────────────────────────── */
  const togglePlay = useCallback(() => setPlaying((p) => !p), []);
  const skipBackward = useCallback(() => {
    setCurrentTime((t) => Math.max(0, t - 5));
  }, []);
  const skipForward = useCallback(() => {
    setCurrentTime((t) => Math.min(totalDuration, t + 5));
  }, [totalDuration]);

  /* ── Playhead dragging ─────────────────────────────────────────────── */
  const handlePlayheadPointerDown = useCallback(() => {
    setIsDraggingPlayhead(true);
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (!isDraggingPlayhead) return;
    function onMove(e: globalThis.PointerEvent) {
      if (!timelineScrollRef.current) return;
      const rect = timelineScrollRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + timelineScrollRef.current.scrollLeft;
      setCurrentTime(clamp(x / pxPerSec, 0, totalDuration));
    }
    function onUp() {
      setIsDraggingPlayhead(false);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDraggingPlayhead, pxPerSec, totalDuration]);

  /* ── Ruler click to scrub ──────────────────────────────────────────── */
  const handleRulerClick = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!timelineScrollRef.current) return;
      const rect = timelineScrollRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + timelineScrollRef.current.scrollLeft;
      setCurrentTime(clamp(x / pxPerSec, 0, totalDuration));
      setPlaying(false);
    },
    [pxPerSec, totalDuration],
  );

  /* ── Shot resize (right edge drag) ─────────────────────────────────── */
  const handleResizePointerDown = useCallback(
    (e: ReactPointerEvent, shotId: string) => {
      e.stopPropagation();
      e.preventDefault();
      setDragResizeShotId(shotId);
      setIsDraggingResize(true);
    },
    [],
  );

  useEffect(() => {
    if (!isDraggingResize || !dragResizeShotId) return;
    const startShot = shots.find((s) => s.id === dragResizeShotId);
    const shotStart = shotStartTimes.get(dragResizeShotId) ?? 0;
    if (!startShot) return;

    function onMove(e: globalThis.PointerEvent) {
      if (!timelineScrollRef.current) return;
      const rect = timelineScrollRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + timelineScrollRef.current.scrollLeft;
      const newEnd = x / pxPerSec;
      let newDuration = newEnd - shotStart;
      if (snapToGrid) newDuration = Math.round(newDuration * 2) / 2; // snap to 0.5s
      newDuration = Math.max(0.5, newDuration);

      setShots((prev) =>
        prev.map((s) =>
          s.id === dragResizeShotId ? { ...s, duration: newDuration } : s,
        ),
      );
      onShotResize?.(dragResizeShotId!, newDuration);
    }
    function onUp() {
      setIsDraggingResize(false);
      setDragResizeShotId(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDraggingResize, dragResizeShotId, shots, shotStartTimes, pxPerSec, snapToGrid, onShotResize]);

  /* ── Drag to reorder shots ─────────────────────────────────────────── */
  const [dragShotId, setDragShotId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((shotId: string) => {
    setDragShotId(shotId);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      if (dragShotId) setDragOverIndex(idx);
    },
    [dragShotId],
  );

  const handleDrop = useCallback(
    (_e: React.DragEvent, dropIdx: number) => {
      if (!dragShotId) return;
      const fromIdx = shots.findIndex((s) => s.id === dragShotId);
      if (fromIdx === -1 || fromIdx === dropIdx) {
        setDragShotId(null);
        setDragOverIndex(null);
        return;
      }
      const next = [...shots];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(dropIdx > fromIdx ? dropIdx - 1 : dropIdx, 0, moved!);
      setShots(next);
      onShotReorder?.(next);
      setDragShotId(null);
      setDragOverIndex(null);
    },
    [dragShotId, shots, onShotReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDragShotId(null);
    setDragOverIndex(null);
  }, []);

  /* ── Timeline / Preview splitter drag ──────────────────────────────── */
  useEffect(() => {
    if (!isDraggingSplitter) return;
    function onMove(e: globalThis.PointerEvent) {
      if (!wrapperRef.current) return;
      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const fromBottom = wrapperRect.bottom - e.clientY;
      setTimelineHeight(clamp(fromBottom, MIN_TIMELINE_HEIGHT, MAX_TIMELINE_HEIGHT));
    }
    function onUp() { setIsDraggingSplitter(false); }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDraggingSplitter]);

  /* ── Zoom with mouse wheel ─────────────────────────────────────────── */
  const handleTimelineWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => clamp(z + (e.deltaY > 0 ? -10 : 10), MIN_ZOOM, MAX_ZOOM));
    }
  }, []);

  /* ── Shot selection ────────────────────────────────────────────────── */
  const handleShotClick = useCallback(
    (shot: TimelineShot) => {
      setSelectedShotId(shot.id);
      const start = shotStartTimes.get(shot.id) ?? 0;
      setCurrentTime(start);
      onShotSelect?.(shot);
    },
    [shotStartTimes, onShotSelect],
  );

  /* ── Context menu ──────────────────────────────────────────────────── */
  const handleShotContextMenu = useCallback(
    (e: ReactMouseEvent, shotId: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, shotId });
      setSelectedShotId(shotId);
    },
    [],
  );

  const handleContextAction = useCallback(
    (action: "edit" | "regenerate" | "delete" | "duplicate") => {
      if (!contextMenu) return;
      onShotAction?.(contextMenu.shotId, action);

      if (action === "delete") {
        setShots((prev) => prev.filter((s) => s.id !== contextMenu.shotId));
        if (selectedShotId === contextMenu.shotId) setSelectedShotId(null);
      }
      if (action === "duplicate") {
        const orig = shots.find((s) => s.id === contextMenu.shotId);
        if (orig) {
          const idx = shots.indexOf(orig);
          const dup: TimelineShot = {
            ...orig,
            id: `${orig.id}-dup-${Date.now()}`,
            status: "pending",
          };
          const next = [...shots];
          next.splice(idx + 1, 0, dup);
          setShots(next);
        }
      }
    },
    [contextMenu, shots, selectedShotId, onShotAction],
  );

  /* ── Fullscreen toggle ─────────────────────────────────────────────── */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((f) => !f);
  }, []);

  /* ── Determine which shot is "current" for preview ─────────────────── */
  const currentShot = useMemo(() => {
    let t = 0;
    for (const s of shots) {
      if (currentTime >= t && currentTime < t + s.duration) return s;
      t += s.duration;
    }
    return shots[shots.length - 1] ?? null;
  }, [shots, currentTime]);

  /* ══════════════════════════════════════════════════════════════════════
   *  Render
   * ══════════════════════════════════════════════════════════════════════ */

  const music = audio.filter((a) => a.type === "music");
  const sfx = audio.filter((a) => a.type === "sfx");

  return (
    <div
      ref={wrapperRef}
      className="flex flex-col h-full min-h-0 bg-surface rounded-xl border border-surface-border overflow-hidden select-none"
    >
      {/* ════════════════════════════════════════════════════════════════
       *  Top Toolbar
       * ════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 border-b border-surface-border bg-surface-raised/50 flex-shrink-0 overflow-x-auto">
        {/* Transport */}
        <div className="flex items-center gap-1">
          <button
            onClick={skipBackward}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Skip backward 5s"
          >
            <IconSkipBack />
          </button>
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-600 text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20"
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <IconPause /> : <IconPlay />}
          </button>
          <button
            onClick={skipForward}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Skip forward 5s"
          >
            <IconSkipForward />
          </button>
        </div>

        {/* Timecode */}
        <div className="ml-2 font-mono text-xs text-gray-300 bg-black/30 px-3 py-1.5 rounded-md border border-surface-border min-w-[110px] text-center tracking-widest">
          {formatTimecode(currentTime, fps)}
        </div>

        <div className="hidden sm:block w-px h-5 bg-surface-border mx-2" />

        {/* Zoom */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[10px] text-gray-500">−</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={5}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24 accent-purple-500 cursor-pointer"
          />
          <span className="text-[10px] text-gray-500">+</span>
          <span className="text-[10px] text-gray-400 font-mono w-8 text-right">
            {zoom}%
          </span>
        </div>

        {/* Snap toggle */}
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium border transition-colors ${
            snapToGrid
              ? "bg-purple-600/20 border-purple-500/30 text-purple-300"
              : "border-surface-border text-gray-500 hover:text-gray-300"
          }`}
          title="Snap to grid"
        >
          <IconMagnet />
          Snap
        </button>

        <div className="flex-1" />

        {/* Right side */}
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<IconSettings />}
          onClick={onRenderSettings}
        >
          Render
        </Button>
        <Button
          variant="secondary"
          size="sm"
          iconLeft={<IconDownload />}
          onClick={onExport}
        >
          Export
        </Button>
      </div>

      {/* ════════════════════════════════════════════════════════════════
       *  Preview Panel
       * ════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-[200px] sm:min-h-0 flex items-center justify-center bg-black/40 relative overflow-hidden">
        {/* 16:9 container */}
        <div
          className={`relative bg-black border border-surface-border rounded-md overflow-hidden ${
            isFullscreen ? "w-full h-full rounded-none" : "w-[95%] sm:w-[80%] max-w-3xl"
          }`}
          style={isFullscreen ? {} : { aspectRatio: "16/9" }}
        >
          {/* Preview content */}
          {currentShot ? (
            <div className="absolute inset-0 flex items-center justify-center">
              {currentShot.thumbnailUrl ? (
                <Image
                  src={currentShot.thumbnailUrl}
                  alt={currentShot.description}
                  fill
                  sizes="(max-width: 768px) 100vw, 80vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-600">
                  <IconFilm />
                  <span className="text-xs">
                    S{currentShot.sceneNumber} / Shot {currentShot.shotNumber}
                  </span>
                  <span className="text-[10px] text-gray-700 max-w-xs text-center">
                    {currentShot.description}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs">
              No shots
            </div>
          )}

          {/* Overlay info */}
          <div className="absolute top-2 left-3 flex items-center gap-2">
            {currentShot && (
              <Badge variant="default" className="!text-[9px] !py-0 !px-1.5 bg-black/60 backdrop-blur">
                S{currentShot.sceneNumber} / Shot {currentShot.shotNumber}
              </Badge>
            )}
            <span className="text-[9px] text-gray-500 font-mono bg-black/50 backdrop-blur px-1.5 py-0.5 rounded">
              {fps}fps · {resolution.width}×{resolution.height}
            </span>
          </div>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-2 right-3 w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-white bg-black/50 backdrop-blur transition-colors"
            title="Toggle fullscreen"
          >
            <IconMaximize />
          </button>

          {/* Progress bar */}
          <div className="absolute bottom-0 inset-x-0 h-1 bg-gray-800">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-[width] duration-75"
              style={{
                width: totalDuration > 0 ? `${(currentTime / totalDuration) * 100}%` : "0%",
              }}
            />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
       *  Splitter handle
       * ════════════════════════════════════════════════════════════════ */}
      <div
        onPointerDown={() => setIsDraggingSplitter(true)}
        className="h-1.5 flex-shrink-0 bg-surface-border hover:bg-purple-500/40 cursor-row-resize transition-colors flex items-center justify-center"
      >
        <div className="w-8 h-0.5 rounded bg-gray-600" />
      </div>

      {/* ════════════════════════════════════════════════════════════════
       *  Timeline Area
       * ════════════════════════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 flex flex-col overflow-hidden bg-surface-raised/30"
        style={{ height: timelineHeight }}
      >
        {/* Track labels + timeline content side-by-side */}
        <div className="flex flex-1 min-h-0">
          {/* ── Track labels column ──────────────────────────────────── */}
          <div className="w-28 flex-shrink-0 border-r border-surface-border bg-surface-raised/50 flex flex-col">
            {/* Ruler spacer */}
            <div className="flex-shrink-0 border-b border-surface-border" style={{ height: RULER_HEIGHT }} />
            {/* Video */}
            <div
              className="flex items-center gap-1.5 px-2 border-b border-surface-border text-[11px] text-gray-400 font-medium"
              style={{ height: TRACK_HEIGHT }}
            >
              <IconFilm /> Video
            </div>
            {/* Dialogue */}
            <div
              className="flex items-center gap-1.5 px-2 border-b border-surface-border text-[11px] text-gray-400 font-medium"
              style={{ height: TRACK_HEIGHT }}
            >
              <IconVolume /> Dialogue
            </div>
            {/* Music */}
            <div
              className="flex items-center gap-1.5 px-2 border-b border-surface-border text-[11px] text-gray-400 font-medium"
              style={{ height: TRACK_HEIGHT }}
            >
              <IconMusic /> Music
            </div>
            {/* SFX */}
            <div
              className="flex items-center gap-1.5 px-2 border-b border-surface-border text-[11px] text-gray-400 font-medium"
              style={{ height: TRACK_HEIGHT }}
            >
              <IconZap /> SFX
            </div>
          </div>

          {/* ── Scrollable timeline ──────────────────────────────────── */}
          <div
            ref={timelineScrollRef}
            className="flex-1 overflow-x-auto overflow-y-hidden relative"
            onWheel={handleTimelineWheel}
          >
            <div className="relative" style={{ width: totalWidth, minHeight: "100%" }}>
              {/* ── Time ruler ──────────────────────────────────────── */}
              <div
                className="sticky top-0 z-20 bg-surface-raised/80 backdrop-blur cursor-pointer"
                style={{ height: RULER_HEIGHT }}
                onClick={handleRulerClick}
              >
                <TimeRuler
                  totalWidth={totalWidth}
                  pxPerSec={pxPerSec}
                  scrollLeft={timelineScrollRef.current?.scrollLeft ?? 0}
                  visibleWidth={timelineScrollRef.current?.clientWidth ?? 800}
                />
              </div>

              {/* ── Video track ─────────────────────────────────────── */}
              <div
                className="relative border-b border-surface-border"
                style={{ height: TRACK_HEIGHT }}
              >
                {shots.map((shot, idx) => {
                  const startX = (shotStartTimes.get(shot.id) ?? 0) * pxPerSec;
                  const width = shot.duration * pxPerSec;
                  const isSelected = shot.id === selectedShotId;
                  const status = STATUS_COLORS[shot.status];
                  const isDragOver = dragOverIndex === idx;
                  const remoteUser = shotSelections.get(shot.id);

                  return (
                    <div
                      key={shot.id}
                      className={`absolute top-1 bottom-1 rounded-md overflow-hidden cursor-pointer transition-shadow group ${
                        isSelected
                          ? "ring-2 ring-purple-500 shadow-lg shadow-purple-500/20 z-10"
                          : remoteUser
                            ? "ring-2 z-[5]"
                            : "hover:ring-1 hover:ring-purple-500/40"
                      } ${isDragOver ? "ring-2 ring-cyan-400" : ""}`}
                      style={{
                        left: startX,
                        width: Math.max(width, 20),
                        ...(remoteUser && !isSelected ? { "--tw-ring-color": remoteUser.color } as React.CSSProperties : {}),
                      }}
                      onClick={() => handleShotClick(shot)}
                      onContextMenu={(e) => handleShotContextMenu(e, shot.id)}
                      draggable={canEdit}
                      onDragStart={() => handleDragStart(shot.id)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                    >
                      {/* Background */}
                      <div className="absolute inset-0 bg-surface-raised border border-surface-border rounded-md" />

                      {/* Gradient scene indicator */}
                      <div
                        className="absolute inset-0 opacity-20 rounded-md"
                        style={{
                          background: `linear-gradient(135deg, ${
                            shot.sceneNumber % 2 === 0
                              ? "rgba(168,85,247,0.3)"
                              : "rgba(236,72,153,0.3)"
                          }, transparent)`,
                        }}
                      />

                      {/* Remote user label */}
                      {remoteUser && (
                        <div
                          className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-medium text-white whitespace-nowrap z-20"
                          style={{ backgroundColor: remoteUser.color }}
                        >
                          {remoteUser.displayName}
                        </div>
                      )}

                      {/* Content */}
                      <div className="relative flex items-center h-full px-2 gap-1.5 z-[1]">
                        {/* Shot number badge */}
                        <span className="flex-shrink-0 w-5 h-5 rounded bg-black/30 flex items-center justify-center text-[9px] font-bold text-white">
                          {shot.shotNumber}
                        </span>

                        {/* Description (only if wide enough) */}
                        {width > 80 && (
                          <span className="text-[10px] text-gray-300 truncate flex-1">
                            {shot.description}
                          </span>
                        )}

                        {/* Duration */}
                        {width > 50 && (
                          <span className="flex-shrink-0 text-[9px] text-gray-500 font-mono">
                            {formatDuration(shot.duration)}
                          </span>
                        )}

                        {/* Status dot */}
                        <span
                          className={`flex-shrink-0 w-2 h-2 rounded-full ${status.bg}`}
                          title={status.label}
                        />
                      </div>

                      {/* Resize handle (right edge) */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-purple-500/30 z-[2]"
                        onPointerDown={(e) => handleResizePointerDown(e, shot.id)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* ── Dialogue track ──────────────────────────────────── */}
              <div
                className="relative border-b border-surface-border"
                style={{ height: TRACK_HEIGHT }}
              >
                {dialogue.map((block) => {
                  const startX = block.startTime * pxPerSec;
                  const width = block.duration * pxPerSec;
                  const color =
                    CHARACTER_COLORS[block.characterName] ?? "#a78bfa";

                  return (
                    <div
                      key={block.id}
                      className="absolute top-1.5 bottom-1.5 rounded-md overflow-hidden border border-surface-border bg-surface-raised"
                      style={{ left: startX, width: Math.max(width, 16) }}
                    >
                      {/* Color accent */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex flex-col justify-center h-full pl-2.5 pr-1.5 overflow-hidden">
                        <span
                          className="text-[9px] font-bold tracking-wide truncate"
                          style={{ color }}
                        >
                          {block.characterName}
                        </span>
                        {width > 60 && (
                          <span className="text-[9px] text-gray-500 truncate leading-tight">
                            {block.line}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Music track ─────────────────────────────────────── */}
              <div
                className="relative border-b border-surface-border"
                style={{ height: TRACK_HEIGHT }}
              >
                {music.map((block) => {
                  const startX = block.startTime * pxPerSec;
                  const width = block.duration * pxPerSec;

                  return (
                    <div
                      key={block.id}
                      className="absolute top-1.5 bottom-1.5 rounded-md overflow-hidden border border-surface-border bg-surface-raised flex items-center"
                      style={{ left: startX, width: Math.max(width, 16) }}
                    >
                      {/* Waveform */}
                      <MiniWaveform width={Math.max(width, 16)} color="#818cf8" />
                      {/* Label overlay */}
                      {width > 60 && (
                        <span className="absolute left-2 text-[9px] font-medium text-indigo-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {block.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── SFX track ───────────────────────────────────────── */}
              <div
                className="relative border-b border-surface-border"
                style={{ height: TRACK_HEIGHT }}
              >
                {sfx.map((block) => {
                  const startX = block.startTime * pxPerSec;
                  const width = block.duration * pxPerSec;

                  return (
                    <div
                      key={block.id}
                      className="absolute top-1.5 bottom-1.5 rounded-md overflow-hidden border border-amber-500/20 bg-amber-900/10 flex items-center px-1.5"
                      style={{ left: startX, width: Math.max(width, 16) }}
                    >
                      <IconZap />
                      {width > 50 && (
                        <span className="ml-1 text-[9px] font-medium text-amber-300 truncate">
                          {block.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Playhead (red line across all tracks) ───────────── */}
              <div
                className="absolute z-30 pointer-events-none"
                style={{
                  left: currentTime * pxPerSec,
                  top: 0,
                  bottom: 0,
                }}
              >
                {/* Head triangle */}
                <div
                  className="absolute -left-[5px] top-0 pointer-events-auto cursor-col-resize"
                  onPointerDown={handlePlayheadPointerDown}
                >
                  <svg width="11" height="14" viewBox="0 0 11 14" fill="#ef4444">
                    <polygon points="0,0 11,0 5.5,10" />
                  </svg>
                </div>
                {/* Line */}
                <div className="w-px h-full bg-red-500" style={{ marginLeft: 0 }} />
              </div>

              {/* ── Remote playhead (collaboration) ────────────────── */}
              {remotePlayhead != null && (
                <div
                  className="absolute z-20 pointer-events-none transition-all duration-300"
                  style={{
                    left: remotePlayhead * pxPerSec,
                    top: 0,
                    bottom: 0,
                  }}
                >
                  <div className="absolute -left-[4px] top-0">
                    <svg width="9" height="12" viewBox="0 0 9 12" fill="#60a5fa">
                      <polygon points="0,0 9,0 4.5,8" />
                    </svg>
                  </div>
                  <div className="w-px h-full bg-blue-400/60" />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── Context menu ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {contextMenu && (
          <ShotContextMenu
            menu={contextMenu}
            onAction={handleContextAction}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
