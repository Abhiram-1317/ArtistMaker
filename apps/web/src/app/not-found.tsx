import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface relative overflow-hidden">
      {/* Cinematic background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-genesis-500/5 rounded-full blur-3xl" />

      <div className="text-center space-y-8 max-w-lg px-4 relative z-10 animate-fade-in">
        {/* Film clapper icon */}
        <div className="mx-auto w-24 h-24 relative">
          <svg viewBox="0 0 96 96" fill="none" className="w-full h-full">
            <rect x="8" y="28" width="80" height="56" rx="4" className="fill-surface-raised stroke-genesis-500/30" strokeWidth="2" />
            <rect x="8" y="18" width="80" height="14" rx="3" className="fill-genesis-900/50 stroke-genesis-500/40" strokeWidth="2" />
            <path d="M20 18l8 14M36 18l8 14M52 18l8 14M68 18l8 14" className="stroke-genesis-500/30" strokeWidth="2" />
            <circle cx="48" cy="56" r="12" className="stroke-genesis-500/40" strokeWidth="2" fill="none" />
            <circle cx="48" cy="56" r="4" className="fill-genesis-500/30" />
          </svg>
        </div>

        <div className="space-y-2">
          <p className="text-genesis-400 text-sm font-mono tracking-wider uppercase">Error 404</p>
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-white">
            Scene Not Found
          </h1>
        </div>

        <p className="text-gray-400 text-lg leading-relaxed">
          This scene didn&apos;t make the final cut. The page you&apos;re looking for
          may have been moved, renamed, or is still in post-production.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Back to Home
          </Link>
          <Link href="/explore" className="btn-secondary gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            Explore Movies
          </Link>
        </div>

        <p className="text-gray-600 text-xs">
          If you think this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
