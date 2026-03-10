/* ── Screenplay Parser ────────────────────────────────────────────────────
 *  Parses raw screenplay text into structured elements for formatted
 *  preview and syntax highlighting.
 * ──────────────────────────────────────────────────────────────────────── */

export type ElementType =
  | "scene-heading"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "action"
  | "transition"
  | "dual-dialogue"
  | "blank";

export interface ScriptElement {
  type: ElementType;
  text: string;
  /** For dialogue/parenthetical: the character who is speaking */
  characterName?: string;
  /** For dual-dialogue: second character + second dialogue */
  dualCharacter?: string;
  dualDialogue?: string;
  lineIndex: number;
}

/* Patterns ---------------------------------------------------------------- */

const SCENE_HEADING_RE = /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)\s+.+/i;
const TRANSITION_RE = /^(FADE IN:|FADE OUT\.|FADE TO BLACK\.|CUT TO:|SMASH CUT TO:|DISSOLVE TO:|MATCH CUT TO:|JUMP CUT TO:)$/i;
const CHARACTER_RE = /^[A-Z][A-Z0-9 .'-]+(\s*\(V\.O\.\)|\s*\(O\.S\.\)|\s*\(CONT'D\)|\s*\(O\.C\.\))?$/;
const PARENTHETICAL_RE = /^\(.+\)$/;

/**
 * Parse raw screenplay text into structured elements.
 */
export function parseScreenplay(raw: string): ScriptElement[] {
  const lines = raw.split("\n");
  const elements: ScriptElement[] = [];
  let currentCharacter: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // blank lines reset character context
    if (trimmed === "") {
      elements.push({ type: "blank", text: "", lineIndex: i });
      currentCharacter = null;
      continue;
    }

    // Scene headings (INT./EXT.)
    if (SCENE_HEADING_RE.test(trimmed)) {
      elements.push({ type: "scene-heading", text: trimmed, lineIndex: i });
      currentCharacter = null;
      continue;
    }

    // Transitions
    if (TRANSITION_RE.test(trimmed)) {
      elements.push({ type: "transition", text: trimmed, lineIndex: i });
      currentCharacter = null;
      continue;
    }

    // Character name (uppercase line followed by dialogue)
    if (CHARACTER_RE.test(trimmed) && trimmed.length <= 60) {
      // peek at next non-blank line — should be dialogue or parenthetical
      const nextNonBlank = lines
        .slice(i + 1)
        .find((l) => l.trim() !== "");
      if (
        nextNonBlank &&
        (PARENTHETICAL_RE.test(nextNonBlank.trim()) ||
          (!SCENE_HEADING_RE.test(nextNonBlank.trim()) &&
            !CHARACTER_RE.test(nextNonBlank.trim()) &&
            !TRANSITION_RE.test(nextNonBlank.trim())))
      ) {
        currentCharacter = trimmed.replace(/\s*\(.*\)$/, "").trim();
        elements.push({
          type: "character",
          text: trimmed,
          characterName: currentCharacter,
          lineIndex: i,
        });
        continue;
      }
    }

    // Parenthetical (inside dialogue block)
    if (currentCharacter && PARENTHETICAL_RE.test(trimmed)) {
      elements.push({
        type: "parenthetical",
        text: trimmed,
        characterName: currentCharacter,
        lineIndex: i,
      });
      continue;
    }

    // Dialogue (any line following a character name)
    if (currentCharacter) {
      elements.push({
        type: "dialogue",
        text: trimmed,
        characterName: currentCharacter,
        lineIndex: i,
      });
      continue;
    }

    // Default: action line
    elements.push({ type: "action", text: trimmed, lineIndex: i });
  }

  return elements;
}

/**
 * Extract unique character names from parsed elements.
 */
export function extractCharactersFromScript(
  elements: ScriptElement[],
): string[] {
  const names = new Set<string>();
  for (const el of elements) {
    if (el.type === "character" && el.characterName) {
      names.add(el.characterName);
    }
  }
  return Array.from(names).sort();
}

/* ── Character colour assignment ----------------------------------------- */

const CHARACTER_COLORS = [
  "#c084fc", // purple-400
  "#f472b6", // pink-400
  "#22d3ee", // cyan-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#fb923c", // orange-400
  "#818cf8", // indigo-400
  "#f87171", // red-400
  "#a3e635", // lime-400
  "#2dd4bf", // teal-400
];

/**
 * Deterministic colour for a character name.
 */
export function getCharacterColor(
  name: string,
  allNames: string[],
): string {
  const idx = allNames.indexOf(name);
  return CHARACTER_COLORS[
    (idx >= 0 ? idx : 0) % CHARACTER_COLORS.length
  ]!;
}

/* ── Formatting helpers -------------------------------------------------- */

/**
 * Insert a screenplay element (heading, character cue, etc.) at the
 * cursor position in a raw text string.
 */
export function insertAtCursor(
  text: string,
  cursorPos: number,
  insert: string,
): { text: string; newCursorPos: number } {
  const before = text.slice(0, cursorPos);
  const after = text.slice(cursorPos);
  const needsNewlineBefore = before.length > 0 && !before.endsWith("\n");
  const needsNewlineAfter = after.length > 0 && !after.startsWith("\n");
  const prefix = needsNewlineBefore ? "\n\n" : "";
  const suffix = needsNewlineAfter ? "\n" : "";
  const result = before + prefix + insert + suffix + after;
  return {
    text: result,
    newCursorPos: before.length + prefix.length + insert.length,
  };
}

/**
 * Auto-format: capitalise scene headings, uppercase character names, etc.
 */
export function autoFormat(raw: string): string {
  return raw
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      // Capitalise scene headings
      if (SCENE_HEADING_RE.test(trimmed)) {
        return trimmed.toUpperCase();
      }
      return line;
    })
    .join("\n");
}
