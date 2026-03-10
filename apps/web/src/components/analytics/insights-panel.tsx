"use client";

import { motion } from "framer-motion";
import type { AnalyticsInsight } from "@/lib/analytics-data";

interface InsightsPanelProps {
  insights: AnalyticsInsight[];
}

const TYPE_CONFIG = {
  positive: {
    icon: "✅",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
  },
  negative: {
    icon: "⚠️",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
  },
  neutral: {
    icon: "💡",
    border: "border-genesis-500/20",
    bg: "bg-genesis-500/5",
  },
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-elevated p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm">🧠</span>
        <h3 className="text-sm font-semibold text-white">AI Insights</h3>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        Personalized recommendations for your content
      </p>

      <div className="space-y-3">
        {insights.map((insight, i) => {
          const config = TYPE_CONFIG[insight.type];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl border p-3.5 ${config.border} ${config.bg}`}
            >
              <div className="flex gap-2.5">
                <span className="text-sm shrink-0">{config.icon}</span>
                <div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {insight.message}
                  </p>
                  {insight.action && (
                    <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-genesis-400">
                      → {insight.action}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
