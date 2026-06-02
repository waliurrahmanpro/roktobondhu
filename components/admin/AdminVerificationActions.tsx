"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  approveVerificationAction,
  rejectVerificationAction,
} from "@/app/actions/admin";

type AdminVerificationActionsProps = {
  userId: string;
};

export function AdminVerificationActions({
  userId,
}: AdminVerificationActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const fd = new FormData();
            fd.set("user_id", userId);
            await approveVerificationAction(fd);
            router.refresh();
          })
        }
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const fd = new FormData();
            fd.set("user_id", userId);
            await rejectVerificationAction(fd);
            router.refresh();
          })
        }
        className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-900 disabled:opacity-60"
      >
        Reject
      </button>
    </div>
  );
}
