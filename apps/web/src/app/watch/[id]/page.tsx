import { Suspense } from "react";
import { getWatchData } from "@/lib/watch-data";
import WatchContent from "./watch-content";

/* ── Metadata ─────────────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getWatchData(id);
  return {
    title: data ? `${data.movie.title} | Genesis` : "Movie Not Found | Genesis",
    description: data?.movie.description?.slice(0, 160) ?? "Watch AI-generated movies on Genesis",
  };
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<WatchSkeleton />}>
      <WatchLoader id={id} />
    </Suspense>
  );
}

async function WatchLoader({ id }: { id: string }) {
  const data = await getWatchData(id);

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🎬</div>
          <h1 className="text-2xl font-heading font-bold text-white">
            Movie not found
          </h1>
          <p className="text-white/50">
            The movie you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <a
            href="/explore"
            className="inline-block px-6 py-2.5 rounded-xl bg-genesis-600 hover:bg-genesis-500 text-white font-medium transition-colors"
          >
            Browse Movies
          </a>
        </div>
      </div>
    );
  }

  return <WatchContent data={data} />;
}

/* ── Skeleton ──────────────────────────────────────────────────────────────── */

function WatchSkeleton() {
  return (
    <div className="min-h-screen bg-black animate-pulse">
      {/* Player skeleton */}
      <div className="max-w-[1400px] mx-auto px-4 pt-4">
        <div className="aspect-video bg-white/5 rounded-xl" />
      </div>

      {/* Info skeleton */}
      <div className="max-w-[1400px] mx-auto px-4 mt-6">
        <div className="flex gap-8">
          <div className="flex-1 space-y-4">
            <div className="h-8 w-96 bg-white/5 rounded-lg" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-white/5 rounded" />
                <div className="h-3 w-20 bg-white/5 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-3/4 bg-white/5 rounded" />
              <div className="h-3 w-1/2 bg-white/5 rounded" />
            </div>
          </div>
          <div className="w-80 space-y-3 hidden lg:block">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-40 aspect-video bg-white/5 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-full bg-white/5 rounded" />
                  <div className="h-3 w-2/3 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
