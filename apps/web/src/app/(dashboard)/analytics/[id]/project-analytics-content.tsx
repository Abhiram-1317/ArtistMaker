"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ProjectAnalytics } from "@/lib/analytics-data";
import {
  StatCard,
  DeviceBreakdown,
  GeoList,
  InsightsPanel,
} from "@/components/analytics";

const ViewsChart = dynamic(
  () => import("@/components/analytics/views-chart").then((m) => m.ViewsChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-white/5" /> }
);
const TrafficPieChart = dynamic(
  () => import("@/components/analytics/traffic-pie-chart").then((m) => m.TrafficPieChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-white/5" /> }
);
const RetentionChart = dynamic(
  () => import("@/components/analytics/retention-chart").then((m) => m.RetentionChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-white/5" /> }
);
const EngagementChart = dynamic(
  () => import("@/components/analytics/engagement-chart").then((m) => m.EngagementChart),
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

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

export function ProjectAnalyticsContent({
  data,
}: {
  data: ProjectAnalytics;
}) {
  const [dateRange, setDateRange] = useState("30");

  const chartData = useMemo(() => {
    if (dateRange === "all") return data.chartData;
    const days = Number(dateRange);
    return data.chartData.slice(-days);
  }, [data.chartData, dateRange]);

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-4">
        <Link
          href="/analytics"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">
            {data.project.title}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Detailed analytics & insights
          </p>
        </div>
      </motion.div>

      {/* A. Summary cards */}
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
          label="Avg Watch Time"
          value={fmtWatchTime(
            data.totals.views > 0
              ? data.totals.watchTime / data.totals.views
              : 0,
          )}
          subValue={fmtWatchTime(data.totals.watchTime) + " total"}
          trend={{ value: 5.8, label: "vs last period" }}
          icon={<ClockIcon className="h-5 w-5 text-neon-cyan" />}
          color="neon"
        />
        <StatCard
          label="Completion Rate"
          value={`${Math.round(data.totals.completionRate * 100)}%`}
          subValue="viewers watched to end"
          trend={{ value: 3.2, label: "vs last period" }}
          icon={<CheckIcon className="h-5 w-5 text-emerald-400" />}
        />
        <StatCard
          label="Engagement Rate"
          value={`${Math.round(data.totals.engagementRate * 100)}%`}
          subValue={`${fmtNumber(data.totals.likes)} likes / ${fmtNumber(data.totals.views)} views`}
          trend={{ value: -1.4, label: "vs last period" }}
          icon={<SparkleIcon className="h-5 w-5 text-amber-400" />}
        />
      </motion.div>

      {/* B. Views chart */}
      <motion.div variants={fadeUp}>
        <ViewsChart
          data={chartData}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </motion.div>

      {/* C. Retention + D. Traffic sources */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <RetentionChart data={data.retentionData} />
        <TrafficPieChart data={data.trafficSources} />
      </motion.div>

      {/* E. Geographic + F. Device breakdown */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <GeoList data={data.countries} />
        <DeviceBreakdown data={data.devices} />
      </motion.div>

      {/* G. Engagement chart */}
      <motion.div variants={fadeUp}>
        <EngagementChart data={chartData} />
      </motion.div>

      {/* Insights */}
      <motion.div variants={fadeUp}>
        <InsightsPanel insights={data.insights} />
      </motion.div>
    </motion.div>
  );
}
