"use client";

import { useState, useEffect, useCallback } from "react";
import type { CreditBalance as CreditBalanceType } from "@/lib/credits-data";
import { getCreditBalance } from "@/lib/credits-data";

interface CreditBalanceProps {
  onClick?: () => void;
  compact?: boolean;
}

function balanceColor(balance: number): string {
  if (balance >= 1000) return "text-emerald-400";
  if (balance >= 100) return "text-yellow-400";
  return "text-red-400";
}

function balanceBg(balance: number): string {
  if (balance >= 1000) return "bg-emerald-500/10 border-emerald-500/20";
  if (balance >= 100) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-red-500/10 border-red-500/20";
}

export default function CreditBalance({ onClick, compact }: CreditBalanceProps) {
  const [data, setData] = useState<CreditBalanceType | null>(null);

  const load = useCallback(async () => {
    const balance = await getCreditBalance();
    setData(balance);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data) {
    return (
      <div className={`animate-pulse ${compact ? "h-6 w-16" : "h-10 w-24"} bg-surface-700 rounded-lg`} />
    );
  }

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors hover:opacity-80 ${balanceBg(data.balance)}`}
      >
        <SparklesIcon className={`w-3.5 h-3.5 ${balanceColor(data.balance)}`} />
        <span className={`text-sm font-bold font-heading ${balanceColor(data.balance)}`}>
          {data.balance.toLocaleString()}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-4 transition-all hover:scale-[1.02] cursor-pointer ${balanceBg(data.balance)}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-surface-400 font-medium">Credit Balance</span>
        <SparklesIcon className={`w-4 h-4 ${balanceColor(data.balance)}`} />
      </div>
      <p className={`text-2xl font-bold font-heading ${balanceColor(data.balance)}`}>
        {data.balance.toLocaleString()}
      </p>
      {data.pendingCredits > 0 && (
        <p className="text-xs text-surface-500 mt-1">
          {data.pendingCredits.toLocaleString()} pending
        </p>
      )}
    </button>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
