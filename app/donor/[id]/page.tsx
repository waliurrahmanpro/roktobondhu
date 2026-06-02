import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicDonorProfileCard } from "@/components/PublicDonorProfileCard";
import { createClient } from "@/lib/supabase/server";
import { fetchPublicDonorProfile } from "@/lib/data/leaderboard";

type DonorProfilePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: DonorProfilePageProps) {
  const { id } = await params;
  const profile = await fetchPublicDonorProfile(id);

  if (!profile) {
    return { title: "Donor not found — RoktoBondhu" };
  }

  return {
    title: `${profile.full_name} — RoktoBondhu`,
    description: `${profile.full_name} (${profile.blood_group}) — ${profile.total_points ?? 0} points, ${profile.total_donations ?? 0} donations`,
  };
}

export default async function DonorProfilePage({ params }: DonorProfilePageProps) {
  const { id } = await params;
  const profile = await fetchPublicDonorProfile(id);

  if (!profile) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pt-28 pb-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/leaderboard"
          className="text-sm font-semibold text-red-600 hover:underline"
        >
          ← Leaderboard
        </Link>
        <div className="mt-6">
          <PublicDonorProfileCard
            profile={profile}
            isLoggedIn={Boolean(user)}
          />
        </div>
      </div>
    </div>
  );
}
