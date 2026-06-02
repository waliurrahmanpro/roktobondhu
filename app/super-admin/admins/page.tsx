import { SuperAdminNav } from "@/components/super-admin/SuperAdminNav";
import { RoleActions } from "@/components/super-admin/RoleActions";
import { createClient } from "@/lib/supabase/server";
import { fetchStaffProfiles } from "@/lib/data/super-admin";
import type { UserRole } from "@/lib/types/database";

export default async function SuperAdminAdminsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profiles = await fetchStaffProfiles();

  return (
    <>
      <SuperAdminNav currentPath="/super-admin/admins" />

      <h2 className="text-xl font-bold text-gray-900">Admin management</h2>
      <p className="mt-1 text-sm text-gray-600">
        Promote or demote users. Only super admins can manage roles.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="px-4 py-4 font-medium">{profile.full_name}</td>
                  <td className="px-4 py-4 capitalize">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        profile.role === "super_admin"
                          ? "bg-purple-100 text-purple-900"
                          : profile.role === "admin"
                            ? "bg-blue-100 text-blue-900"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {(profile.role ?? "user").replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4">{profile.total_points ?? 0}</td>
                  <td className="px-4 py-4">
                    <RoleActions
                      userId={profile.user_id}
                      currentRole={(profile.role ?? "user") as UserRole}
                      currentUserId={user!.id}
                    />
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
