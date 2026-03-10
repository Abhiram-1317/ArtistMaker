import { Suspense } from "react";
import { getProjectAnalytics } from "@/lib/analytics-data";
import { ProjectAnalyticsSkeleton } from "@/components/analytics";
import { ProjectAnalyticsContent } from "./project-analytics-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProjectAnalytics(id, 30);
  return {
    title: data
      ? `${data.project.title} Analytics — Genesis`
      : "Analytics — Genesis",
  };
}

async function ProjectAnalyticsLoader({
  id,
  days,
}: {
  id: string;
  days: number;
}) {
  const data = await getProjectAnalytics(id, days);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <span className="text-4xl mb-4">📊</span>
        <h2 className="text-lg font-bold text-white mb-2">
          Project Not Found
        </h2>
        <p className="text-sm text-gray-500">
          This project doesn&apos;t exist or you don&apos;t have access.
        </p>
      </div>
    );
  }

  return <ProjectAnalyticsContent data={data} />;
}

export default async function ProjectAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<ProjectAnalyticsSkeleton />}>
      <ProjectAnalyticsLoader id={id} days={30} />
    </Suspense>
  );
}
