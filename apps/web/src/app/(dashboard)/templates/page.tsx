import { Suspense } from "react";
import { getTemplates } from "@/lib/templates-data";
import { TemplatesPageContent } from "./templates-content";

export const metadata = {
  title: "Templates | Genesis",
  description: "Browse and use pre-built templates to jumpstart your AI movie projects",
};

export default function TemplatesRoute() {
  return (
    <Suspense fallback={<TemplatesSkeleton />}>
      <TemplatesLoader />
    </Suspense>
  );
}

async function TemplatesLoader() {
  const templates = await getTemplates();
  return <TemplatesPageContent templates={templates} />;
}

function TemplatesSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-lg bg-white/5" />
        <div className="h-4 w-96 rounded bg-white/5" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-28 rounded-lg bg-white/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass p-4 rounded-2xl space-y-3">
            <div className="aspect-[16/10] rounded-xl bg-white/5" />
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-3 w-48 rounded bg-white/5" />
            <div className="flex gap-2">
              <div className="h-3 w-12 rounded bg-white/5" />
              <div className="h-3 w-12 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
