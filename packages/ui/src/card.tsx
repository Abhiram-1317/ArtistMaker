import { type HTMLAttributes, type ReactNode, forwardRef } from "react";
import { cn } from "./utils";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual treatment */
  variant?: "default" | "elevated" | "outlined";
  /** Enable glow-on-hover border effect */
  hover?: boolean;
  /** Background image URL */
  image?: string;
  /** Overlay opacity when an image is set (0–100) */
  overlayOpacity?: number;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

/* -------------------------------------------------------------------------- */
/*                                  Styles                                    */
/* -------------------------------------------------------------------------- */

const variantStyles: Record<string, string> = {
  default: "bg-[#12121a] border border-white/[0.06]",
  elevated:
    "bg-[#12121a] border border-white/[0.06] shadow-xl shadow-black/30",
  outlined: "bg-transparent border border-white/10",
};

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      hover = false,
      image,
      overlayOpacity = 60,
      className,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl transition-all duration-300",
          variantStyles[variant],
          hover &&
            "hover:border-purple-500/30 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)]",
          className,
        )}
        style={
          image
            ? {
                backgroundImage: `url(${image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                ...style,
              }
            : style
        }
        {...props}
      >
        {/* Dark overlay for image backgrounds */}
        {image && (
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity / 100 }}
          />
        )}

        {/* Content sits above the overlay */}
        <div className={cn("relative", image && "z-10")}>{children}</div>
      </div>
    );
  },
);

Card.displayName = "Card";

/* ---------- Sub-components ---------- */

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-6 pt-6 pb-2 text-lg font-semibold text-white",
        className,
      )}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 py-4 text-gray-400 text-sm leading-relaxed", className)}
      {...props}
    />
  ),
);
CardBody.displayName = "CardBody";

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-6 pb-6 pt-2 flex items-center gap-3 border-t border-white/[0.06]",
        className,
      )}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";
