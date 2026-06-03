import {
  acceptDonorRequestAction,
  rejectDonorRequestAction,
} from "@/app/actions/donor-requests";
import { formatDate } from "@/lib/format";
import { statusLabel, statusStyles } from "@/lib/donor-requests";
import { formatPhoneDisplay, telLink, whatsAppLink } from "@/lib/phone";
import type { DonorRequestWithProfiles } from "@/lib/types/database";

type IncomingDonorRequestCardProps = {
  request: DonorRequestWithProfiles;
};

export function IncomingDonorRequestCard({
  request,
}: IncomingDonorRequestCardProps) {
  const receiver = request.receiver_profile;
  const isPending = request.status === "pending";

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {receiver?.full_name ?? "Unknown requester"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Requested on {formatDate(request.created_at)}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles(request.status)}`}
        >
          {statusLabel(request.status)}
        </span>
      </div>

      {receiver && (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Blood group needed</dt>
            <dd className="font-medium">{receiver.blood_group}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Location</dt>
            <dd className="font-medium">
              {receiver.upazila}, {receiver.district}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Phone</dt>
            <dd className="font-medium">{formatPhoneDisplay(receiver.phone)}</dd>
          </div>
        </dl>
      )}

      {isPending ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <form action={acceptDonorRequestAction}>
            <input type="hidden" name="request_id" value={request.id} />
            <button
              type="submit"
              className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              Accept
            </button>
          </form>
          <form action={rejectDonorRequestAction}>
            <input type="hidden" name="request_id" value={request.id} />
            <button
              type="submit"
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reject
            </button>
          </form>
        </div>
      ) : (
        request.status === "accepted" &&
        receiver && (
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={whatsAppLink(
                receiver.phone,
                `Hello ${receiver.full_name}, regarding your blood request on Blood Bridge BD.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
            >
              WhatsApp requester
            </a>
            <a
              href={telLink(receiver.phone)}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Call requester
            </a>
          </div>
        )
      )}
    </article>
  );
}
