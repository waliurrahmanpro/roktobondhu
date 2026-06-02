import { AdminNav } from "@/components/admin/AdminNav";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { BarChart } from "@/components/admin/BarChart";
import { fetchAdminAnalytics, fetchAdminStats } from "@/lib/data/admin";

export default async function AdminAnalyticsPage() {
  const [analytics, stats] = await Promise.all([
    fetchAdminAnalytics(),
    fetchAdminStats(),
  ]);

  return (
    <>
      <AdminNav currentPath="/admin/analytics" />

      <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
      <p className="mt-1 text-sm text-gray-600">
        Platform trends over the last 6 months (from live Supabase data).
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <AdminStatCard
          label="Total matches generated"
          value={stats.totalMatchesGenerated}
        />
        <AdminStatCard
          label="Accepted matches"
          value={stats.acceptedMatches}
        />
        <AdminStatCard
          label="Successful donations from matches"
          value={stats.successfulDonationsFromMatches}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <BarChart title="Donations by month" data={analytics.donationsByMonth} />
        <BarChart title="New users by month" data={analytics.usersByMonth} />
        <BarChart
          title="Top blood groups requested"
          data={analytics.topBloodGroups}
        />
        <BarChart title="Top districts" data={analytics.topDistricts} />
      </div>
    </>
  );
}
