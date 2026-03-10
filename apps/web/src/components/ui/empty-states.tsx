"use client";

import Link from "next/link";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

function EmptyStateShell({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="mb-6 text-gray-500">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 text-center max-w-sm mb-6">{description}</p>
      {action && (
        action.href ? (
          <Link href={action.href} className="btn-primary text-sm">
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="btn-primary text-sm">
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

// ── No Projects ──────────────────────────────────────────────────────────────
export function EmptyProjects() {
  return (
    <EmptyStateShell
      icon={
        <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
          <rect x="10" y="15" width="60" height="50" rx="6" className="stroke-gray-600" strokeWidth="2" strokeDasharray="4 3" />
          <circle cx="40" cy="38" r="10" className="stroke-genesis-500/60" strokeWidth="2" />
          <path d="M37 38l2 2 4-4" className="stroke-genesis-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="25" y="52" width="30" height="3" rx="1.5" className="fill-gray-700" />
        </svg>
      }
      title="No projects yet"
      description="Your cinematic journey begins here. Create your first AI-powered movie and bring your imagination to life."
      action={{ label: "Create Your First Movie", href: "/projects/new" }}
    />
  );
}

// ── No Search Results ────────────────────────────────────────────────────────
export function EmptySearchResults({ query }: { query?: string }) {
  return (
    <EmptyStateShell
      icon={
        <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
          <circle cx="35" cy="35" r="16" className="stroke-gray-600" strokeWidth="2" />
          <path d="M47 47l14 14" className="stroke-gray-600" strokeWidth="2" strokeLinecap="round" />
          <path d="M30 32h10M30 38h6" className="stroke-gray-500" strokeWidth="2" strokeLinecap="round" />
        </svg>
      }
      title="No results found"
      description={
        query
          ? `We couldn't find anything matching "${query}". Try adjusting your search or explore trending movies.`
          : "Try a different search term or browse our featured content."
      }
      action={{ label: "Explore Trending", href: "/explore" }}
    />
  );
}

// ── No Notifications ─────────────────────────────────────────────────────────
export function EmptyNotifications() {
  return (
    <EmptyStateShell
      icon={
        <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
          <path d="M40 18v4" className="stroke-gray-500" strokeWidth="2" strokeLinecap="round" />
          <path d="M26 46a14 14 0 0128 0" className="stroke-gray-600" strokeWidth="2" fill="none" />
          <path d="M22 46h36" className="stroke-gray-600" strokeWidth="2" strokeLinecap="round" />
          <circle cx="40" cy="54" r="3" className="fill-gray-600" />
          <path d="M34 60a6 6 0 0012 0" className="stroke-gray-600" strokeWidth="2" fill="none" />
        </svg>
      }
      title="All caught up!"
      description="You have no new notifications. We'll let you know when something exciting happens."
    />
  );
}

// ── No Analytics Data ────────────────────────────────────────────────────────
export function EmptyAnalytics() {
  return (
    <EmptyStateShell
      icon={
        <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
          <rect x="14" y="50" width="8" height="12" rx="2" className="fill-gray-700" />
          <rect x="26" y="42" width="8" height="20" rx="2" className="fill-gray-700" />
          <rect x="38" y="34" width="8" height="28" rx="2" className="fill-genesis-500/30" />
          <rect x="50" y="26" width="8" height="36" rx="2" className="fill-gray-700" />
          <rect x="62" y="20" width="8" height="42" rx="2" className="fill-gray-700" />
          <path d="M14 62h60" className="stroke-gray-600" strokeWidth="1.5" />
          <circle cx="42" cy="24" r="5" className="stroke-genesis-500/50" strokeWidth="1.5" fill="none" />
          <path d="M42 22v4M40 24h4" className="stroke-genesis-500/50" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      }
      title="No analytics yet"
      description="Once your movies start getting views, you'll see detailed insights and engagement metrics here."
      action={{ label: "Create a Movie", href: "/projects/new" }}
    />
  );
}
