"use client";

import { type ReactNode, forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "./utils";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface ModalProps {
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state should change */
  onOpenChange?: (open: boolean) => void;
  /** Trigger element that opens the modal */
  trigger?: ReactNode;
  /** Modal contents */
  children: ReactNode;
}

export interface ModalContentProps
  extends DialogPrimitive.DialogContentProps {
  /** Title for a11y (always rendered for screen readers, visible by default) */
  title?: string;
  /** Optional description text */
  description?: string;
  /** Hide the close button */
  hideClose?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                 Root                                       */
/* -------------------------------------------------------------------------- */

export function Modal({ open, onOpenChange, trigger, children }: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      )}
      {children}
    </DialogPrimitive.Root>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Overlay                                      */
/* -------------------------------------------------------------------------- */

const ModalOverlay = forwardRef<
  HTMLDivElement,
  DialogPrimitive.DialogOverlayProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
      // enter
      "data-[state=open]:animate-[fade-in_200ms_ease-out]",
      // exit
      "data-[state=closed]:animate-[fade-out_150ms_ease-in]",
      className,
    )}
    {...props}
  />
));
ModalOverlay.displayName = "ModalOverlay";

/* -------------------------------------------------------------------------- */
/*                                Content                                     */
/* -------------------------------------------------------------------------- */

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  (
    { title, description, hideClose = false, className, children, ...props },
    ref,
  ) => (
    <DialogPrimitive.Portal>
      <ModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // positioning
          "fixed z-50 inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          // sizing – full screen on mobile, dialog on sm+
          "w-full h-full sm:w-full sm:max-w-lg sm:h-auto sm:max-h-[85vh]",
          // appearance
          "bg-[#12121a] sm:rounded-2xl border-0 sm:border border-white/[0.06] shadow-2xl",
          "flex flex-col overflow-y-auto",
          // animation
          "data-[state=open]:animate-[slide-up_300ms_ease-out]",
          "data-[state=closed]:animate-[slide-down_200ms_ease-in]",
          // focus
          "outline-none",
          className,
        )}
        {...props}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
            <div>
              {title && (
                <DialogPrimitive.Title className="text-lg font-semibold text-white">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="mt-1 text-sm text-gray-400">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>

            {!hideClose && (
              <DialogPrimitive.Close
                aria-label="Close"
                className={cn(
                  "shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors",
                  "hover:bg-white/5 hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                )}
              >
                {/* X icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </DialogPrimitive.Close>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 px-6 py-4">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);

ModalContent.displayName = "ModalContent";

/* Re-export useful primitives */
export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;
