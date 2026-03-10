"use client";

import type { DemographicItem } from "@/lib/analytics-data";

const DEVICE_ICONS: Record<string, string> = {
  Desktop: "🖥️",
  Mobile: "📱",
  Tablet: "📟",
};

const COLORS = ["#a855f7", "#22d3ee", "#f59e0b"];

interface DeviceBreakdownProps {
  data: DemographicItem[];
}

export function DeviceBreakdown({ data }: DeviceBreakdownProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-elevated p-5">
      <h3 className="mb-1 text-sm font-semibold text-white">
        Device Breakdown
      </h3>
      <p className="mb-4 text-xs text-gray-500">How viewers access your content</p>

      <div className="space-y-4">
        {data.map((item, i) => (
          <div key={item.name}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {DEVICE_ICONS[item.name] ?? "💻"}
                </span>
                <span className="text-xs font-medium text-white">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {item.value.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-white">
                  {Math.round(item.percentage * 100)}%
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.percentage * 100}%`,
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
