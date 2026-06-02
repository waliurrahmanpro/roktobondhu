import { AdminNav } from "@/components/admin/AdminNav";
import { AdminRequestActions } from "@/components/admin/AdminRequestActions";
import { formatDate } from "@/lib/format";
import {
  fetchAdminBloodRequests,
  formatBloodRequestStatus,
} from "@/lib/data/admin";

export default async function AdminBloodRequestsPage() {
  const requests = await fetchAdminBloodRequests();

  return (
    <>
      <AdminNav currentPath="/admin/requests" />

      <h2 className="text-xl font-bold text-gray-900">Blood requests</h2>
      <p className="mt-1 text-sm text-gray-600">
        Moderate public blood need posts. Removed requests no longer appear on the
        homepage.
      </p>

      {requests.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-gray-500">
          No blood requests found.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Blood</th>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Urgency</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-4 py-4 font-medium">{req.patient_name}</td>
                    <td className="px-4 py-4">{req.blood_group}</td>
                    <td className="px-4 py-4">{req.district}</td>
                    <td className="px-4 py-4 capitalize">{req.urgency_level}</td>
                    <td className="px-4 py-4 text-gray-600">
                      {formatDate(req.request_date)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                        {formatBloodRequestStatus(req.status ?? "active")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <AdminRequestActions
                        requestId={req.id}
                        status={req.status ?? "active"}
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
