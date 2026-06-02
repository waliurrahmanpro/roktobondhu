"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/app/actions/auth";
import { ProfileFields } from "@/components/ProfileFields";
import { AuthPageShell, AuthFooterLink } from "@/components/AuthForm";
import {
  inputClassName,
  labelClassName,
  buttonPrimaryClassName,
} from "@/lib/constants";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, null);

  return (
    <AuthPageShell>
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100 sm:p-10">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Register as a donor and help save lives across Bangladesh.
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
            <ProfileFields />

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

            <div>
              <label htmlFor="password" className={labelClassName}>
                Password
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
              <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={pending}
              className={buttonPrimaryClassName}
            >
              {pending ? "Creating account…" : "Register"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <AuthFooterLink
              text="Already have an account?"
              href="/login"
              linkText="Log in"
            />
          </div>
        </div>

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-red-600">
            ← Back to home
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
