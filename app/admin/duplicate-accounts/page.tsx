import { AdminNav } from "@/components/admin/AdminNav";
import { fetchDuplicatePhoneAccounts } from "@/lib/data/admin";

export const metadata = {
  title: "Duplicate Accounts — Admin",
};

export default async function AdminDuplicateAccountsPage() {
  const duplicates = await fetchDuplicatePhoneAccounts();
  const affectedUsers = duplicates.reduce((n, g) => n + g.users.length, 0);

  return (
    <>
      <AdminNav currentPath="/admin/duplicate-accounts" />

      <h2 className="text-xl font-bold text-gray-900">Duplicate accounts</h2>
      <p className="mt-1 text-sm text-gray-600">
        Phone numbers shared by more than one profile. Review manually — no
        accounts are changed or deleted automatically.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-2xl font-bold text-amber-900">
            {duplicates.length}
          </p>
          <p className="text-sm text-amber-800">Duplicate phone numbers</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-2xl font-bold text-gray-900">{affectedUsers}</p>
          <p className="text-sm text-gray-600">Affected users</p>
        </div>
      </div>

      {duplicates.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-500">
          No duplicate phone numbers found in live Supabase data.
        </p>
      ) : (
        <ul className="mt-8 space-y-6">
          {duplicates.map((group) => (
            <li
              key={group.phoneNormalized}
              className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {group.phoneDisplay}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Normalized: {group.phoneNormalized}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                  {group.users.length} accounts
                </span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">User ID</th>
                      <th className="py-2">Stored phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {group.users.map((u) => (
                      <tr key={u.user_id}>
                        <td className="py-3 font-medium text-gray-900">
                          {u.full_name}
                        </td>
                        <td className="py-3 font-mono text-xs text-gray-600">
                          {u.user_id}
                        </td>
                        <td className="py-3 text-gray-600">{u.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
