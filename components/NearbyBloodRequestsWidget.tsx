import Link from "next/link";
import { fetchNearbyBloodRequestsForDonor } from "@/lib/data/matching";
import { formatLocationLine } from "@/lib/bangladesh-locations";
import { formatDate } from "@/lib/format";
import { urgencyLabel, urgencyStyles } from "@/lib/blood-requests";

type NearbyBloodRequestsWidgetProps = {
  donorUserId: string;
};

export async function NearbyBloodRequestsWidget({
  donorUserId,
}: NearbyBloodRequestsWidgetProps) {
  const requests = await fetchNearbyBloodRequestsForDonor(donorUserId, 8);

  if (requests.length === 0) {
    return (
      <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Nearby blood requests
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          No active requests match your blood group and area right now.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        Nearby blood requests
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Active needs matching your blood group and location.
      </p>
      <ul className="mt-4 space-y-3">
        {requests.map((request) => {
          const styles = urgencyStyles(request.urgency_level);
          return (
            <li key={request.id}>
              <Link
                href={`/requests/${request.id}`}
                className="block rounded-xl border border-gray-100 p-4 transition hover:border-green-200 hover:bg-green-50/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {request.blood_group} — {request.patient_name}
                    </p>
                    <p className="text-sm text-gray-600">{request.hospital_name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatLocationLine({
                        upazila: request.upazila ?? undefined,
                        district: request.district,
                      })}{" "}
                      · {formatDate(request.request_date)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${styles.badge}`}
                    >
                      {urgencyLabel(request.urgency_level)}
                    </span>
                    <span className="text-xs font-semibold text-green-700">
                      {request.match_percent}% match
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
