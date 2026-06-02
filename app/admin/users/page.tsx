import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { fetchAdminUsers } from "@/lib/data/admin";

export default async function AdminUsersPage() {
  const users = await fetchAdminUsers();

  return (
    <>
      <AdminNav currentPath="/admin/users" />

      <h2 className="text-xl font-bold text-gray-900">User management</h2>
      <p className="mt-1 text-sm text-gray-600">
        Ban users to block login, blood requests, and incoming donor requests.
      </p>

      {users.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-gray-500">
          No users found.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Blood</th>
                  <th className="px-4 py-3">Points</th>
                  <th className="px-4 py-3">Donations</th>
                  <th className="px-4 py-3">Reports</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-4">
                      <Link
                        href={`/donor/${user.user_id}`}
                        className="font-medium text-red-600 hover:underline"
                      >
                        {user.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-4">{user.blood_group}</td>
                    <td className="px-4 py-4">{user.total_points ?? 0}</td>
                    <td className="px-4 py-4">{user.total_donations ?? 0}</td>
                    <td className="px-4 py-4">{user.reported_donations ?? 0}</td>
                    <td className="px-4 py-4 capitalize text-gray-600">
                      {(user.role ?? "user").replace("_", " ")}
                    </td>
                    <td className="px-4 py-4">
                      {user.is_banned ? (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                          Banned
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <AdminUserActions
                        userId={user.user_id}
                        isBanned={user.is_banned ?? false}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
