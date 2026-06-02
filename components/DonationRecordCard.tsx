import { formatDate } from "@/lib/format";
import { POINTS_PER_DONATION } from "@/lib/constants";
import type { DonationWithProfiles } from "@/lib/types/database";

type DonationRecordCardProps = {
  donation: DonationWithProfiles;
  view: "donor" | "reports";
  currentUserId: string;
};

export function DonationRecordCard({
  donation,
  view,
  currentUserId,
}: DonationRecordCardProps) {
  const isDonor = donation.donor_id === currentUserId;
  const other =
    view === "donor"
      ? donation.receiver_profile
      : isDonor
        ? donation.receiver_profile
        : donation.donor_profile;

  const otherLabel = isDonor ? "Requester" : "Donor";

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {view === "donor"
              ? `Donation to ${other?.full_name ?? "requester"}`
              : donation.feedback_status === "reported"
                ? isDonor
                  ? "Report filed against you"
                  : `Report regarding ${other?.full_name ?? "donor"}`
                : `Donation with ${other?.full_name ?? otherLabel.toLowerCase()}`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(donation.completed_at)}
          </p>
        </div>
        {view === "donor" && donation.feedback_status === "fine" && (
          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
            +{POINTS_PER_DONATION} points
          </span>
        )}
        {donation.feedback_status === "reported" && (
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
            Reported
          </span>
        )}
      </div>

      {other && (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">{otherLabel}</dt>
            <dd className="font-medium">{other.full_name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Blood group</dt>
            <dd className="font-medium">{other.blood_group}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-500">Location</dt>
            <dd className="font-medium">
              {other.upazila}, {other.district}
            </dd>
          </div>
        </dl>
      )}

      {donation.feedback_message && (
        <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <span className="font-medium text-gray-900">Feedback: </span>
          {donation.feedback_message}
        </p>
      )}
    </article>
  );
}
