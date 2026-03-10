"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import type { WatchComment } from "@/lib/watch-data";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Icons
 * ══════════════════════════════════════════════════════════════════════════════ */

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const ReplyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path d="M3 10h10a5 5 0 0 1 5 5v6M3 10l6 6M3 10l6-6" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════════════
 *  Avatar
 * ══════════════════════════════════════════════════════════════════════════════ */

function Avatar({ url, name, size = "sm" }: { url: string | null; name: string; size?: "sm" | "md" }) {
  const dim = size === "md" ? "w-10 h-10" : "w-8 h-8";
  const px = size === "md" ? 40 : 32;
  const textSize = size === "md" ? "text-sm" : "text-xs";
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={px}
        height={px}
        className={`${dim} rounded-full object-cover`}
      />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-genesis-600/30 flex items-center justify-center ${textSize} font-bold text-genesis-400`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Relative time
 * ══════════════════════════════════════════════════════════════════════════════ */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  Single Comment
 * ══════════════════════════════════════════════════════════════════════════════ */

function Comment({
  comment,
  depth = 0,
  movieId,
}: {
  comment: WatchComment;
  depth?: number;
  movieId: string;
}) {
  const [liked, setLiked] = useState(comment.liked);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState(comment.replies);

  const toggleLike = useCallback(async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => c + (newLiked ? 1 : -1));
    try {
      await fetch(`/api/watch/${encodeURIComponent(movieId)}/comments/${encodeURIComponent(comment.id)}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: newLiked }),
      });
    } catch {
      setLiked(!newLiked);
      setLikeCount((c) => c + (newLiked ? -1 : 1));
    }
  }, [liked, movieId, comment.id]);

  const submitReply = useCallback(async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;

    const tempReply: WatchComment = {
      id: `temp-${Date.now()}`,
      text: trimmed,
      createdAt: new Date().toISOString(),
      likes: 0,
      liked: false,
      user: { id: "current", username: "you", displayName: "You", avatarUrl: null },
      replies: [],
    };

    setReplies((prev) => [...prev, tempReply]);
    setReplyText("");
    setShowReplyInput(false);

    try {
      await fetch(`/api/watch/${encodeURIComponent(movieId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, parentId: comment.id }),
      });
    } catch {
      // Keep optimistic reply
    }
  }, [replyText, movieId, comment.id]);

  return (
    <div className={`${depth > 0 ? "ml-4 xs:ml-6 sm:ml-8 md:ml-10 mt-3" : "mt-5"}`}>
      <div className="flex gap-3">
        <Avatar url={comment.user.avatarUrl} name={comment.user.displayName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/90">
              {comment.user.displayName}
            </span>
            <span className="text-xs text-white/40">
              @{comment.user.username}
            </span>
            <span className="text-xs text-white/30">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-white/70 mt-1 whitespace-pre-wrap break-words">
            {comment.text}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={toggleLike}
              aria-label={liked ? "Unlike comment" : "Like comment"}
              className={`flex items-center gap-1 text-xs transition-colors ${
                liked ? "text-pink-400" : "text-white/40 hover:text-white/70"
              }`}
            >
              <HeartIcon filled={liked} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            {depth === 0 && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                <ReplyIcon />
                Reply
              </button>
            )}
          </div>

          {/* Reply input */}
          {showReplyInput && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitReply(); }}
                placeholder="Write a reply..."
                className="flex-1 bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-genesis-500"
              />
              <button
                onClick={submitReply}
                disabled={!replyText.trim()}
                className="px-3 py-2 rounded-lg bg-genesis-600 hover:bg-genesis-500 disabled:opacity-40 disabled:hover:bg-genesis-600 transition-colors text-white text-sm"
              >
                Reply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies (1 level) */}
      {replies.length > 0 && (
        <div>
          {replies.map((reply) => (
            <Comment key={reply.id} comment={reply} depth={1} movieId={movieId} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
 *  CommentsSection
 * ══════════════════════════════════════════════════════════════════════════════ */

interface CommentsSectionProps {
  movieId: string;
  initialComments: WatchComment[];
}

export default function CommentsSection({
  movieId,
  initialComments,
}: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialComments.length >= 10);
  const [loadingMore, setLoadingMore] = useState(false);

  const submitComment = useCallback(async () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;

    const temp: WatchComment = {
      id: `temp-${Date.now()}`,
      text: trimmed,
      createdAt: new Date().toISOString(),
      likes: 0,
      liked: false,
      user: { id: "current", username: "you", displayName: "You", avatarUrl: null },
      replies: [],
    };

    setComments((prev) => [temp, ...prev]);
    setNewComment("");

    try {
      await fetch(`/api/watch/${encodeURIComponent(movieId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
    } catch {
      // Keep optimistic comment
    }
  }, [newComment, movieId]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/watch/${encodeURIComponent(movieId)}/comments?page=${page + 1}`,
      );
      const data = await res.json();
      setComments((prev) => [...prev, ...data.comments]);
      setHasMore(data.hasMore);
      setPage((p) => p + 1);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [movieId, page]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading font-bold text-white">
        Comments
        <span className="text-sm text-white/40 font-normal ml-2">
          {comments.length}
        </span>
      </h3>

      {/* New comment input */}
      <div className="flex gap-3">
        <Avatar url={null} name="You" size="md" />
        <div className="flex-1 space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            aria-label="Write a comment"
            rows={2}
            className="w-full bg-surface-overlay border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-genesis-500 resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={submitComment}
              disabled={!newComment.trim()}
              className="px-4 py-2 rounded-lg bg-genesis-600 hover:bg-genesis-500 disabled:opacity-40 disabled:hover:bg-genesis-600 transition-colors text-white text-sm font-medium"
            >
              Comment
            </button>
          </div>
        </div>
      </div>

      {/* Comment list */}
      <div className="divide-y divide-surface-border">
        {comments.map((c) => (
          <Comment key={c.id} comment={c} movieId={movieId} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white/60 hover:text-white transition-colors"
          >
            {loadingMore ? "Loading..." : "Load more comments"}
          </button>
        </div>
      )}
    </div>
  );
}
