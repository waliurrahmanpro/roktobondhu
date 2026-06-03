"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateSuperAdminUserProfileAction } from "@/app/actions/super-admin-profile-editor";
import { LocationCascadingSelect } from "@/components/LocationCascadingSelect";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { BLOOD_GROUPS, buttonPrimaryClassName, inputClassName, labelClassName } from "@/lib/constants";
import type { Profile, VerificationStatus } from "@/lib/types/database";

const VERIFICATION_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: "not_submitted", label: "Not submitted" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

type SuperAdminUserEditorFormProps = {
  profile: Profile;
  currentUserId: string;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function SuperAdminUserEditorForm({
  profile,
  currentUserId,
}: SuperAdminUserEditorFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const isSelf = profile.user_id === currentUserId;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateSuperAdminUserProfileAction(formData);
      if (!result) return;
      if (result.error) {
        setMessage({ type: "err", text: result.error });
        return;
      }
      setMessage({
        type: "ok",
        text: result.success ?? "Profile updated.",
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="user_id" value={profile.user_id} />

      <Section title="Personal information">
        <div>
          <label htmlFor="sa_full_name" className={labelClassName}>
            Full name
          </label>
          <input
            id="sa_full_name"
            name="full_name"
            required
            defaultValue={profile.full_name}
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="sa_phone" className={labelClassName}>
            Phone number
          </label>
          <input
            id="sa_phone"
            name="phone"
            type="tel"
            required
            defaultValue={profile.phone}
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="sa_blood_group" className={labelClassName}>
            Blood group
          </label>
          <select
            id="sa_blood_group"
            name="blood_group"
            required
            defaultValue={profile.blood_group}
            className={inputClassName}
          >
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sa_dob" className={labelClassName}>
            Date of birth
          </label>
          <input
            id="sa_dob"
            name="date_of_birth"
            type="date"
            required
            defaultValue={profile.date_of_birth ?? ""}
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="sa_profile_picture_url" className={labelClassName}>
            Profile picture URL
          </label>
          <input
            id="sa_profile_picture_url"
            name="profile_picture_url"
            type="url"
            placeholder="https://..."
            defaultValue={
              profile.profile_picture_url?.startsWith("http")
                ? profile.profile_picture_url
                : ""
            }
            className={inputClassName}
          />
        </div>
        <ProfilePictureUpload currentUrl={profile.profile_picture_url} />
      </Section>

      <Section title="Location">
        <LocationCascadingSelect
          idPrefix="sa"
          defaultDivision={profile.division}
          defaultDistrict={profile.district}
          defaultUpazila={profile.upazila ?? ""}
        />
        <div>
          <label htmlFor="sa_full_address" className={labelClassName}>
            Full address
          </label>
          <textarea
            id="sa_full_address"
            name="full_address"
            rows={3}
            defaultValue={profile.full_address ?? ""}
            className={inputClassName}
            placeholder="House, road, area..."
          />
        </div>
      </Section>

      <Section title="Verification">
        <div>
          <label htmlFor="sa_verification_status" className={labelClassName}>
            Verification status
          </label>
          <select
            id="sa_verification_status"
            name="verification_status"
            required
            defaultValue={profile.verification_status}
            disabled={isSelf}
            className={`${inputClassName} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {VERIFICATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {isSelf && (
            <p className="mt-1 text-xs text-amber-700">
              You cannot change your own verification status here.
            </p>
          )}
        </div>
      </Section>

      <Section title="Donation settings">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="donation_availability"
            defaultChecked={profile.donation_availability}
            className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-sm font-medium text-gray-800">
            Donation availability (visible to matching)
          </span>
        </label>
        <div>
          <label htmlFor="sa_next_eligible" className={labelClassName}>
            Next eligible date
          </label>
          <input
            id="sa_next_eligible"
            name="next_eligible_date"
            type="date"
            defaultValue={profile.next_eligible_date ?? ""}
            className={inputClassName}
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave empty to clear cooldown. Future dates disable availability via
            eligibility rules.
          </p>
        </div>
      </Section>

      <Section title="Statistics">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sa_total_points" className={labelClassName}>
              Total points
            </label>
            <input
              id="sa_total_points"
              name="total_points"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={profile.total_points ?? 0}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="sa_total_donations" className={labelClassName}>
              Total donations
            </label>
            <input
              id="sa_total_donations"
              name="total_donations"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={profile.total_donations ?? 0}
              className={inputClassName}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Reported donations ({profile.reported_donations ?? 0}) are read-only and
          updated by the reporting system.
        </p>
      </Section>

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        <span className="font-medium text-gray-900">Role:</span>{" "}
        {profile.role}
        <span className="mx-2 text-gray-300">·</span>
        Role cannot be edited from this form.
      </div>

      {message && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === "ok"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
          role="alert"
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={buttonPrimaryClassName}
      >
        {pending ? "Saving…" : "Save profile changes"}
      </button>
    </form>
  );
}
