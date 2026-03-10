import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { Spinner } from "./spinner";
import { cn } from "./utils";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual treatment */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Show spinner and disable interactions */
  loading?: boolean;
  /** Icon rendered before children */
  iconLeft?: ReactNode;
  /** Icon rendered after children */
  iconRight?: ReactNode;
  /** Render as child element (Radix Slot pattern) */
  asChild?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                  Styles                                    */
/* -------------------------------------------------------------------------- */

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] disabled:opacity-50 disabled:pointer-events-none select-none";

const variants: Record<string, string> = {
  primary:
    "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-pink-500 hover:shadow-purple-500/40 active:scale-[0.98]",
  secondary:
    "border border-purple-500/40 text-purple-300 bg-transparent hover:bg-purple-500/10 hover:border-purple-400/60 active:scale-[0.98]",
  ghost:
    "bg-transparent text-gray-300 hover:bg-white/5 hover:text-white active:bg-white/10",
  danger:
    "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/20 active:scale-[0.98]",
};

const sizes: Record<string, string> = {
  sm: "h-8 px-3 text-sm rounded-md",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

const iconSizes: Record<string, string> = {
  sm: "[&_svg]:h-3.5 [&_svg]:w-3.5",
  md: "[&_svg]:h-4 [&_svg]:w-4",
  lg: "[&_svg]:h-5 [&_svg]:w-5",
};

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      iconLeft,
      iconRight,
      asChild = false,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          iconSizes[size],
          loading && "pointer-events-none opacity-70",
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />
        ) : (
          iconLeft
        )}
        {children}
        {!loading && iconRight}
      </Comp>
    );
  },
);

Button.displayName = "Button";
