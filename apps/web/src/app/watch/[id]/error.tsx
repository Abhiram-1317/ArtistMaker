"use client";

import { useEffect } from "react";

export default function WatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Watch error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="glass rounded-2xl p-8 max-w-md text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white">
          Unable to load video
        </h2>
        <p className="text-sm text-gray-400">
          {error.message ||
            "This video could not be loaded. It may have been removed or is unavailable."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-genesis-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-genesis-500"
          >
            Retry
          </button>
          <a
            href="/explore"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5"
          >
            Browse videos
          </a>
        </div>
      </div>
    </div>
  );
}
