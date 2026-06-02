"use client";

import { useActionState } from "react";
import { updateSiteSettingsAction } from "@/app/actions/super-admin";
import type { ActionResult } from "@/app/actions/donor-requests";
import type { SiteSettings } from "@/lib/types/database";

type SiteSettingsFormProps = {
  settings: SiteSettings;
};

export function SiteSettingsForm({ settings }: SiteSettingsFormProps) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    updateSiteSettingsAction,
    null
  );

  return (
    <form action={formAction} className="max-w-lg space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {state?.error && (
        <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-800">
          {state.success}
        </p>
      )}

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="registration_enabled"
          defaultChecked={settings.registration_enabled}
          className="h-5 w-5 rounded border-gray-300 text-purple-700"
        />
        <span className="text-sm font-medium text-gray-900">Registration ON</span>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="blood_request_enabled"
          defaultChecked={settings.blood_request_enabled}
          className="h-5 w-5 rounded border-gray-300 text-purple-700"
        />
        <span className="text-sm font-medium text-gray-900">Blood request ON</span>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="maintenance_mode"
          defaultChecked={settings.maintenance_mode}
          className="h-5 w-5 rounded border-gray-300 text-purple-700"
        />
        <span className="text-sm font-medium text-gray-900">Maintenance mode ON</span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-purple-900 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-950 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
