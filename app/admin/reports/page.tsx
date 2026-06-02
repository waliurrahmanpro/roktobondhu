import { AdminNav } from "@/components/admin/AdminNav";
import { AdminReportActions } from "@/components/admin/AdminReportActions";
import { formatDate } from "@/lib/format";
import {
  fetchAdminReportedDonations,
  formatReportStatus,
} from "@/lib/data/admin";

export default async function AdminReportsPage() {
  const reports = await fetchAdminReportedDonations();

  return (
    <>
      <AdminNav currentPath="/admin/reports" />

      <h2 className="text-xl font-bold text-gray-900">Reported donations</h2>
      <p className="mt-1 text-sm text-gray-600">
        Review feedback where receivers reported inappropriate donor behavior.
      </p>

      {reports.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-gray-500">
          No reports on file.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">Donor</th>
                  <th className="px-4 py-3">Receiver</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-4 font-medium">
                      {row.donor_profile?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      {row.receiver_profile?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {formatDate(row.completed_at)}
                    </td>
                    <td className="max-w-xs px-4 py-4 text-gray-600">
                      {row.feedback_message || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                        {formatReportStatus(row.report_status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <AdminReportActions
                        donationId={row.id}
                        reportStatus={row.report_status}
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
