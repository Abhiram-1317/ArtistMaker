"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { UserAnalyticsOverview, ProjectSummary } from "@/lib/analytics-data";
import { StatCard, InsightsPanel } from "@/components/analytics";

const ViewsChart = dynamic(
  () => import("@/components/analytics/views-chart").then((m) => m.ViewsChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-white/5" /> }
);

/* ── Icons ────────────────────────────────────────────────────────────────── */

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

/* ── Sort ──────────────────────────────────────────────────────────────────── */

type SortKey = "views" | "watchTime" | "likes" | "completionRate";
type SortDir = "asc" | "desc";

const GENRE_LABELS: Record<string, string> = {
  SCI_FI: "Sci-Fi",
  FANTASY: "Fantasy",
  DOCUMENTARY: "Documentary",
  DRAMA: "Drama",
  ACTION: "Action",
  COMEDY: "Comedy",
  HORROR: "Horror",
  ANIMATION: "Animation",
  THRILLER: "Thriller",
  ROMANCE: "Romance",
  EXPERIMENTAL: "Experimental",
  OTHER: "Other",
};

function fmtWatchTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/* ── Component ────────────────────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};
const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export function AnalyticsOverviewContent({
  data,
}: {
  data: UserAnalyticsOverview;
}) {
  const [dateRange, setDateRange] = useState("30");
  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const chartData = useMemo(() => {
    if (dateRange === "all") return data.chartData;
    const days = Number(dateRange);
    return data.chartData.slice(-days);
  }, [data.chartData, dateRange]);

  const sortedProjects = useMemo(() => {
    return [...data.topProjects].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [data.topProjects, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const totalHours = Math.round(data.totals.watchTime / 3600);

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="font-heading text-2xl font-bold text-white">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Track performance across all your projects
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total Views"
          value={fmtNumber(data.totals.views)}
          subValue={`${fmtNumber(data.totals.uniqueViews)} unique`}
          trend={{ value: 12.3, label: "vs last period" }}
          icon={<EyeIcon className="h-5 w-5 text-genesis-400" />}
        />
        <StatCard
          label="Watch Hours"
          value={totalHours.toLocaleString()}
          subValue={fmtWatchTime(data.totals.watchTime) + " total"}
          trend={{ value: 8.7, label: "vs last period" }}
          icon={<ClockIcon className="h-5 w-5 text-neon-cyan" />}
          color="neon"
        />
        <StatCard
          label="Total Likes"
          value={fmtNumber(data.totals.likes)}
          subValue={`${Math.round(data.totals.engagementRate * 100)}% engagement`}
          trend={{ value: 5.2, label: "vs last period" }}
          icon={<HeartIcon className="h-5 w-5 text-red-400" />}
        />
        <StatCard
          label="Completion Rate"
          value={`${Math.round(data.totals.completionRate * 100)}%`}
          subValue={`${Math.round(data.totals.averageWatchPercentage * 100)}% avg watch`}
          trend={{ value: -2.1, label: "vs last period" }}
          icon={<ChartIcon className="h-5 w-5 text-amber-400" />}
        />
      </motion.div>

      {/* Views chart */}
      <motion.div variants={fadeUp}>
        <ViewsChart
          data={chartData}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </motion.div>

      {/* Project performance table */}
      <motion.div variants={fadeUp}>
        <div className="rounded-2xl border border-white/[0.06] bg-surface-elevated overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">
              Project Performance
            </h3>
            <p className="text-xs text-gray-500">
              Click a project for detailed analytics
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Project
                  </th>
                  {(
                    [
                      ["views", "Views"],
                      ["likes", "Likes"],
                      ["watchTime", "Watch Time"],
                      ["completionRate", "Completion"],
                    ] as [SortKey, string][]
                  ).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => toggleSort(key)}
                      className="cursor-pointer px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors select-none"
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {sortKey === key && (
                          <span className="text-genesis-400">
                            {sortDir === "desc" ? "↓" : "↑"}
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedProjects.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div variants={fadeUp}>
        <InsightsPanel insights={data.insights} />
      </motion.div>
    </motion.div>
  );
}

/* ── Project Row ──────────────────────────────────────────────────────────── */

function ProjectRow({ project }: { project: ProjectSummary }) {
  return (
    <tr className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
      <td className="px-5 py-3">
        <Link
          href={`/analytics/${project.id}`}
          className="flex items-center gap-3 group"
        >
          <div className="h-9 w-14 rounded-lg bg-surface border border-surface-border overflow-hidden shrink-0 flex items-center justify-center">
            <span className="text-lg opacity-40">🎬</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate group-hover:text-genesis-300 transition-colors">
              {project.title}
            </p>
            <p className="text-[10px] text-gray-600">
              {GENRE_LABELS[project.genre] ?? project.genre}
            </p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 text-right text-sm text-gray-300">
        {fmtNumber(project.views)}
      </td>
      <td className="px-4 py-3 text-right text-sm text-gray-300">
        {fmtNumber(project.likes)}
      </td>
      <td className="px-4 py-3 text-right text-sm text-gray-400">
        {fmtWatchTime(project.watchTime)}
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={`text-sm font-medium ${
            project.completionRate >= 0.5
              ? "text-emerald-400"
              : project.completionRate >= 0.3
                ? "text-amber-400"
                : "text-red-400"
          }`}
        >
          {Math.round(project.completionRate * 100)}%
        </span>
      </td>
    </tr>
  );
}
