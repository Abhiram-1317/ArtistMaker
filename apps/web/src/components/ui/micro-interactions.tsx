"use client";

import { useState, useCallback, useEffect } from "react";

// ── Like Button with heart bounce ────────────────────────────────────────────
export function LikeButton({
  liked: initialLiked = false,
  count: initialCount = 0,
  onToggle,
}: {
  liked?: boolean;
  count?: number;
  onToggle?: (liked: boolean) => void;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  const toggle = useCallback(() => {
    const next = !liked;
    setLiked(next);
    setCount((c) => (next ? c + 1 : c - 1));
    setAnimating(true);
    onToggle?.(next);
    setTimeout(() => setAnimating(false), 400);
  }, [liked, onToggle]);

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 text-sm transition-colors duration-fast group"
      aria-label={liked ? "Unlike" : "Like"}
    >
      <svg
        className={`w-5 h-5 transition-colors duration-fast ${animating ? "animate-heart-bounce" : ""} ${
          liked ? "text-neon-pink fill-neon-pink" : "text-gray-400 group-hover:text-neon-pink"
        }`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        fill={liked ? "currentColor" : "none"}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
      <span className={liked ? "text-neon-pink" : "text-gray-400"}>
        {count}
      </span>
    </button>
  );
}

// ── Success Checkmark ────────────────────────────────────────────────────────
export function SuccessCheckmark({ size = 48 }: { size?: number }) {
  return (
    <div className="inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="text-emerald-400"
      >
        <circle cx="12" cy="12" r="10" className="fill-emerald-500/20 animate-scale-in" />
        <path
          d="M8 12.5l2.5 2.5 5-5"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="24"
          className="animate-check-draw"
        />
      </svg>
    </div>
  );
}

// ── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeMap = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  return (
    <div
      className={`${sizeMap[size]} border-2 border-genesis-500/30 border-t-genesis-500 rounded-full animate-spinner ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// ── Dots Spinner ─────────────────────────────────────────────────────────────
export function DotsSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-genesis-500 animate-spinner-dots"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// ── Button with Loading State ────────────────────────────────────────────────
export function LoadingButton({
  loading = false,
  children,
  className = "",
  ...props
}: {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`btn-primary relative active:scale-[0.97] transition-all duration-[100ms] ${
        loading ? "opacity-80 pointer-events-none" : ""
      } ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <Spinner size="sm" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      )}
      <span className={loading ? "invisible" : ""}>{children}</span>
    </button>
  );
}

// ── Confetti Effect ──────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  "bg-neon-pink",
  "bg-genesis-400",
  "bg-neon-cyan",
  "bg-neon-blue",
  "bg-yellow-400",
  "bg-emerald-400",
];

export function Confetti({
  trigger,
  particleCount = 30,
}: {
  trigger: boolean;
  particleCount?: number;
}) {
  const [particles, setParticles] = useState<
    { id: number; x: number; color: string; delay: number; rotation: number }[]
  >([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => setParticles([]), 2000);
      return () => clearTimeout(timer);
    }
  }, [trigger, particleCount]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute w-2 h-2 rounded-sm ${p.color} animate-confetti-fall`}
          style={{
            left: `${p.x}%`,
            top: "-10px",
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// ── Toast Component ──────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info" | "warning";

const toastStyles: Record<ToastType, { icon: string; border: string; bg: string }> = {
  success: { icon: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10" },
  error: { icon: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/10" },
  info: { icon: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10" },
  warning: { icon: "text-yellow-400", border: "border-yellow-500/20", bg: "bg-yellow-500/10" },
};

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
};

export function Toast({
  type = "info",
  message,
  onClose,
}: {
  type?: ToastType;
  message: string;
  onClose?: () => void;
}) {
  const style = toastStyles[type];

  return (
    <div
      className={`animate-toast-in flex items-center gap-3 px-4 py-3 rounded-xl border ${style.border} ${style.bg} backdrop-blur-xl shadow-lg max-w-sm`}
      role="alert"
    >
      <span className={style.icon}>{toastIcons[type]}</span>
      <p className="text-sm text-gray-200 flex-1">{message}</p>
      {onClose && (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
