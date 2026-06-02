import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { formatDateTime } from "@/lib/format";
import {
  fetchAdminRecentActivity,
  fetchAdminStats,
} from "@/lib/data/admin";

export default async function AdminDashboardPage() {
  const [stats, activity] = await Promise.all([
    fetchAdminStats(),
    fetchAdminRecentActivity(),
  ]);

  return (
    <>
      <AdminNav currentPath="/admin" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Total users" value={stats.totalUsers} />
        <AdminStatCard
          label="Active donors"
          value={stats.activeDonors}
          hint="Available & not banned"
        />
        <AdminStatCard label="Blood requests" value={stats.totalBloodRequests} />
        <AdminStatCard label="Donations" value={stats.totalDonations} />
        <AdminStatCard label="Reports" value={stats.totalReports} />
        <AdminStatCard
          label="Matches generated"
          value={stats.totalMatchesGenerated}
          hint="Smart matching logs"
        />
        <AdminStatCard
          label="Accepted matches"
          value={stats.acceptedMatches}
        />
        <AdminStatCard
          label="Donations from matches"
          value={stats.successfulDonationsFromMatches}
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No recent activity.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {activity.map((item) => (
                <li key={item.id} className="py-3">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.subtitle}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDateTime(item.at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Quick links</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/admin/reports" className="font-semibold text-red-600 hover:underline">
                Review reports →
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className="font-semibold text-red-600 hover:underline">
                Manage users →
              </Link>
            </li>
            <li>
              <Link href="/admin/requests" className="font-semibold text-red-600 hover:underline">
                Blood requests →
              </Link>
            </li>
            <li>
              <Link href="/admin/analytics" className="font-semibold text-red-600 hover:underline">
                View analytics →
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
