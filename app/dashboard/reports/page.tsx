import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/DashboardNav";
import { DonationRecordCard } from "@/components/DonationRecordCard";
import { fetchReports } from "@/lib/data/donations";
import { fetchUnreadNotificationCount } from "@/lib/data/donor-requests";

export const metadata = {
  title: "Reports — RoktoBondhu",
};

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/reports");
  }

  const [reports, unreadCount] = await Promise.all([
    fetchReports(user.id),
    fetchUnreadNotificationCount(user.id),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pt-28 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-gray-600">
          Donations flagged for inappropriate behavior (e.g. demanding money).
          Reports you filed and reports filed against you appear here.
        </p>

        <DashboardNav
          currentPath="/dashboard/reports"
          unreadCount={unreadCount}
        />

        {reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
            <p className="text-gray-500">No reports on file.</p>
            <Link
              href="/dashboard/my-requests"
              className="mt-4 inline-block text-sm font-semibold text-red-600 hover:underline"
            >
              View my requests →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((donation) => (
              <DonationRecordCard
                key={donation.id}
                donation={donation}
                view="reports"
                currentUserId={user.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
