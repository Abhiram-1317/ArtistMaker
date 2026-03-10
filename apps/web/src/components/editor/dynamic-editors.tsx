/**
 * Dynamic imports for heavy editor components.
 * Use these instead of direct imports to enable code splitting.
 */
import dynamic from "next/dynamic";

export const TimelineEditor = dynamic(
  () => import("@/components/editor/TimelineEditor"),
  { ssr: false, loading: () => <EditorSkeleton label="Timeline" /> },
);

export const CharacterDesigner = dynamic(
  () => import("@/components/editor/CharacterDesigner"),
  { ssr: false, loading: () => <EditorSkeleton label="Character Designer" /> },
);

export const SceneConfigurator = dynamic(
  () => import("@/components/editor/SceneConfigurator"),
  { ssr: false, loading: () => <EditorSkeleton label="Scene Configurator" /> },
);

export const ScriptEditor = dynamic(
  () => import("@/components/editor/ScriptEditor"),
  { ssr: false, loading: () => <EditorSkeleton label="Script Editor" /> },
);

function EditorSkeleton({ label }: { label: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-white/[0.06] bg-surface-elevated">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-genesis-500 border-t-transparent" />
        <p className="text-sm text-gray-500">Loading {label}…</p>
      </div>
    </div>
  );
}
