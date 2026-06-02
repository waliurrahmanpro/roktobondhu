"use client";

import { useActionState } from "react";
import { forgotPassword } from "@/app/actions/password";
import { inputClassName, labelClassName, buttonPrimaryClassName } from "@/lib/constants";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPassword, null);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100 sm:p-10">
        <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email and we will send you a link to choose a new password.
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

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className={labelClassName}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClassName}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className={buttonPrimaryClassName}
          >
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
