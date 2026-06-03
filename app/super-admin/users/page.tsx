import Link from "next/link";
import { SuperAdminNav } from "@/components/super-admin/SuperAdminNav";
import { fetchSuperAdminUserList } from "@/lib/data/super-admin-users";

export const metadata = {
  title: "Users — Super Admin",
};

export default async function SuperAdminUsersPage() {
  const users = await fetchSuperAdminUserList();

  return (
    <>
      <SuperAdminNav currentPath="/super-admin/users" />

      <h2 className="text-xl font-bold text-gray-900">User management</h2>
      <p className="mt-1 text-sm text-gray-600">
        Open a user to verify, ban, control donations, or manage cooldowns.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Blood</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Donations</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.user_id} className="hover:bg-purple-50/30">
                  <td className="px-4 py-3 font-medium">{user.full_name}</td>
                  <td className="px-4 py-3">{user.blood_group}</td>
                  <td className="px-4 py-3 text-gray-600">{user.phone}</td>
                  <td className="px-4 py-3">
                    {user.verification_status === "approved" ? (
                      <span className="text-green-700">Yes</span>
                    ) : (
                      <span className="capitalize text-gray-500">
                        {user.verification_status.replace("_", " ")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.donation_availability ? "ON" : "OFF"}
                  </td>
                  <td className="px-4 py-3">
                    {user.is_banned ? (
                      <span className="font-semibold text-red-600">Banned</span>
                    ) : (
                      <span className="text-gray-600">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/super-admin/users/${user.user_id}`}
                      className="font-semibold text-purple-800 hover:underline"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
