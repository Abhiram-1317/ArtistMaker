"use client";

import type { DemographicItem } from "@/lib/analytics-data";

const FLAG_MAP: Record<string, string> = {
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  Germany: "🇩🇪",
  Canada: "🇨🇦",
  France: "🇫🇷",
  Japan: "🇯🇵",
  Australia: "🇦🇺",
  Brazil: "🇧🇷",
  India: "🇮🇳",
  "South Korea": "🇰🇷",
  Mexico: "🇲🇽",
  Spain: "🇪🇸",
  Italy: "🇮🇹",
  Netherlands: "🇳🇱",
  Sweden: "🇸🇪",
};

interface GeoListProps {
  data: DemographicItem[];
}

export function GeoList({ data }: GeoListProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-elevated p-5">
      <h3 className="mb-1 text-sm font-semibold text-white">
        Geographic Distribution
      </h3>
      <p className="mb-4 text-xs text-gray-500">Top countries by views</p>

      <div className="space-y-2.5">
        {data.map((item, i) => (
          <div
            key={item.name}
            className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2"
          >
            <span className="text-xs font-medium text-gray-600 w-4">
              {i + 1}
            </span>
            <span className="text-sm">{FLAG_MAP[item.name] ?? "🌍"}</span>
            <span className="flex-1 text-xs font-medium text-white truncate">
              {item.name}
            </span>
            <span className="text-xs text-gray-400">
              {item.value.toLocaleString()}
            </span>
            <div className="w-16">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-genesis-500/60"
                  style={{ width: `${item.percentage * 100}%` }}
                />
              </div>
            </div>
            <span className="w-8 text-right text-xs font-medium text-gray-400">
              {Math.round(item.percentage * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
