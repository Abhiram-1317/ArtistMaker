"use client";

import { useState, useEffect, useCallback } from "react";
import { getCreditTransactions } from "@/lib/credits-data";
import type { CreditTransaction } from "@/lib/credits-data";

interface TransactionHistoryProps {
  limit?: number;
}

const TYPE_STYLES: Record<string, { label: string; cls: string; icon: string }> = {
  PURCHASE: { label: "Purchase", cls: "text-emerald-400 bg-emerald-900/30", icon: "+" },
  USAGE: { label: "Usage", cls: "text-red-400 bg-red-900/30", icon: "" },
  REFUND: { label: "Refund", cls: "text-blue-400 bg-blue-900/30", icon: "+" },
  BONUS: { label: "Bonus", cls: "text-yellow-400 bg-yellow-900/30", icon: "+" },
  SUBSCRIPTION: { label: "Subscription", cls: "text-genesis-400 bg-genesis-900/30", icon: "+" },
};

export default function TransactionHistory({ limit = 10 }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getCreditTransactions(page, limit);
    setTransactions(data.transactions);
    setTotal(data.total);
    setLoading(false);
  }, [page, limit]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50">
            <div className="w-8 h-8 rounded-full bg-surface-700" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-48 bg-surface-700 rounded" />
              <div className="h-3 w-24 bg-surface-700 rounded" />
            </div>
            <div className="h-5 w-16 bg-surface-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-surface-400">
        <p>No transactions yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {transactions.map((tx) => {
          const style = TYPE_STYLES[tx.type] ?? TYPE_STYLES.USAGE;
          const isPositive = tx.amount > 0;

          return (
            <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/30 hover:bg-surface-800/50 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${style.cls}`}>
                {style.icon || "−"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{tx.description}</p>
                <p className="text-xs text-surface-500">
                  {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {tx.status === "PENDING" && (
                    <span className="ml-2 text-yellow-400">• Pending</span>
                  )}
                </p>
              </div>
              <span className={`text-sm font-bold font-heading ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                {isPositive ? "+" : ""}{tx.amount.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg bg-surface-700 text-surface-300 text-sm disabled:opacity-40 hover:bg-surface-600 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-surface-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg bg-surface-700 text-surface-300 text-sm disabled:opacity-40 hover:bg-surface-600 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
