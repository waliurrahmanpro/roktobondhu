"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthActionState } from "@/app/actions/auth";
import { inputClassName, labelClassName, buttonPrimaryClassName } from "@/lib/constants";

type AuthFormProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  action: (
    prevState: AuthActionState,
    formData: FormData
  ) => Promise<AuthActionState>;
  children?: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthForm({
  title,
  subtitle,
  submitLabel,
  action,
  children,
  footer,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100 sm:p-10">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">{subtitle}</p>

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
          {children}

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
              autoComplete="current-password"
              className={inputClassName}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className={buttonPrimaryClassName}
          >
            {pending ? "Please wait…" : submitLabel}
          </button>
        </form>

        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}

export function AuthPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}

export function AuthFooterLink({
  text,
  href,
  linkText,
}: {
  text: string;
  href: string;
  linkText: string;
}) {
  return (
    <p className="text-gray-600">
      {text}{" "}
      <Link href={href} className="font-semibold text-red-600 hover:underline">
        {linkText}
      </Link>
    </p>
  );
}
