"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0f] text-gray-100 font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
          {/* Dramatic red glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl" />

          <div className="text-center space-y-8 max-w-lg px-4 relative z-10">
            {/* Film reel break icon */}
            <div className="mx-auto w-24 h-24 relative">
              <svg viewBox="0 0 96 96" fill="none" className="w-full h-full">
                <circle cx="48" cy="48" r="32" className="stroke-red-500/30" strokeWidth="2" fill="none" />
                <circle cx="48" cy="48" r="12" className="stroke-red-500/40" strokeWidth="2" fill="none" />
                <circle cx="48" cy="48" r="4" className="fill-red-500/30" />
                {/* Film perforations */}
                <circle cx="48" cy="20" r="3" className="fill-red-500/20" />
                <circle cx="48" cy="76" r="3" className="fill-red-500/20" />
                <circle cx="20" cy="48" r="3" className="fill-red-500/20" />
                <circle cx="76" cy="48" r="3" className="fill-red-500/20" />
                {/* Break line */}
                <path d="M30 30l36 36" className="stroke-red-400/60" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>

            <div className="space-y-2">
              <p className="text-red-400 text-sm font-mono tracking-wider uppercase">Error 500</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: "system-ui, sans-serif" }}>
                Production Error
              </h1>
            </div>

            <p className="text-gray-400 text-lg leading-relaxed">
              Something went wrong on set. Our crew is working to fix this. 
              Please try again or return to the main stage.
            </p>

            {error.digest && (
              <p className="text-gray-600 text-xs font-mono">
                Error ID: {error.digest}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={reset} className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium text-white bg-red-600 hover:bg-red-500 transition-colors gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                Try Again
              </button>
              <a href="/" className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors gap-2">
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
