"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: number; label: string };
  icon: React.ReactNode;
  color?: string;
}

const iconBgClasses: Record<string, string> = {
  genesis: "bg-genesis-500/10",
  neon: "bg-neon-cyan/10",
  emerald: "bg-emerald-500/10",
  amber: "bg-amber-500/10",
};
const glowClasses: Record<string, string> = {
  genesis: "bg-genesis-500/5",
  neon: "bg-neon-cyan/5",
  emerald: "bg-emerald-500/5",
  amber: "bg-amber-500/5",
};

export function StatCard({
  label,
  value,
  subValue,
  trend,
  icon,
  color = "genesis",
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-elevated p-5"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subValue && (
            <p className="text-xs text-gray-500">{subValue}</p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBgClasses[color] ?? iconBgClasses.genesis}`}
        >
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={`text-xs font-medium ${
              trend.value >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-600">{trend.label}</span>
        </div>
      )}
      {/* Glow */}
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${glowClasses[color] ?? glowClasses.genesis} blur-2xl`}
      />
    </motion.div>
  );
}
