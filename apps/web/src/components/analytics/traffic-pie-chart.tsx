"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import type { TrafficSource } from "@/lib/analytics-data";

const COLORS = ["#a855f7", "#22d3ee", "#f59e0b", "#10b981", "#ef4444", "#6366f1"];

interface TrafficPieChartProps {
  data: TrafficSource[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TrafficSource }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-surface-elevated p-3 shadow-xl">
      <p className="text-xs font-medium text-white">{item.source}</p>
      <p className="text-xs text-gray-400">
        {item.value.toLocaleString()} views ({Math.round(item.percentage * 100)}%)
      </p>
    </div>
  );
}

export function TrafficPieChart({ data }: TrafficPieChartProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-elevated p-5">
      <h3 className="mb-1 text-sm font-semibold text-white">Traffic Sources</h3>
      <p className="mb-4 text-xs text-gray-500">Where your viewers come from</p>

      <div className="flex items-center gap-6">
        <div className="h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="source"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                    opacity={0.85}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {data.map((item, i) => (
            <div key={item.source} className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="flex-1 text-xs text-gray-400 truncate">
                {item.source}
              </span>
              <span className="text-xs font-medium text-white">
                {Math.round(item.percentage * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
