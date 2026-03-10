"use client";

import { useCallback, useRef } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { RetentionPoint } from "@/lib/analytics-data";

interface RetentionChartProps {
  data: RetentionPoint[];
  totalDuration?: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: RetentionPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const mins = Math.floor(item.second / 60);
  const secs = item.second % 60;
  return (
    <div className="rounded-xl border border-white/10 bg-surface-elevated p-3 shadow-xl">
      <p className="text-xs font-medium text-white">
        {mins}:{String(secs).padStart(2, "0")}
      </p>
      <p className="text-xs text-gray-400">
        {item.percentage}% of viewers still watching
      </p>
    </div>
  );
}

export function RetentionChart({ data }: RetentionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Find the steepest drop-off point
  let maxDrop = 0;
  let dropIdx = 0;
  for (let i = 1; i < data.length; i++) {
    const drop = data[i - 1].percentage - data[i].percentage;
    if (drop > maxDrop) {
      maxDrop = drop;
      dropIdx = i;
    }
  }
  const dropSecond = data[dropIdx]?.second ?? 0;

  const handleExport = useCallback(() => {
    if (!chartRef.current) return;
    const svg = chartRef.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "retention-chart.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-elevated p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Audience Retention
          </h3>
          <p className="text-xs text-gray-500">
            % of viewers at each moment
          </p>
        </div>
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

      {/* Drop-off indicator */}
      {maxDrop > 2 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-500/5 px-3 py-2 border border-amber-500/10">
          <span className="text-amber-400 text-xs">⚠</span>
          <span className="text-xs text-amber-300/80">
            Biggest drop-off at{" "}
            {Math.floor(dropSecond / 60)}:{String(dropSecond % 60).padStart(2, "0")}{" "}
            (−{maxDrop.toFixed(1)}%)
          </span>
        </div>
      )}

      <div ref={chartRef} className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="0%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="second"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => {
                const m = Math.floor(v / 60);
                const s = v % 60;
                return `${m}:${String(s).padStart(2, "0")}`;
              }}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={35}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            {maxDrop > 2 && (
              <ReferenceLine
                x={dropSecond}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
            )}
            <Bar
              dataKey="percentage"
              fill="#a855f7"
              opacity={0.6}
              radius={[1, 1, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
