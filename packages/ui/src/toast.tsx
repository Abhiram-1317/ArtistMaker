"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "./utils";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastData {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** Duration in ms before auto-dismiss (default 5 000) */
  duration?: number;
}

export interface ToastOptions {
  variant?: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

/* -------------------------------------------------------------------------- */
/*                                  Context                                   */
/* -------------------------------------------------------------------------- */

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook for showing toasts imperatively.
 *
 * ```tsx
 * const { toast } = useToast();
 * toast({ variant: "success", title: "Saved!" });
 * ```
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider />");
  }
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*                                  Icons                                     */
/* -------------------------------------------------------------------------- */

function SuccessIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

const icons: Record<ToastVariant, () => ReactNode> = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

/* -------------------------------------------------------------------------- */
/*                               Variant styles                               */
/* -------------------------------------------------------------------------- */

const variantStyles: Record<ToastVariant, { container: string; icon: string }> = {
  success: {
    container: "border-green-500/20 bg-green-500/5",
    icon: "text-green-400",
  },
  error: {
    container: "border-red-500/20 bg-red-500/5",
    icon: "text-red-400",
  },
  warning: {
    container: "border-yellow-500/20 bg-yellow-500/5",
    icon: "text-yellow-400",
  },
  info: {
    container: "border-purple-500/20 bg-purple-500/5",
    icon: "text-purple-400",
  },
};

/* -------------------------------------------------------------------------- */
/*                             Single Toast Item                              */
/* -------------------------------------------------------------------------- */

function ToastItem({
  data,
  onDismiss,
}: {
  data: ToastData;
  onDismiss: (id: string) => void;
}) {
  const Icon = icons[data.variant];
  const style = variantStyles[data.variant];

  return (
    <ToastPrimitive.Root
      duration={data.duration ?? 5000}
      onOpenChange={(open) => {
        if (!open) onDismiss(data.id);
      }}
      className={cn(
        "group pointer-events-auto relative flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg",
        "bg-[#12121a]/95 backdrop-blur-md",
        style.container,
        // slide-in from right
        "data-[state=open]:animate-[slide-in-right_300ms_ease-out]",
        "data-[state=closed]:animate-[fade-out_150ms_ease-in]",
        "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
        "data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform",
        "data-[swipe=end]:animate-[slide-out-right_200ms_ease-in]",
      )}
    >
      {/* Icon */}
      <span className={cn("mt-0.5 shrink-0", style.icon)}>
        <Icon />
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <ToastPrimitive.Title className="text-sm font-medium text-white">
          {data.title}
        </ToastPrimitive.Title>
        {data.description && (
          <ToastPrimitive.Description className="mt-1 text-xs text-gray-400 line-clamp-2">
            {data.description}
          </ToastPrimitive.Description>
        )}
      </div>

      {/* Close */}
      <ToastPrimitive.Close
        aria-label="Dismiss"
        className={cn(
          "shrink-0 rounded-md p-1 text-gray-500 opacity-0 transition-opacity",
          "hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
          "group-hover:opacity-100",
        )}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Provider                                   */
/* -------------------------------------------------------------------------- */

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback((options: ToastOptions): string => {
    const id = `toast-${++counter}-${Date.now()}`;
    const newToast: ToastData = {
      id,
      variant: options.variant ?? "info",
      title: options.title,
      description: options.description,
      duration: options.duration,
    };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}

        {/* Render each active toast */}
        {toasts.map((t) => (
          <ToastItem key={t.id} data={t} onDismiss={dismiss} />
        ))}

        {/* Viewport – stacked in bottom-right */}
        <ToastPrimitive.Viewport
          className={cn(
            "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4",
            "sm:max-w-[420px]",
          )}
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
