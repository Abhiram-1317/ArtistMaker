import { Suspense } from "react";
import { getOwnProfile } from "@/lib/profile-data";
import ProfileContent, { ProfileSkeleton } from "@/components/profile-content";

export const metadata = {
  title: "Profile – Genesis",
  description: "Manage your Genesis profile",
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileLoader />
    </Suspense>
  );
}

async function ProfileLoader() {
  const data = await getOwnProfile();
  return <ProfileContent data={data} />;
}
