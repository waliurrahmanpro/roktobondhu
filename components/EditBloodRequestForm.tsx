"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateBloodRequest } from "@/app/actions/blood-requests";
import { LocationCascadingSelect } from "@/components/LocationCascadingSelect";
import {
  BLOOD_GROUPS,
  URGENCY_LEVELS,
  inputClassName,
  labelClassName,
  buttonPrimaryClassName,
} from "@/lib/constants";
import type { BloodRequest } from "@/lib/types/database";

type EditBloodRequestFormProps = {
  request: BloodRequest;
};

export function EditBloodRequestForm({ request }: EditBloodRequestFormProps) {
  const [state, formAction, pending] = useActionState(updateBloodRequest, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="request_id" value={request.id} />

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
          defaultValue={request.patient_name}
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
            defaultValue={request.blood_group}
            className={inputClassName}
          >
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
            defaultValue={request.urgency_level}
            className={inputClassName}
          >
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
          defaultValue={request.hospital_name}
          className={inputClassName}
        />
      </div>

      <div>
        <p className={labelClassName}>Location</p>
        <div className="mt-2">
          <LocationCascadingSelect
            idPrefix="edit-br"
            defaultDivision={request.division ?? ""}
            defaultDistrict={request.district}
            defaultUpazila={request.upazila ?? ""}
          />
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
          defaultValue={request.contact_number}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className={buttonPrimaryClassName}
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <Link
          href={`/requests/${request.id}`}
          className="inline-flex items-center rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
