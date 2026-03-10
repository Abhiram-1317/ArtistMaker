"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface ProjectMember {
  id: string;
  userId: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  user: { id: string; email: string; name?: string | null };
}

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  members: ProjectMember[];
  currentUserId: string;
  isOwner: boolean;
  onInvite: (emailOrUsername: string, role: "EDITOR" | "VIEWER") => Promise<{ ok: boolean; error?: string }>;
  onRemove: (memberId: string) => Promise<void>;
  onUpdateRole: (memberId: string, role: "EDITOR" | "VIEWER") => Promise<void>;
}

/* ── Icons ───────────────────────────────────────────────────────────────── */

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconUserPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconCrown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" /><rect x="4" y="18" width="16" height="2" rx="1" />
    </svg>
  );
}

function IconLoader() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

/* ── Role badge helper ──────────────────────────────────────────────────── */

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  EDITOR: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  VIEWER: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  PENDING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

/* ══════════════════════════════════════════════════════════════════════════
 *  Component
 * ══════════════════════════════════════════════════════════════════════════ */

export default function InviteModal({
  open,
  onClose,
  members,
  currentUserId,
  isOwner,
  onInvite,
  onRemove,
  onUpdateRole,
}: InviteModalProps) {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const accepted = members.filter((m) => m.status === "ACCEPTED" || m.role === "OWNER");
  const pending = members.filter((m) => m.status === "PENDING");

  const handleInvite = useCallback(async () => {
    if (!emailOrUsername.trim()) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await onInvite(emailOrUsername.trim(), role);
      if (res.ok) {
        setSuccess(`Invitation sent to ${emailOrUsername.trim()}`);
        setEmailOrUsername("");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res.error ?? "Failed to send invitation");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSending(false);
    }
  }, [emailOrUsername, role, onInvite]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg rounded-xl border border-surface-border bg-surface shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <IconUserPlus />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Manage Collaborators</h2>
                    <p className="text-xs text-gray-500">{accepted.length} member{accepted.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <IconX />
                </button>
              </div>

              {/* Invite form */}
              {isOwner && (
                <div className="px-6 py-4 border-b border-surface-border bg-surface-raised/30">
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Invite by email or username
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                      placeholder="email@example.com or username"
                      className="flex-1 h-9 px-3 text-sm rounded-md border border-surface-border bg-surface text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
                      className="h-9 px-3 text-sm rounded-md border border-surface-border bg-surface text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    >
                      <option value="EDITOR">Editor</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                    <button
                      onClick={handleInvite}
                      disabled={sending || !emailOrUsername.trim()}
                      className="h-9 px-4 rounded-md bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {sending ? <IconLoader /> : <IconUserPlus />}
                      Send
                    </button>
                  </div>

                  {/* Feedback */}
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-red-400 mt-2"
                      >
                        {error}
                      </motion.p>
                    )}
                    {success && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-emerald-400 mt-2"
                      >
                        {success}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Member lists */}
              <div className="max-h-80 overflow-y-auto">
                {/* Active members */}
                <div className="px-6 py-3">
                  <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Members
                  </h3>
                  <div className="space-y-1">
                    {accepted.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/3 transition-colors group"
                      >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {(member.user.name ?? member.user.email)[0]?.toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">
                            {member.user.name ?? member.user.email}
                            {member.userId === currentUserId && (
                              <span className="text-gray-500 text-xs ml-1">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                        </div>

                        {/* Role badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${ROLE_COLORS[member.role]}`}>
                          {member.role === "OWNER" && <IconCrown />}
                          {member.role}
                        </span>

                        {/* Actions */}
                        {isOwner && member.role !== "OWNER" && member.userId !== currentUserId && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <select
                              value={member.role}
                              onChange={(e) => onUpdateRole(member.id, e.target.value as "EDITOR" | "VIEWER")}
                              className="h-7 px-2 text-xs rounded border border-surface-border bg-surface text-gray-300 focus:outline-none"
                            >
                              <option value="EDITOR">Editor</option>
                              <option value="VIEWER">Viewer</option>
                            </select>
                            <button
                              onClick={() => onRemove(member.id)}
                              className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Remove member"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending invitations */}
                {pending.length > 0 && (
                  <div className="px-6 py-3 border-t border-surface-border">
                    <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Pending Invitations
                    </h3>
                    <div className="space-y-1">
                      {pending.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/3 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                            {(member.user.name ?? member.user.email)[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300 truncate">
                              {member.user.name ?? member.user.email}
                            </p>
                            <p className="text-xs text-gray-600 truncate">{member.user.email}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${ROLE_COLORS["PENDING"]}`}>
                            Pending
                          </span>
                          {isOwner && (
                            <button
                              onClick={() => onRemove(member.id)}
                              className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="Cancel invitation"
                            >
                              <IconTrash />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-surface-border bg-surface-raised/30">
                <div className="flex items-center gap-4 text-[11px] text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Editors can edit content</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-500" />
                    <span>Viewers can only view</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
