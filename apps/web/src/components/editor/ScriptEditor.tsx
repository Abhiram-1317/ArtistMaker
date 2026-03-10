"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Badge } from "@genesis/ui";
import {
  parseScreenplay,
  extractCharactersFromScript,
  getCharacterColor,
  insertAtCursor,
  autoFormat,
  type ScriptElement,
} from "./screenplay-parser";

/* ── SVG Icons (inline, matching project pattern) ──────────────────────── */

function IconBold() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  );
}

function IconFilm() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /><line x1="17" y1="17" x2="22" y2="17" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconMessageSquare() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
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

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconLoader() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconWand() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" /><path d="M17.8 11.8 19 13" /><path d="M15 9h0" /><path d="M17.8 6.2 19 5" /><path d="m3 21 9-9" /><path d="M12.2 6.2 11 5" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconSidebar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

/* ── Animations ──────────────────────────────────────────────────────────── */

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

const slideRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.25 },
};

/* ── Types ───────────────────────────────────────────────────────────────── */

type SaveStatus = "idle" | "saving" | "saved" | "error";
type InsertMode = "action" | "dialogue";

/* ── Collaboration types ──────────────────────────────────────────────── */

export interface RemoteUser {
  id: string;
  displayName: string;
  color: string;
}

export interface RemoteLock {
  elementId: string;
  userId: string;
  displayName: string;
}

export interface ScriptEditorProps {
  /** Initial script content */
  initialContent?: string;
  /** Project title for export filename */
  projectTitle?: string;
  /** Known characters from the project */
  characters?: string[];
  /** Callback when content changes (debounced) */
  onSave?: (content: string) => Promise<void> | void;
  /** Callback for version history access */
  onVersionHistory?: () => void;
  /** Collaboration: remote users currently viewing the script */
  collaborators?: RemoteUser[];
  /** Collaboration: currently locked sections */
  locks?: RemoteLock[];
  /** Collaboration: whether the current user has edit permission */
  canEdit?: boolean;
  /** Collaboration: called when local content changes, for broadcasting */
  onCollabChange?: (content: string, cursorPosition: number) => void;
  /** Collaboration: called when remote content arrives */
  remoteContent?: string | null;
}

/* ── AI Suggestions (placeholder data) ─────────────────────────────────── */

interface AISuggestion {
  id: string;
  type: "dialogue" | "setting" | "conflict" | "general";
  text: string;
  icon: "message" | "film" | "sparkles";
}

const PLACEHOLDER_SUGGESTIONS: AISuggestion[] = [
  {
    id: "s1",
    type: "dialogue",
    text: "Add more dialogue here — the scene feels exposition-heavy.",
    icon: "message",
  },
  {
    id: "s2",
    type: "setting",
    text: "Describe the setting more — where is the light source?",
    icon: "film",
  },
  {
    id: "s3",
    type: "conflict",
    text: "Consider adding conflict — what's at stake for the character?",
    icon: "sparkles",
  },
];

/* ── Sample script ───────────────────────────────────────────────────────── */

const SAMPLE_SCRIPT = `INT. COFFEE SHOP - MORNING

A cozy café with warm lighting. Rain streaks down the windows.

SARAH
(nervously)
I wasn't sure you'd come.

MARCUS
I almost didn't.

He slides into the booth across from her, keeping his coat on.

SARAH
We need to talk about what happened.

MARCUS
(coldly)
There's nothing to talk about.

A WAITRESS approaches with two menus.

WAITRESS
Can I get you both started with coffee?

SARAH
Please.

EXT. CITY STREET - CONTINUOUS

Cars splash through puddles. The neon signs reflect off the wet pavement.

FADE TO BLACK.`;

/* ══════════════════════════════════════════════════════════════════════════
 *  ScriptEditor Component
 * ══════════════════════════════════════════════════════════════════════════ */

export default function ScriptEditor({
  initialContent,
  projectTitle = "Untitled Script",
  characters: externalCharacters,
  onSave,
  onVersionHistory,
  collaborators = [],
  locks = [],
  canEdit = true,
  onCollabChange,
  remoteContent,
}: ScriptEditorProps) {
  /* ── State ──────────────────────────────────────────────────────────── */
  const [raw, setRaw] = useState(initialContent ?? SAMPLE_SCRIPT);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [insertMode, setInsertMode] = useState<InsertMode>("action");
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [characterDropdownOpen, setCharacterDropdownOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collabTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemoteUpdateRef = useRef(false);

  /* ── Accept remote content updates ─────────────────────────────────── */
  useEffect(() => {
    if (remoteContent != null) {
      isRemoteUpdateRef.current = true;
      setRaw(remoteContent);
    }
  }, [remoteContent]);

  /* ── Broadcast local changes for collaboration ────────────────────── */
  useEffect(() => {
    if (!onCollabChange) return;
    // Skip broadcasting when the change came from a remote user
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }
    if (collabTimerRef.current) clearTimeout(collabTimerRef.current);
    collabTimerRef.current = setTimeout(() => {
      const cursor = textareaRef.current?.selectionStart ?? raw.length;
      onCollabChange(raw, cursor);
    }, 300);
    return () => {
      if (collabTimerRef.current) clearTimeout(collabTimerRef.current);
    };
  }, [raw, onCollabChange]);

  /* ── Parsed elements ───────────────────────────────────────────────── */
  const elements = useMemo(() => parseScreenplay(raw), [raw]);
  const scriptCharacters = useMemo(
    () => extractCharactersFromScript(elements),
    [elements],
  );
  const allCharacters = useMemo(() => {
    const merged = new Set([
      ...scriptCharacters,
      ...(externalCharacters ?? []),
    ]);
    return Array.from(merged).sort();
  }, [scriptCharacters, externalCharacters]);

  /* ── Debounced auto-save ───────────────────────────────────────────── */
  useEffect(() => {
    if (!onSave) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    setSaveStatus("saving");
    saveTimerRef.current = setTimeout(async () => {
      try {
        await onSave(raw);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    }, 1000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [raw, onSave]);

  /* ── Helpers ────────────────────────────────────────────────────────── */
  const getCursorPos = useCallback(
    () => textareaRef.current?.selectionStart ?? raw.length,
    [raw.length],
  );

  const insertText = useCallback(
    (text: string) => {
      const pos = getCursorPos();
      const result = insertAtCursor(raw, pos, text);
      setRaw(result.text);
      // restore cursor
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            result.newCursorPos,
            result.newCursorPos,
          );
        }
      });
    },
    [raw, getCursorPos],
  );

  const handleInsertSceneHeading = useCallback(() => {
    insertText("INT. LOCATION - TIME OF DAY");
  }, [insertText]);

  const handleInsertCharacter = useCallback(
    (name: string) => {
      insertText(`${name.toUpperCase()}\nDialogue here...`);
      setCharacterDropdownOpen(false);
    },
    [insertText],
  );

  const handleAutoFormat = useCallback(() => {
    setRaw(autoFormat(raw));
  }, [raw]);

  const handleExport = useCallback(
    (format: "txt" | "pdf") => {
      if (format === "txt") {
        const blob = new Blob([raw], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectTitle}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // PDF export — open print dialog with formatted preview
        window.print();
      }
    },
    [raw, projectTitle],
  );

  /* ── Stats ─────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const sceneCount = elements.filter(
      (e) => e.type === "scene-heading",
    ).length;
    const dialogueCount = elements.filter(
      (e) => e.type === "dialogue",
    ).length;
    const wordCount = raw
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    // rough page estimate: 1 page ≈ 55 lines of screenplay
    const lineCount = raw.split("\n").length;
    const pageEstimate = Math.max(1, Math.round(lineCount / 55));
    return { sceneCount, dialogueCount, wordCount, pageEstimate };
  }, [elements, raw]);

  /* ── Render helpers ────────────────────────────────────────────────── */

  function renderElement(el: ScriptElement) {
    const charColor =
      el.characterName && allCharacters.length > 0
        ? getCharacterColor(el.characterName, allCharacters)
        : undefined;

    const isHighlighted =
      selectedCharacter &&
      el.characterName === selectedCharacter;

    switch (el.type) {
      case "scene-heading":
        return (
          <div
            key={el.lineIndex}
            className="font-heading text-sm font-bold tracking-wider text-white uppercase mt-6 mb-2 border-l-2 border-purple-500 pl-3"
          >
            {el.text}
          </div>
        );

      case "character":
        return (
          <div
            key={el.lineIndex}
            className="text-center text-xs font-bold tracking-[0.2em] uppercase mt-4 mb-0.5 cursor-pointer transition-colors hover:opacity-80"
            style={{ color: charColor }}
            onClick={() =>
              setSelectedCharacter(
                selectedCharacter === el.characterName
                  ? null
                  : el.characterName ?? null,
              )
            }
            title={`Click to highlight all ${el.characterName} lines`}
          >
            {el.text}
          </div>
        );

      case "dialogue":
        return (
          <div
            key={el.lineIndex}
            className={`text-sm mx-auto max-w-[65%] leading-relaxed transition-all ${
              isHighlighted
                ? "ring-1 ring-purple-500/40 rounded px-2 py-0.5 bg-purple-500/5"
                : ""
            }`}
            style={{
              color: isHighlighted
                ? charColor
                : "rgba(255,255,255,0.85)",
            }}
          >
            {el.text}
          </div>
        );

      case "parenthetical":
        return (
          <div
            key={el.lineIndex}
            className="text-center text-xs italic text-gray-400 mb-0.5"
          >
            {el.text}
          </div>
        );

      case "transition":
        return (
          <div
            key={el.lineIndex}
            className="text-right text-xs font-bold tracking-wider text-gray-500 uppercase mt-4 mb-2 pr-4"
          >
            {el.text}
          </div>
        );

      case "action":
        return (
          <div
            key={el.lineIndex}
            className="text-sm text-gray-300 leading-relaxed my-1"
          >
            {el.text}
          </div>
        );

      case "blank":
        return <div key={el.lineIndex} className="h-3" />;

      default:
        return null;
    }
  }

  const saveStatusIndicator = (
    <div className="flex items-center gap-1.5 text-xs">
      {saveStatus === "saving" && (
        <>
          <IconLoader />
          <span className="text-gray-400">Saving…</span>
        </>
      )}
      {saveStatus === "saved" && (
        <>
          <span className="text-emerald-400">
            <IconCheck />
          </span>
          <span className="text-emerald-400">Saved</span>
        </>
      )}
      {saveStatus === "error" && (
        <span className="text-red-400">Save failed</span>
      )}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
   *  JSX
   * ══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col h-full min-h-0 bg-surface rounded-xl border border-surface-border overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border-b border-surface-border bg-surface-raised/50 flex-shrink-0 flex-wrap overflow-x-auto">
        {/* Character dropdown */}
        <div className="relative">
          <button
            onClick={() => setCharacterDropdownOpen(!characterDropdownOpen)}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border border-surface-border text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <IconUser />
            Character
            <IconChevronDown />
          </button>
          <AnimatePresence>
            {characterDropdownOpen && (
              <motion.div
                {...fadeIn}
                className="absolute top-full left-0 mt-1 w-48 py-1 rounded-lg border border-surface-border bg-surface-raised shadow-xl z-50"
              >
                {allCharacters.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    No characters detected
                  </div>
                ) : (
                  allCharacters.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleInsertCharacter(name)}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-purple-500/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: getCharacterColor(
                            name,
                            allCharacters,
                          ),
                        }}
                      />
                      {name}
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scene heading */}
        <button
          onClick={handleInsertSceneHeading}
          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border border-surface-border text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
          title="Insert scene heading"
        >
          <IconFilm />
          Scene
        </button>

        {/* Action / Dialogue toggle */}
        <div className="inline-flex rounded-md border border-surface-border overflow-hidden">
          <button
            onClick={() => setInsertMode("action")}
            className={`h-8 px-3 text-xs font-medium transition-colors ${
              insertMode === "action"
                ? "bg-purple-600/30 text-purple-300 border-r border-purple-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5 border-r border-surface-border"
            }`}
          >
            <IconBold />
          </button>
          <button
            onClick={() => setInsertMode("dialogue")}
            className={`h-8 px-3 text-xs font-medium transition-colors ${
              insertMode === "dialogue"
                ? "bg-purple-600/30 text-purple-300"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <IconMessageSquare />
          </button>
        </div>

        <div className="w-px h-5 bg-surface-border mx-1" />

        {/* Auto-format */}
        <button
          onClick={handleAutoFormat}
          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
          title="Auto-format script"
        >
          <IconWand />
          Format
        </button>

        {/* AI Enhance (placeholder) */}
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md transition-colors ${
            showAIPanel
              ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
              : "text-gray-300 hover:bg-white/5 hover:text-white"
          }`}
          title="Toggle AI suggestions panel"
        >
          <IconSparkles />
          AI Assist
        </button>

        <div className="flex-1" />

        {/* Stats */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-gray-500">
          <span>{stats.pageEstimate} pg</span>
          <span>{stats.sceneCount} scenes</span>
          <span>{stats.wordCount} words</span>
        </div>

        <div className="w-px h-5 bg-surface-border mx-1" />

        {/* Save status */}
        {saveStatusIndicator}

        {/* Collaboration indicators */}
        {collaborators.length > 0 && (
          <div className="flex items-center gap-1 ml-1">
            {collaborators.slice(0, 3).map((user) => (
              <div
                key={user.id}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white -ml-1 first:ml-0 ring-2 ring-surface"
                style={{ backgroundColor: user.color }}
                title={user.displayName}
              >
                {user.displayName[0]?.toUpperCase()}
              </div>
            ))}
            {collaborators.length > 3 && (
              <span className="text-[10px] text-gray-500 ml-1">+{collaborators.length - 3}</span>
            )}
          </div>
        )}

        {/* Read-only badge */}
        {!canEdit && (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
            View Only
          </span>
        )}

        {/* Export dropdown */}
        <div className="relative group">
          <button className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
            <IconDownload />
            Export
          </button>
          <div className="absolute top-full right-0 mt-1 w-36 py-1 rounded-lg border border-surface-border bg-surface-raised shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
            <button
              onClick={() => handleExport("txt")}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-purple-500/10 hover:text-white transition-colors"
            >
              Download as .txt
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-purple-500/10 hover:text-white transition-colors"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Version history */}
        {onVersionHistory && (
          <button
            onClick={onVersionHistory}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            title="Version history"
          >
            <IconClock />
          </button>
        )}
      </div>

      {/* ── Main content area ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
        {/* ── Left: Raw editor ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-[200px] md:min-h-0 border-b md:border-b-0 md:border-r border-surface-border">
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-surface-border bg-surface-raised/30">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Editor
            </span>
            <Badge variant="default">{insertMode}</Badge>
          </div>
          <div className="flex-1 min-h-0 relative">
            {/* Lock banner */}
            {locks.length > 0 && (
              <div className="absolute top-0 left-0 right-0 z-10 px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-400 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Being edited by {locks.map((l) => l.displayName).join(", ")}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              readOnly={!canEdit}
              spellCheck={false}
              className={`absolute inset-0 w-full h-full resize-none bg-transparent text-sm text-gray-200 font-mono leading-relaxed p-4 focus:outline-none placeholder:text-gray-600 overflow-auto ${locks.length > 0 ? "pt-10" : ""} ${!canEdit ? "cursor-default opacity-75" : ""}`}
              placeholder="Start writing your screenplay…"
            />
          </div>
        </div>

        {/* ── Right: Formatted preview ───────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-surface-border bg-surface-raised/30">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Preview
            </span>
            {selectedCharacter && (
              <button
                onClick={() => setSelectedCharacter(null)}
                className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: getCharacterColor(
                      selectedCharacter,
                      allCharacters,
                    ),
                  }}
                />
                {selectedCharacter}
                <IconX />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-6 print:bg-white print:text-black">
            {/* Screenplay formatted output */}
            <div className="max-w-2xl mx-auto">
              {elements.map((el) => renderElement(el))}
            </div>
          </div>
        </div>

        {/* ── AI Panel (right sidebar) ───────────────────────────────── */}
        <AnimatePresence>
          {showAIPanel && (
            <motion.div
              {...slideRight}
              className="w-72 md:w-64 lg:w-72 flex-shrink-0 border-l border-surface-border bg-surface-raised/30 flex flex-col overflow-hidden"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-surface-border">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <IconSparkles />
                  AI Assistant
                </span>
                <button
                  onClick={() => setShowAIPanel(false)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <IconSidebar />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-5">
                {/* Suggestions */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Suggestions
                  </h4>
                  <div className="space-y-2">
                    {PLACEHOLDER_SUGGESTIONS.map((suggestion) => (
                      <motion.div
                        key={suggestion.id}
                        whileHover={{ scale: 1.01 }}
                        className="p-3 rounded-lg border border-surface-border bg-surface/50 hover:border-purple-500/30 transition-colors cursor-pointer group"
                      >
                        <div className="flex gap-2">
                          <span className="text-purple-400 group-hover:text-purple-300 transition-colors mt-0.5 flex-shrink-0">
                            {suggestion.icon === "message" && (
                              <IconMessageSquare />
                            )}
                            {suggestion.icon === "film" && <IconFilm />}
                            {suggestion.icon === "sparkles" && (
                              <IconSparkles />
                            )}
                          </span>
                          <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                            {suggestion.text}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* AI Actions */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Actions
                  </h4>
                  <div className="space-y-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start"
                      iconLeft={<IconSparkles />}
                    >
                      Expand Scene
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start"
                      iconLeft={<IconMessageSquare />}
                    >
                      Improve Dialogue
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start"
                      iconLeft={<IconWand />}
                    >
                      Add Stage Directions
                    </Button>
                  </div>
                </div>

                {/* Characters in script */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Characters ({allCharacters.length})
                  </h4>
                  {allCharacters.length === 0 ? (
                    <p className="text-xs text-gray-600">
                      No characters detected yet.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {allCharacters.map((name) => {
                        const lineCount = elements.filter(
                          (e) =>
                            e.type === "dialogue" &&
                            e.characterName === name,
                        ).length;
                        return (
                          <button
                            key={name}
                            onClick={() =>
                              setSelectedCharacter(
                                selectedCharacter === name ? null : name,
                              )
                            }
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                              selectedCharacter === name
                                ? "bg-purple-500/10 text-white"
                                : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: getCharacterColor(
                                  name,
                                  allCharacters,
                                ),
                              }}
                            />
                            <span className="flex-1 text-left">{name}</span>
                            <span className="text-gray-600">
                              {lineCount} line{lineCount !== 1 ? "s" : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Script stats */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Pages", value: stats.pageEstimate },
                      { label: "Scenes", value: stats.sceneCount },
                      { label: "Words", value: stats.wordCount },
                      { label: "Dialogue", value: stats.dialogueCount },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="p-2 rounded-lg border border-surface-border bg-surface/50 text-center"
                      >
                        <div className="text-lg font-heading font-bold text-white">
                          {stat.value}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
