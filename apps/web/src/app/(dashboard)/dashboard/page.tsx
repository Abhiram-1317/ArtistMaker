import { Suspense } from "react";
import { getDashboardData } from "@/lib/dashboard-data";
import { getPopularTemplates } from "@/lib/templates-data";
import {
  DashboardContent,
  DashboardSkeleton,
} from "@/components/dashboard-content";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardDataLoader />
    </Suspense>
  );
}

async function DashboardDataLoader() {
  const [data, popularTemplates] = await Promise.all([
    getDashboardData(),
    getPopularTemplates(4),
  ]);

  return (
    <DashboardContent
      userName={data.userName}
      stats={data.stats}
      recentProjects={data.recentProjects}
      activity={data.activity}
      popularTemplates={popularTemplates}
    />
  );
}
