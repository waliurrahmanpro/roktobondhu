"use client";

import { useActionState, useState } from "react";
import { completeDonation } from "@/app/actions/donations";
import type { ActionResult } from "@/app/actions/donor-requests";
import {
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/lib/constants";

type DonationCompletionFormProps = {
  requestId: string;
  donorName: string;
};

export function DonationCompletionForm({
  requestId,
  donorName,
}: DonationCompletionFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    completeDonation,
    null
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border-2 border-red-600 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        Donation Received
      </button>
    );
  }

  return (
    <div className="mt-5 w-full rounded-xl border border-red-100 bg-red-50/50 p-4">
      <h4 className="text-sm font-semibold text-gray-900">
        Confirm donation from {donorName}
      </h4>
      <p className="mt-1 text-sm text-gray-600">
        Did the donor demand money or anything inappropriate?
      </p>

      {state?.error && (
        <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="mt-3 rounded-lg bg-green-100 px-3 py-2 text-sm text-green-800">
          {state.success}
        </p>
      )}

      {!state?.success && (
        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="request_id" value={requestId} />

          <fieldset className="space-y-2">
            <legend className="sr-only">Donation feedback</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 has-[:checked]:border-green-500 has-[:checked]:ring-1 has-[:checked]:ring-green-200">
              <input
                type="radio"
                name="feedback_status"
                value="fine"
                required
                className="mt-1"
              />
              <span className="text-sm text-gray-800">
                No, everything was fine
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 has-[:checked]:border-red-500 has-[:checked]:ring-1 has-[:checked]:ring-red-200">
              <input
                type="radio"
                name="feedback_status"
                value="reported"
                required
                className="mt-1"
              />
              <span className="text-sm text-gray-800">
                Yes, donor demanded money
              </span>
            </label>
          </fieldset>

          <div>
            <label htmlFor={`feedback-${requestId}`} className={labelClassName}>
              Additional feedback (optional)
            </label>
            <textarea
              id={`feedback-${requestId}`}
              name="feedback_message"
              rows={3}
              className={inputClassName}
              placeholder="Share any details that may help review this case…"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              className={`${buttonPrimaryClassName} w-auto px-6`}
            >
              {pending ? "Submitting…" : "Submit confirmation"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
