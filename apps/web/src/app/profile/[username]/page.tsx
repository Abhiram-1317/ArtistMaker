import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/profile-data";
import ProfileContent, { ProfileSkeleton } from "@/components/profile-content";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await getProfileByUsername(username);
  if (!data) return { title: "User Not Found – Genesis" };
  return {
    title: `${data.user.displayName} (@${data.user.username}) – Genesis`,
    description: data.user.bio ?? `Check out ${data.user.displayName}'s movies on Genesis`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileLoader params={params} />
    </Suspense>
  );
}

async function ProfileLoader({ params }: { params: Props["params"] }) {
  const { username } = await params;
  const data = await getProfileByUsername(username);
  if (!data) notFound();
  return <ProfileContent data={data} />;
}
