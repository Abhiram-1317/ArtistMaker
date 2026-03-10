"use client";

import { useState } from "react";
import {
  CreditBalance,
  PurchaseCreditsModal,
  SubscriptionPlansModal,
  TransactionHistory,
} from "@/components/credits";

export default function CreditsContent() {
  const [showPurchase, setShowPurchase] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Credits</h1>
          <p className="text-surface-400 mt-1">Manage your credit balance and view transaction history</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPlans(true)}
            className="glass-hover text-surface-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View Plans
          </button>
          <button
            onClick={() => setShowPurchase(true)}
            className="bg-genesis-600 hover:bg-genesis-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Buy Credits
          </button>
        </div>
      </div>

      {/* Balance + Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CreditBalance onClick={() => setShowPurchase(true)} />
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-surface-400 mb-1">Credits Used</p>
          <p className="text-2xl font-heading font-bold text-white">2,250</p>
          <p className="text-xs text-surface-500 mt-1">Across all projects</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-surface-400 mb-1">Total Purchased</p>
          <p className="text-2xl font-heading font-bold text-white">3,500</p>
          <p className="text-xs text-surface-500 mt-1">Lifetime total</p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-heading font-semibold text-white mb-4">Transaction History</h2>
        <TransactionHistory />
      </div>

      {/* Modals */}
      {showPurchase && (
        <PurchaseCreditsModal
          onClose={() => setShowPurchase(false)}
          onShowPlans={() => { setShowPurchase(false); setShowPlans(true); }}
        />
      )}
      {showPlans && (
        <SubscriptionPlansModal
          currentTier="PRO"
          onClose={() => setShowPlans(false)}
          onBuyCredits={() => { setShowPlans(false); setShowPurchase(true); }}
        />
      )}
    </div>
  );
}

export function CreditsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-surface-700 rounded" />
          <div className="h-4 w-64 bg-surface-700 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-24 bg-surface-700 rounded-lg" />
          <div className="h-9 w-28 bg-surface-700 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 space-y-2">
            <div className="h-3 w-20 bg-surface-700 rounded" />
            <div className="h-7 w-24 bg-surface-700 rounded" />
          </div>
        ))}
      </div>
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="h-6 w-40 bg-surface-700 rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-700/50 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
