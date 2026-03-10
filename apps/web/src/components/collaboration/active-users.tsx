"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CollabUser, EditLock } from "@/hooks/use-collaboration";

/* ── Props ────────────────────────────────────────────────────────────────── */

interface ActiveUsersProps {
  users: CollabUser[];
  editLocks: Map<string, EditLock>;
  isConnected: boolean;
  maxVisible?: number;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function ActiveUsers({ users, editLocks, isConnected, maxVisible = 5 }: ActiveUsersProps) {
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);

  if (!isConnected || users.length === 0) return null;

  const visible = users.slice(0, maxVisible);
  const overflow = users.length - maxVisible;

  // Map userId → what they're editing
  const userEditing = new Map<string, EditLock>();
  for (const lock of editLocks.values()) {
    userEditing.set(lock.userId, lock);
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Connection indicator */}
      <div className="flex items-center gap-1.5 mr-1">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-white/50 hidden sm:inline">
          {users.length} online
        </span>
      </div>

      {/* Avatar stack */}
      <div className="flex -space-x-2">
        <AnimatePresence mode="popLayout">
          {visible.map((user) => {
            const editing = userEditing.get(user.id);
            const isHovered = hoveredUser === user.id;

            return (
              <motion.div
                key={user.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="relative"
                onMouseEnter={() => setHoveredUser(user.id)}
                onMouseLeave={() => setHoveredUser(null)}
              >
                {/* Avatar circle */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-surface-900 cursor-default transition-transform hover:scale-110 hover:z-10"
                  style={{ backgroundColor: user.color }}
                  title={user.displayName ?? user.email}
                >
                  {getInitials(user.displayName ?? user.email)}
                </div>

                {/* Editing indicator dot */}
                {editing && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-surface-900 animate-pulse" />
                )}

                {/* Hover tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 pointer-events-none"
                    >
                      <div className="bg-surface-800 border border-white/10 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                        <p className="text-sm font-medium text-white">
                          {user.displayName ?? user.email}
                        </p>
                        {editing && (
                          <p className="text-xs text-amber-400 mt-0.5">
                            Editing {editing.elementType}
                          </p>
                        )}
                        {!editing && (
                          <p className="text-xs text-white/40 mt-0.5">Viewing</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Overflow count */}
        {overflow > 0 && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white/70 bg-surface-700 ring-2 ring-surface-900">
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function getInitials(name: string): string {
  const parts = name.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}
