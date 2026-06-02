import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { SuperAdminNav } from "@/components/super-admin/SuperAdminNav";
import { fetchSuperAdminStats } from "@/lib/data/super-admin";

export default async function SuperAdminDashboardPage() {
  const stats = await fetchSuperAdminStats();

  return (
    <>
      <SuperAdminNav currentPath="/super-admin" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard label="Total users" value={stats.totalUsers} />
        <AdminStatCard label="Total donors (available)" value={stats.totalDonors} />
        <AdminStatCard label="Total donations" value={stats.totalDonations} />
        <AdminStatCard label="Blood requests" value={stats.totalBloodRequests} />
        <AdminStatCard label="Reports" value={stats.totalReports} />
        <AdminStatCard
          label="Total admins"
          value={stats.totalAdmins}
          hint="admin + super_admin roles"
        />
      </div>
    </>
  );
}
