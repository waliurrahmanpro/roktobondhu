import { SuperAdminNav } from "@/components/super-admin/SuperAdminNav";
import { formatDateTime } from "@/lib/format";
import { fetchAuditLogs } from "@/lib/data/super-admin";
import { fetchProfilesByUserIds } from "@/lib/data/profiles";

export default async function SuperAdminLogsPage() {
  const logs = await fetchAuditLogs(200);
  const actorIds = logs
    .map((l) => l.actor_id)
    .filter((id): id is string => Boolean(id));
  const profileMap = await fetchProfilesByUserIds(actorIds);

  return (
    <>
      <SuperAdminNav currentPath="/super-admin/logs" />

      <h2 className="text-xl font-bold text-gray-900">Audit logs</h2>
      <p className="mt-1 text-sm text-gray-600">
        Admin actions, bans, point edits, role changes, and broadcasts.
      </p>

      {logs.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">No audit entries yet.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {log.actor_id
                        ? profileMap.get(log.actor_id)?.full_name ?? log.actor_id
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{log.action}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {log.target_type}
                      {log.target_id ? ` · ${log.target_id.slice(0, 8)}…` : ""}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-gray-500">
                      {JSON.stringify(log.details)}
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
