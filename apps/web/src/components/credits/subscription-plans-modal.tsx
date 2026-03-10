"use client";

import { SUBSCRIPTION_PLANS } from "@/lib/credits-data";

interface SubscriptionPlansModalProps {
  currentTier?: string;
  onClose: () => void;
  onBuyCredits?: () => void;
}

export default function SubscriptionPlansModal({ currentTier, onClose, onBuyCredits }: SubscriptionPlansModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass w-full max-w-4xl rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-heading font-bold text-white">Subscription Plans</h2>
            <p className="text-sm text-surface-400 mt-1">Choose the plan that fits your creative needs</p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Plan grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrent = currentTier === plan.tier;
            const isRecommended = plan.recommended;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-5 transition-all ${
                  isRecommended
                    ? "border-genesis-500 bg-genesis-950/40 shadow-lg shadow-genesis-500/10"
                    : isCurrent
                    ? "border-neon-500/50 bg-neon-950/20"
                    : "border-surface-600 bg-surface-800/50"
                }`}
              >
                {/* Badges */}
                {isRecommended && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-genesis-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full px-3 py-0.5">
                    Recommended
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-neon-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full px-3 py-0.5">
                    Current Plan
                  </span>
                )}

                {/* Plan name */}
                <h3 className="text-lg font-heading font-bold text-white mt-2">{plan.name}</h3>

                {/* Price */}
                <div className="mt-3 mb-4">
                  {plan.priceMonthly === 0 ? (
                    <p className="text-2xl font-bold text-white">Free</p>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">
                        ${(plan.priceMonthly / 100).toFixed(2)}
                      </span>
                      <span className="text-sm text-surface-400">/month</span>
                    </div>
                  )}
                  <p className="text-sm text-genesis-400 mt-1">
                    {plan.creditsPerMonth.toLocaleString()} credits/month
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-genesis-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-surface-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  disabled={isCurrent}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isCurrent
                      ? "bg-surface-700 text-surface-400 cursor-not-allowed"
                      : isRecommended
                      ? "bg-genesis-600 hover:bg-genesis-500 text-white"
                      : "bg-surface-700 hover:bg-surface-600 text-surface-200"
                  }`}
                >
                  {isCurrent ? "Current Plan" : plan.priceMonthly === 0 ? "Downgrade" : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 text-sm">
          {onBuyCredits && (
            <button onClick={onBuyCredits} className="text-genesis-400 hover:text-genesis-300 transition-colors">
              ← Buy Credit Packs Instead
            </button>
          )}
          <span className="text-surface-500">All plans include a 14-day free trial</span>
        </div>
      </div>
    </div>
  );
}
