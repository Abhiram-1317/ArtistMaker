"use client";

import { useState } from "react";

// ── Network Error Banner ─────────────────────────────────────────────────────
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="animate-fade-in flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl">
      <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-300">Connection lost</p>
        <p className="text-xs text-red-400/70">Please check your internet connection and try again.</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 text-xs font-medium text-red-300 hover:text-white bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ── API Error Display ────────────────────────────────────────────────────────
export function ApiError({
  message,
  statusCode,
  onRetry,
}: {
  message: string;
  statusCode?: number;
  onRetry?: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="animate-fade-in p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-2">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-300">{message}</p>
          {statusCode && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-red-500/60 hover:text-red-400 mt-1 transition-colors"
            >
              {showDetails ? "Hide details" : "Show details"}
            </button>
          )}
          {showDetails && statusCode && (
            <p className="text-xs text-red-500/50 mt-1 font-mono">
              HTTP {statusCode}
            </p>
          )}
        </div>
        {onRetry && (
          <button onClick={onRetry} className="shrink-0 btn-secondary text-xs py-1.5 px-3">
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

// ── Form Field Error ─────────────────────────────────────────────────────────
export function FieldError({ message }: { message: string }) {
  return (
    <p className="animate-fade-in text-xs text-red-400 mt-1 flex items-center gap-1">
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      {message}
    </p>
  );
}

// ── Form Error Summary ───────────────────────────────────────────────────────
export function FormErrorSummary({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="animate-fade-in p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-2">
      <p className="text-sm font-medium text-red-300">Please fix the following errors:</p>
      <ul className="space-y-1">
        {errors.map((err, i) => (
          <li key={i} className="text-xs text-red-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
            {err}
          </li>
        ))}
      </ul>
    </div>
  );
}
