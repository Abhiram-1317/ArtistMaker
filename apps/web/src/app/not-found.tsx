import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-genesis-950">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="text-8xl font-bold bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent">
          404
        </div>
        <h1 className="text-2xl font-semibold text-white">Page not found</h1>
        <p className="text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-genesis-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-genesis-500"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5"
          >
            Explore
          </Link>
        </div>
      </div>
    </div>
  );
}
