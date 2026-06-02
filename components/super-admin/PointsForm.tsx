"use client";

import { useActionState } from "react";
import { adjustPointsAction } from "@/app/actions/super-admin";
import type { ActionResult } from "@/app/actions/donor-requests";
import {
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/lib/constants";

export function PointsForm() {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    adjustPointsAction,
    null
  );

  return (
    <form
      action={formAction}
      className="max-w-lg space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-gray-900">Adjust points</h3>

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

      <div>
        <label className={labelClassName} htmlFor="user_id">
          User ID (UUID)
        </label>
        <input
          id="user_id"
          name="user_id"
          required
          className={inputClassName}
          placeholder="From admin users table"
        />
      </div>
      <div>
        <label className={labelClassName} htmlFor="delta">
          Points change
        </label>
        <input
          id="delta"
          name="delta"
          type="number"
          required
          className={inputClassName}
          placeholder="10 or -10"
        />
        <p className="mt-1 text-xs text-gray-500">
          Positive to add, negative to remove.
        </p>
      </div>
      <div>
        <label className={labelClassName} htmlFor="reason">
          Reason
        </label>
        <input id="reason" name="reason" required className={inputClassName} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimaryClassName} w-auto bg-purple-900 hover:bg-purple-950`}
      >
        {pending ? "Saving…" : "Apply adjustment"}
      </button>
    </form>
  );
}
