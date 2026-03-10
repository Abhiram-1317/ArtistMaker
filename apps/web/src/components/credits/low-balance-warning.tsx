"use client";

interface LowBalanceWarningProps {
  balance: number;
  requiredCredits: number;
  onBuyCredits: () => void;
}

export default function LowBalanceWarning({ balance, requiredCredits, onBuyCredits }: LowBalanceWarningProps) {
  const deficit = requiredCredits - balance;

  if (balance >= requiredCredits) return null;

  return (
    <div className="rounded-xl border border-red-800/50 bg-red-950/30 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-300">Insufficient Credits</h4>
          <p className="text-sm text-red-400/80 mt-1">
            This project requires <span className="font-bold text-red-300">{requiredCredits.toLocaleString()}</span> credits
            but you only have <span className="font-bold text-red-300">{balance.toLocaleString()}</span>.
            You need <span className="font-bold text-red-300">{deficit.toLocaleString()}</span> more credits.
          </p>
          <button
            onClick={onBuyCredits}
            className="mt-3 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            Buy Credits
          </button>
        </div>
      </div>
    </div>
  );
}
