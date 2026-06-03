"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addCooldownAction,
  banUserSuperAdminAction,
  disableDonationsAction,
  enableDonationsAction,
  removeCooldownAction,
  setCooldownDateAction,
  unbanUserSuperAdminAction,
  unverifyUserAction,
  verifyUserAction,
} from "@/app/actions/super-admin-users";
import { inputClassName, labelClassName } from "@/lib/constants";
import type { Profile } from "@/lib/types/database";

type SuperAdminUserControlsProps = {
  profile: Profile;
  currentUserId: string;
};

function ActionButton({
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "success" | "purple";
}) {
  const styles = {
    default: "border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
    danger: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
    success: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
    purple: "border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${styles[variant]}`}
    >
      {label}
    </button>
  );
}

export function SuperAdminUserControls({
  profile,
  currentUserId,
}: SuperAdminUserControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [cooldownDate, setCooldownDate] = useState(
    profile.next_eligible_date ?? ""
  );

  const isSelf = profile.user_id === currentUserId;
  const isVerified = profile.verification_status === "approved";
  const isBanned = profile.is_banned;
  const donationsOn = profile.donation_availability;
  const inCooldown =
    profile.next_eligible_date &&
    profile.next_eligible_date > new Date().toISOString().split("T")[0];

  function run(
    action: (fd: FormData) => Promise<{ error?: string; success?: string } | null>,
    extra?: Record<string, string>
  ) {
    setFeedback(null);
    const fd = new FormData();
    fd.set("user_id", profile.user_id);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        fd.set(k, v);
      }
    }
    startTransition(async () => {
      const result = await action(fd);
      if (result?.error) {
        setFeedback({ type: "error", text: result.error });
        return;
      }
      if (result?.success) {
        setFeedback({ type: "success", text: result.success });
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Super admin controls</h2>
      <p className="mt-1 text-sm text-gray-600">
        All actions are recorded in audit logs.
      </p>

      {isSelf && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          You cannot ban or change verification on your own account.
        </p>
      )}

      {feedback && (
        <p
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </p>
      )}

      <div className="mt-6 space-y-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Verification
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {!isVerified && !isSelf && (
              <ActionButton
                label="Verify"
                variant="success"
                disabled={pending || isSelf}
                onClick={() => run(verifyUserAction)}
              />
            )}
            {isVerified && !isSelf && (
              <ActionButton
                label="Unverify"
                variant="default"
                disabled={pending || isSelf}
                onClick={() => run(unverifyUserAction)}
              />
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Account status
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {!isBanned && !isSelf && (
              <ActionButton
                label="Ban"
                variant="danger"
                disabled={pending || isSelf}
                onClick={() => run(banUserSuperAdminAction)}
              />
            )}
            {isBanned && (
              <ActionButton
                label="Unban"
                variant="success"
                disabled={pending}
                onClick={() => run(unbanUserSuperAdminAction)}
              />
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Donation availability
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {!donationsOn && (
              <ActionButton
                label="Enable Donations"
                variant="purple"
                disabled={pending}
                onClick={() => run(enableDonationsAction)}
              />
            )}
            {donationsOn && (
              <ActionButton
                label="Disable Donations"
                variant="default"
                disabled={pending}
                onClick={() => run(disableDonationsAction)}
              />
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Cooldown
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <ActionButton
              label="Add Cooldown"
              variant="default"
              disabled={pending}
              onClick={() => run(addCooldownAction, { cooldown_days: "90" })}
            />
            {inCooldown && (
              <ActionButton
                label="Remove Cooldown"
                variant="success"
                disabled={pending}
                onClick={() => run(removeCooldownAction)}
              />
            )}
          </div>
          <form
            className="mt-4 flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              run(setCooldownDateAction, { next_eligible_date: cooldownDate });
            }}
          >
            <div>
              <label htmlFor="next_eligible_date" className={labelClassName}>
                Set next eligible donation date
              </label>
              <input
                id="next_eligible_date"
                type="date"
                value={cooldownDate}
                onChange={(e) => setCooldownDate(e.target.value)}
                className={inputClassName}
              />
            </div>
            <button
              type="submit"
              disabled={pending || !cooldownDate}
              className="rounded-lg bg-purple-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
            >
              Set date
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
