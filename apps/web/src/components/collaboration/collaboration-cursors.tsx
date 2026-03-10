"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CollabUser, CursorPosition } from "@/hooks/use-collaboration";

/* ── Props ────────────────────────────────────────────────────────────────── */

interface CollaborationCursorsProps {
  cursors: Map<string, CursorPosition>;
  users: CollabUser[];
  /** Current user ID to exclude */
  currentUserId?: string;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function CollaborationCursors({ cursors, users, currentUserId }: CollaborationCursorsProps) {
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {Array.from(cursors.entries())
          .filter(([userId]) => userId !== currentUserId)
          .map(([userId, cursor]) => {
            const user = userMap.get(userId);
            if (!user) return null;

            return (
              <motion.div
                key={userId}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  x: cursor.x,
                  y: cursor.y,
                }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.5 }}
                className="absolute top-0 left-0"
              >
                {/* Cursor arrow */}
                <svg
                  width="16"
                  height="20"
                  viewBox="0 0 16 20"
                  fill="none"
                  className="drop-shadow-lg"
                >
                  <path
                    d="M0.5 0.5L15.5 10L8 11L5 19.5L0.5 0.5Z"
                    fill={user.color}
                    stroke="white"
                    strokeWidth="0.5"
                  />
                </svg>

                {/* Name label */}
                <div
                  className="absolute top-4 left-3 px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap shadow-lg"
                  style={{ backgroundColor: user.color }}
                >
                  {user.displayName ?? user.email.split("@")[0]}
                </div>
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
  );
}
