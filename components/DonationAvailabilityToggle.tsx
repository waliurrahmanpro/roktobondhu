"use client";

import { useState } from "react";

type DonationAvailabilityToggleProps = {
  defaultOn?: boolean;
};

export function DonationAvailabilityToggle({
  defaultOn = true,
}: DonationAvailabilityToggleProps) {
  const [on, setOn] = useState(defaultOn);

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-gray-700">
        Donation availability
      </span>
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5">
        <span className="text-sm text-gray-600">
          {on ? "ON — Available to donate" : "OFF — Not available"}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => setOn((v) => !v)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            on ? "bg-red-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              on ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        {on && (
          <input type="hidden" name="donation_availability" value="on" />
        )}
      </div>
    </div>
  );
}
