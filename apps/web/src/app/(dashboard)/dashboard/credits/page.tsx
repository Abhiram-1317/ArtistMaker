import { Suspense } from "react";
import CreditsContent, { CreditsSkeleton } from "@/components/credits-content";

export const metadata = {
  title: "Credits – Genesis",
  description: "Manage your credits and billing",
};

export default function CreditsPage() {
  return (
    <Suspense fallback={<CreditsSkeleton />}>
      <CreditsContent />
    </Suspense>
  );
}
