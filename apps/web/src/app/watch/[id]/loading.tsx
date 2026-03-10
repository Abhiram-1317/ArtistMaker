export default function WatchLoading() {
  return (
    <div className="min-h-screen bg-black animate-pulse">
      <div className="max-w-[1400px] mx-auto px-4 pt-4">
        <div className="aspect-video bg-white/5 rounded-xl" />
      </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
