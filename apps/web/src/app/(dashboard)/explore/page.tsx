import { Suspense } from "react";
import { getExploreData } from "@/lib/explore-data";
import { ExplorePage } from "./explore-content";

export const metadata = {
  title: "Explore AI Cinema | Genesis",
  description: "Discover movies created by the Genesis AI community",
};

export default function ExploreRoute() {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <ExploreLoader />
    </Suspense>
  );
}

async function ExploreLoader() {
  const data = await getExploreData();
  return <ExplorePage initialData={data} />;
}

/* ── Loading skeleton ─────────────────────────────────────────────────────── */

function ExploreSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      {/* Hero skeleton */}
      <div className="text-center space-y-4 py-8">
        <div className="h-10 w-72 mx-auto rounded-xl bg-white/5" />
        <div className="h-5 w-96 mx-auto rounded-lg bg-white/5" />
        <div className="h-12 w-full max-w-xl mx-auto rounded-xl bg-white/5 mt-6" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-full bg-white/5 shrink-0" />
        ))}
      </div>

      {/* Featured grid */}
      <div>
        <div className="h-7 w-48 rounded-lg bg-white/5 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl overflow-hidden">
              <div className="aspect-video bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 rounded bg-white/5" />
                <div className="h-4 w-1/2 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
