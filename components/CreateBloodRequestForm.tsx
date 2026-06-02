"use client";

import { useActionState } from "react";
import { createBloodRequest } from "@/app/actions/blood-requests";
import { LocationCascadingSelect } from "@/components/LocationCascadingSelect";
import {
  BLOOD_GROUPS,
  URGENCY_LEVELS,
  inputClassName,
  labelClassName,
  buttonPrimaryClassName,
} from "@/lib/constants";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function CreateBloodRequestForm() {
  const [state, formAction, pending] = useActionState(createBloodRequest, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="patient_name" className={labelClassName}>
          Patient name
        </label>
        <input
          id="patient_name"
          name="patient_name"
          type="text"
          required
          placeholder="Full name"
          className={inputClassName}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="blood_group" className={labelClassName}>
            Blood group
          </label>
          <select
            id="blood_group"
            name="blood_group"
            required
            defaultValue=""
            className={inputClassName}
          >
            <option value="" disabled>
              Select group
            </option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="urgency_level" className={labelClassName}>
            Urgency level
          </label>
          <select
            id="urgency_level"
            name="urgency_level"
            required
            defaultValue=""
            className={inputClassName}
          >
            <option value="" disabled>
              Select urgency
            </option>
            {URGENCY_LEVELS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="hospital_name" className={labelClassName}>
          Hospital name
        </label>
        <input
          id="hospital_name"
          name="hospital_name"
          type="text"
          required
          placeholder="Hospital name"
          className={inputClassName}
        />
      </div>

      <div>
        <p className={labelClassName}>Location</p>
        <div className="mt-2">
          <LocationCascadingSelect idPrefix="br" />
        </div>
      </div>

      <div>
        <label htmlFor="contact_number" className={labelClassName}>
          Contact number
        </label>
        <input
          id="contact_number"
          name="contact_number"
          type="tel"
          required
          placeholder="01XXXXXXXXX"
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="request_date" className={labelClassName}>
          Request date
        </label>
        <input
          id="request_date"
          name="request_date"
          type="date"
          required
          defaultValue={todayISO()}
          className={inputClassName}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className={buttonPrimaryClassName}
      >
        {pending ? "Posting…" : "Create blood request"}
      </button>
    </form>
  );
}
