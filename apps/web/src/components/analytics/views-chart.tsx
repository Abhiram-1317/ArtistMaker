"use client";

import { useCallback, useRef, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { ChartDataPoint } from "@/lib/analytics-data";

interface ViewsChartProps {
  data: ChartDataPoint[];
  dateRange: string;
  onDateRangeChange: (range: string) => void;
}

const DATE_RANGES = [
  { label: "7d", value: "7" },
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
  { label: "All", value: "all" },
];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-surface-elevated p-3 shadow-xl">
      <p className="mb-1.5 text-xs font-medium text-gray-400">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="font-medium text-white">
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ViewsChart({
  data,
  dateRange,
  onDateRangeChange,
}: ViewsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showUnique, setShowUnique] = useState(true);

  const handleExport = useCallback(() => {
    if (!chartRef.current) return;
    const svg = chartRef.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "views-chart.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-elevated p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Views Over Time</h3>
          <p className="text-xs text-gray-500">
            Track your viewership trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle unique views */}
          <button
            onClick={() => setShowUnique(!showUnique)}
            className={`rounded-lg px-2.5 py-1 text-xs transition-all ${
              showUnique
                ? "bg-neon-cyan/10 text-neon-cyan"
                : "bg-white/5 text-gray-500 hover:text-gray-300"
            }`}
          >
            Unique
          </button>
          {/* Date range selector */}
          <div className="flex rounded-lg border border-white/10 p-0.5">
            {DATE_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => onDateRangeChange(r.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  dateRange === r.value
                    ? "bg-genesis-600/30 text-genesis-300"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {/* Export */}
          <button
            onClick={handleExport}
            className="rounded-lg bg-white/5 p-1.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-gray-300"
            title="Export chart"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        </div>
      </div>

      <div ref={chartRef} className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="uniqueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="views"
              name="Views"
              stroke="#a855f7"
              fill="url(#viewsGrad)"
              strokeWidth={2}
            />
            {showUnique && (
              <Area
                type="monotone"
                dataKey="uniqueViews"
                name="Unique"
                stroke="#22d3ee"
                fill="url(#uniqueGrad)"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
