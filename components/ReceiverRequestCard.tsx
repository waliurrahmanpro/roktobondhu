import { DonationCompletionForm } from "@/components/DonationCompletionForm";
import { formatDate } from "@/lib/format";
import { statusLabel, statusStyles } from "@/lib/donor-requests";
import { formatPhoneDisplay, telLink, whatsAppLink } from "@/lib/phone";
import type { DonorRequestWithProfiles } from "@/lib/types/database";

type ReceiverRequestCardProps = {
  request: DonorRequestWithProfiles;
};

export function ReceiverRequestCard({ request }: ReceiverRequestCardProps) {
  const donor = request.donor_profile;

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            Request to {donor?.full_name ?? "donor"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Sent on {formatDate(request.created_at)}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles(request.status)}`}
        >
          {statusLabel(request.status)}
        </span>
      </div>

      {donor && (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Donor blood group</dt>
            <dd className="font-medium">{donor.blood_group}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Donor location</dt>
            <dd className="font-medium">
              {donor.upazila}, {donor.district}
            </dd>
          </div>
        </dl>
      )}

      {request.status === "accepted" && donor && (
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={whatsAppLink(
              donor.phone,
              `Hello ${donor.full_name}, thank you for accepting my blood request on Blood Bridge BD.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
          >
            WhatsApp donor
          </a>
          <a
            href={telLink(donor.phone)}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Call donor
          </a>
          <p className="w-full text-sm text-green-700">
            Accepted — you can contact {donor.full_name} at{" "}
            {formatPhoneDisplay(donor.phone)}.
          </p>
          <DonationCompletionForm
            requestId={request.id}
            donorName={donor.full_name}
          />
        </div>
      )}

      {request.status === "completed" && (
        <p className="mt-4 text-sm text-blue-700">
          Donation confirmed. Thank you for updating your request.
        </p>
      )}

      {request.status === "reported" && (
        <p className="mt-4 text-sm text-red-700">
          A report was submitted for this donation. No points were awarded to the
          donor.
        </p>
      )}

      {request.status === "rejected" && (
        <p className="mt-4 text-sm text-gray-600">
          This donor declined your request. You can search for another donor on
          the homepage.
        </p>
      )}

      {request.status === "pending" && (
        <p className="mt-4 text-sm text-amber-700">
          Waiting for the donor to accept or reject your request.
        </p>
      )}
    </article>
  );
}
