"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import { ProfileFields } from "@/components/ProfileFields";
import { buttonPrimaryClassName } from "@/lib/constants";
import type { Profile } from "@/lib/types/database";

type DashboardFormProps = {
  profile: Profile;
};

export function DashboardForm({ profile }: DashboardFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfile, null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state?.success, router]);

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {state.success}
        </p>
      )}

      <ProfileFields profile={profile} showProfilePicture />

      <button
        type="submit"
        disabled={pending}
        className={buttonPrimaryClassName}
      >
        {pending ? "Saving…" : "Save Profile"}
      </button>
    </form>
  );
}
