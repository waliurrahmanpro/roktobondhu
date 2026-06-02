"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/actions/password";
import { inputClassName, labelClassName, buttonPrimaryClassName } from "@/lib/constants";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPassword, null);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100 sm:p-10">
        <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your new password below.
        </p>

        {state?.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className={labelClassName}>
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="confirm_password" className={labelClassName}>
              Confirm password
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClassName}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className={buttonPrimaryClassName}
          >
            {pending ? "Saving…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
