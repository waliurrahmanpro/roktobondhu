import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/DashboardNav";
import { DonationRecordCard } from "@/components/DonationRecordCard";
import { POINTS_PER_DONATION } from "@/lib/constants";
import { fetchMyDonations } from "@/lib/data/donations";
import { fetchUnreadNotificationCount } from "@/lib/data/donor-requests";

export const metadata = {
  title: "My donations — Blood Bridge BD",
};

export default async function MyDonationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/my-donations");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_points, total_donations")
    .eq("user_id", user.id)
    .single();

  const [donations, unreadCount] = await Promise.all([
    fetchMyDonations(user.id),
    fetchUnreadNotificationCount(user.id),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pt-28 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">My donations</h1>
        <p className="mt-2 text-gray-600">
          Confirmed donations where you helped as a donor. Each earns{" "}
          {POINTS_PER_DONATION} points.
        </p>

        <DashboardNav
          currentPath="/dashboard/my-donations"
          unreadCount={unreadCount}
        />

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-2xl font-bold text-amber-800">
              {profile?.total_points ?? 0}
            </p>
            <p className="text-sm font-medium text-gray-900">Total points</p>
          </div>
          <div className="rounded-xl border border-red-100 bg-white p-4">
            <p className="text-2xl font-bold text-red-600">
              {profile?.total_donations ?? 0}
            </p>
            <p className="text-sm font-medium text-gray-900">Total donations</p>
          </div>
        </div>

        {donations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
            <p className="text-gray-500">
              No confirmed donations yet. Accept incoming requests and wait for
              the requester to confirm.
            </p>
            <Link
              href="/dashboard/incoming"
              className="mt-4 inline-block text-sm font-semibold text-red-600 hover:underline"
            >
              View incoming requests →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {donations.map((donation) => (
              <DonationRecordCard
                key={donation.id}
                donation={donation}
                view="donor"
                currentUserId={user.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
