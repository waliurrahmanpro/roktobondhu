"use client";

import { useState } from "react";
import { DONATION_AGE_MESSAGE } from "@/lib/eligibility";

type DonationAvailabilityToggleProps = {
  defaultOn?: boolean;
  disabled?: boolean;
  disabledReason?: string;
};

export function DonationAvailabilityToggle({
  defaultOn = false,
  disabled = false,
  disabledReason,
}: DonationAvailabilityToggleProps) {
  const [on, setOn] = useState(defaultOn && !disabled);

  const hint =
    disabledReason ??
    (disabled ? DONATION_AGE_MESSAGE : null);

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-gray-700">
        Donation availability
      </span>
      <div
        className={`flex flex-col gap-2 rounded-xl border px-4 py-3.5 ${
          disabled
            ? "border-amber-200 bg-amber-50"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-600">
            {disabled
              ? "Unavailable"
              : on
                ? "ON — Available to donate"
                : "OFF — Not available"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            disabled={disabled}
            onClick={() => !disabled && setOn((v) => !v)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              on && !disabled ? "bg-red-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                on && !disabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          {on && !disabled && (
            <input type="hidden" name="donation_availability" value="on" />
          )}
        </div>
        {hint && (
          <p className="text-xs text-amber-900">{hint}</p>
        )}
      </div>
    </div>
  );
}
