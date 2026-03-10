import { Suspense } from "react";
import { getUserAnalytics } from "@/lib/analytics-data";
import { AnalyticsSkeleton } from "@/components/analytics";
import { AnalyticsOverviewContent } from "./analytics-content";

export const metadata = { title: "Analytics — Genesis" };

async function AnalyticsLoader() {
  const data = await getUserAnalytics(30);
  return <AnalyticsOverviewContent data={data} />;
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsLoader />
    </Suspense>
  );
}
