import { type HTMLAttributes, forwardRef } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    const variants: Record<string, string> = {
      default: "bg-gray-700 text-gray-200",
      success: "bg-green-900/50 text-green-400 border border-green-800",
      warning: "bg-yellow-900/50 text-yellow-400 border border-yellow-800",
      error: "bg-red-900/50 text-red-400 border border-red-800",
      info: "bg-blue-900/50 text-blue-400 border border-blue-800",
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
