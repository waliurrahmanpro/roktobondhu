"use client";

import { useActionState } from "react";
import { submitNidVerification } from "@/app/actions/verification";
import { buttonPrimaryClassName, inputClassName, labelClassName } from "@/lib/constants";
import type { Profile, VerificationStatus } from "@/lib/types/database";
import { VerifiedDonorBadge } from "@/components/VerifiedDonorBadge";

type NidVerificationSectionProps = {
  profile: Profile;
};

function statusLabel(status: VerificationStatus): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "pending":
      return "Pending review";
    case "rejected":
      return "Rejected — please re-upload";
    default:
      return "Not submitted";
  }
}

export function NidVerificationSection({ profile }: NidVerificationSectionProps) {
  const [state, formAction, pending] = useActionState(submitNidVerification, null);
  const canSubmit =
    profile.verification_status === "not_submitted" ||
    profile.verification_status === "rejected";

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900">NID verification</h2>
        <VerifiedDonorBadge verificationStatus={profile.verification_status} />
      </div>
      <p className="mt-1 text-sm text-gray-600">
        Upload your National ID to become a verified donor and appear in search.
      </p>
      <p className="mt-2 text-sm font-medium text-gray-800">
        Status: {statusLabel(profile.verification_status)}
      </p>

      {state?.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {state.success}
        </p>
      )}

      {profile.verification_status === "approved" ? (
        <p className="mt-4 text-sm text-green-700">
          Your identity is verified. You can enable donation availability when ready.
        </p>
      ) : profile.verification_status === "pending" ? (
        <p className="mt-4 text-sm text-gray-600">
          Your documents are being reviewed. You will receive a notification when
          complete.
        </p>
      ) : canSubmit ? (
        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="nid_front" className={labelClassName}>
              NID front
            </label>
            <input
              id="nid_front"
              name="nid_front"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="nid_back" className={labelClassName}>
              NID back
            </label>
            <input
              id="nid_back"
              name="nid_back"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className={inputClassName}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className={buttonPrimaryClassName}
          >
            {pending ? "Uploading…" : "Submit for verification"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
