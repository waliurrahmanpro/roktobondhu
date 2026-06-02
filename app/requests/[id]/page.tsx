import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BloodRequestCard } from "@/components/BloodRequestCard";
import { MatchedDonorCard } from "@/components/MatchedDonorCard";
import {
  computeTopMatchesForRequest,
  fetchBloodRequestById,
} from "@/lib/data/matching";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const request = await fetchBloodRequestById(id);
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

  const request = await fetchBloodRequestById(id);
  if (!request) {
    notFound();
  }

  const matches = await computeTopMatchesForRequest(request, 10);

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

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900">Best matching donors</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ranked by blood group, location, availability, and donor reputation.
            Top matches were notified automatically.
          </p>

          {matches.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
              No matching donors available right now. Check back soon or search
              the donor directory.
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
      </div>
    </div>
  );
}
