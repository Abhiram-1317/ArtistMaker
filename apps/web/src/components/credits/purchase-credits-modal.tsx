"use client";

import { useState } from "react";
import { CREDIT_PACKAGES, purchaseCredits } from "@/lib/credits-data";
import type { CreditPackage } from "@/lib/credits-data";

interface PurchaseCreditsModalProps {
  onClose: () => void;
  onShowPlans?: () => void;
}

export default function PurchaseCreditsModal({ onClose, onShowPlans }: PurchaseCreditsModalProps) {
  const [selected, setSelected] = useState<string>(CREDIT_PACKAGES[2].id);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase() {
    setPurchasing(true);
    setError(null);

    const result = await purchaseCredits(selected);
    if ("checkoutUrl" in result && result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
    } else {
      setError("error" in result ? result.error : "Failed to start checkout");
      setPurchasing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass w-full max-w-2xl rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-heading font-bold text-white">Buy Credits</h2>
            <p className="text-sm text-surface-400 mt-1">Select a credit package to power your creations</p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors p-1">
            <XIcon />
          </button>
        </div>

        {error && (
          <div className="bg-red-900/40 text-red-300 text-sm rounded-lg p-3 mb-4">{error}</div>
        )}

        {/* Package cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {CREDIT_PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isSelected={selected === pkg.id}
              onSelect={() => setSelected(pkg.id)}
            />
          ))}
        </div>

        {/* Purchase button */}
        <button
          onClick={handlePurchase}
          disabled={purchasing}
          className="w-full bg-genesis-600 hover:bg-genesis-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl px-6 py-3 transition-colors text-lg"
        >
          {purchasing ? "Redirecting to checkout…" : `Purchase ${CREDIT_PACKAGES.find((p) => p.id === selected)?.credits.toLocaleString()} Credits`}
        </button>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          {onShowPlans && (
            <button onClick={onShowPlans} className="text-genesis-400 hover:text-genesis-300 transition-colors">
              View Subscription Plans →
            </button>
          )}
          <span className="text-surface-500">Powered by Stripe</span>
        </div>
      </div>
    </div>
  );
}

/* ── Package Card ─────────────────────────────────────────────────────────── */

function PackageCard({
  pkg,
  isSelected,
  onSelect,
}: {
  pkg: CreditPackage;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative text-left rounded-xl border-2 p-5 transition-all hover:scale-[1.02] ${
        isSelected
          ? "border-genesis-500 bg-genesis-950/40 shadow-lg shadow-genesis-500/10"
          : "border-surface-600 bg-surface-800/50 hover:border-surface-500"
      }`}
    >
      {/* Badges */}
      <div className="flex items-center gap-2 mb-3">
        {pkg.bestValue && (
          <span className="bg-genesis-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5">
            Best Value
          </span>
        )}
        {pkg.bonus > 0 && (
          <span className="bg-neon-900/60 text-neon-300 text-[10px] font-bold rounded-full px-2 py-0.5">
            +{pkg.bonus}% Bonus
          </span>
        )}
      </div>

      {/* Credits */}
      <p className="text-3xl font-heading font-bold text-white">
        {pkg.credits.toLocaleString()}
      </p>
      <p className="text-sm text-surface-400">credits</p>

      {/* Price */}
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-xl font-bold text-white">{pkg.priceDisplay}</span>
        <span className="text-xs text-surface-500">
          (${(pkg.price / pkg.credits / 100).toFixed(4)}/credit)
        </span>
      </div>

      {/* Label */}
      <p className="text-sm text-surface-300 mt-2">{pkg.label}</p>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-genesis-500 flex items-center justify-center">
          <CheckIcon />
        </div>
      )}
    </button>
  );
}

/* ── Icons ────────────────────────────────────────────────────────────────── */

function XIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
