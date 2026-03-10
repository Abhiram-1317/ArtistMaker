import {
  type InputHTMLAttributes,
  type ReactNode,
  forwardRef,
  useId,
} from "react";
import { cn } from "./utils";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Label displayed above the input */
  label?: string;
  /** Error message displayed below the input */
  error?: string;
  /** Helper / description text */
  hint?: string;
  /** Icon or element rendered at the start of the input */
  prefixIcon?: ReactNode;
  /** Icon or element rendered at the end of the input */
  suffixIcon?: ReactNode;
  /** Size preset */
  size?: "sm" | "md" | "lg";
}

/* -------------------------------------------------------------------------- */
/*                                  Styles                                    */
/* -------------------------------------------------------------------------- */

const sizes: Record<string, string> = {
  sm: "h-8 text-sm px-3",
  md: "h-10 text-sm px-3.5",
  lg: "h-12 text-base px-4",
};

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      prefixIcon,
      suffixIcon,
      size = "md",
      className,
      id: idProp,
      disabled,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const id = idProp ?? autoId;

    return (
      <div className="flex flex-col gap-1.5">
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-300 select-none"
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Prefix icon */}
          {prefixIcon && (
            <span className="absolute left-3 flex items-center text-gray-500 [&_svg]:h-4 [&_svg]:w-4 pointer-events-none">
              {prefixIcon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            className={cn(
              "w-full rounded-lg border bg-white/5 text-gray-100 placeholder:text-gray-500",
              "transition-all duration-200 outline-none",
              "focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error
                ? "border-red-500/60 focus:ring-red-500/50 focus:border-red-500"
                : "border-white/10 hover:border-white/20",
              sizes[size],
              prefixIcon ? "pl-10" : undefined,
              suffixIcon ? "pr-10" : undefined,
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...props}
          />

          {/* Suffix icon */}
          {suffixIcon && (
            <span className="absolute right-3 flex items-center text-gray-500 [&_svg]:h-4 [&_svg]:w-4 pointer-events-none">
              {suffixIcon}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p id={`${id}-error`} className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* Hint */}
        {!error && hint && (
          <p id={`${id}-hint`} className="text-xs text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
