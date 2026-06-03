import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BloodRequestCard } from "@/components/BloodRequestCard";
import { BloodRequestOwnerActions } from "@/components/BloodRequestOwnerActions";
import { MatchedDonorCard } from "@/components/MatchedDonorCard";
import { canManageBloodRequest } from "@/lib/blood-request-access";
import { computeTopMatchesForRequest } from "@/lib/data/matching";
import { fetchBloodRequestForViewer } from "@/lib/data/blood-requests";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const request = await fetchBloodRequestForViewer(id, user?.id ?? null);
  return {
    title: request
      ? `${request.blood_group} blood need — RoktoBondhu`
      : "Blood request — RoktoBondhu",
  };
}

export default async function BloodRequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const request = await fetchBloodRequestForViewer(id, user?.id ?? null);
  if (!request) {
    notFound();
  }

  const canManage = user ? await canManageBloodRequest(user.id, request) : false;
  const showMatches = request.status === "active";
  const matches = showMatches
    ? await computeTopMatchesForRequest(request, 10)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pt-28 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-sm font-medium text-red-600 hover:underline"
        >
          ← Back to home
        </Link>

        <div className="mt-6">
          <BloodRequestCard request={request} linkable={false} />
        </div>

        {canManage && (
          <div className="mt-6">
            <BloodRequestOwnerActions request={request} />
          </div>
        )}

        {showMatches ? (
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900">
              Best matching donors
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Ranked by blood group, location, availability, and donor
              reputation. Top matches were notified automatically.
            </p>

            {matches.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
                No matching donors available right now. Check back soon or
                search the donor directory.
              </p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {matches.map((match) => (
                  <MatchedDonorCard
                    key={match.donor_id}
                    match={match}
                    isLoggedIn={!!user}
                    bloodGroup={request.blood_group}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <p className="mt-8 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900">
            This request is not active. Matching and emergency notifications
            are disabled until it is reopened.
          </p>
        )}
      </div>
    </div>
  );
}
