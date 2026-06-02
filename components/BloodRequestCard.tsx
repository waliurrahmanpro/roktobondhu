import Link from "next/link";
import { formatDate } from "@/lib/format";
import { formatLocationLine } from "@/lib/bangladesh-locations";
import { urgencyLabel, urgencyStyles } from "@/lib/blood-requests";
import type { BloodRequest } from "@/lib/types/database";

type BloodRequestCardProps = {
  request: BloodRequest;
  showContact?: boolean;
  linkable?: boolean;
};

export function BloodRequestCard({
  request,
  showContact = true,
  linkable = true,
}: BloodRequestCardProps) {
  const styles = urgencyStyles(request.urgency_level);

  const card = (
    <article
      className={`rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${styles.border}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-lg font-bold text-red-600">
            {request.blood_group}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">{request.patient_name}</h3>
            <p className="text-sm text-gray-500">{request.hospital_name}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${styles.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full bg-white/90`} />
          {urgencyLabel(request.urgency_level)}
        </span>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-500">Location</dt>
          <dd className="font-medium text-gray-900">
            {formatLocationLine({
              upazila: request.upazila ?? undefined,
              district: request.district,
            })}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Request date</dt>
          <dd className="font-medium text-gray-900">
            {formatDate(request.request_date)}
          </dd>
        </div>
        {showContact && (
          <div className="sm:col-span-2">
            <dt className="text-gray-500">Contact</dt>
            <dd>
              <a
                href={`tel:${request.contact_number}`}
                className="font-semibold text-red-600 hover:underline"
              >
                {request.contact_number}
              </a>
            </dd>
          </div>
        )}
      </dl>
    </article>
  );

  if (!linkable) {
    return card;
  }

  return (
    <Link href={`/requests/${request.id}`} className="block">
      {card}
    </Link>
  );
}
