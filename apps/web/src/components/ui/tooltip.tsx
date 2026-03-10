"use client";

import { useState, useRef, useCallback } from "react";

type Placement = "top" | "bottom" | "left" | "right";

export function Tooltip({
  content,
  placement = "top",
  children,
  delay = 200,
}: {
  content: string;
  placement?: Placement;
  children: React.ReactNode;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const placementClasses: Record<Placement, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses: Record<Placement, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-surface-overlay border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-surface-overlay border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-surface-overlay border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-surface-overlay border-y-transparent border-l-transparent",
  };

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {visible && (
        <div
          className={`absolute z-50 ${placementClasses[placement]} animate-fade-in`}
          role="tooltip"
        >
          <div className="rounded-lg bg-surface-overlay px-3 py-1.5 text-xs text-gray-200 shadow-lg border border-white/[0.08] whitespace-nowrap max-w-xs">
            {content}
            <div className={`absolute border-4 ${arrowClasses[placement]}`} />
          </div>
        </div>
      )}
    </div>
  );
}
