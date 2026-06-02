"use client";

import { useTransition } from "react";
import {
  completeBloodRequestAction,
  removeBloodRequestAction,
} from "@/app/actions/admin";
import type { BloodRequestStatus } from "@/lib/types/database";

type AdminRequestActionsProps = {
  requestId: string;
  status: BloodRequestStatus;
};

export function AdminRequestActions({
  requestId,
  status,
}: AdminRequestActionsProps) {
  const [pending, startTransition] = useTransition();

  function run(action: (fd: FormData) => Promise<unknown>) {
    const fd = new FormData();
    fd.set("request_id", requestId);
    startTransition(() => {
      void action(fd);
    });
  }

  if (status === "removed") {
    return <span className="text-xs text-gray-500">Removed</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "completed" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(completeBloodRequestAction)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Mark completed
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => run(removeBloodRequestAction)}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        Delete fake request
      </button>
    </div>
  );
}
