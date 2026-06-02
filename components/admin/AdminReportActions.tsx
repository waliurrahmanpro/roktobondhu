"use client";

import { useTransition } from "react";
import {
  dismissReportAction,
  resolveReportAction,
} from "@/app/actions/admin";
import type { DonationReportStatus } from "@/lib/types/database";

type AdminReportActionsProps = {
  donationId: string;
  reportStatus: DonationReportStatus | null;
};

export function AdminReportActions({
  donationId,
  reportStatus,
}: AdminReportActionsProps) {
  const [pending, startTransition] = useTransition();
  const closed =
    reportStatus === "resolved" || reportStatus === "dismissed";

  function run(action: (fd: FormData) => Promise<unknown>) {
    const fd = new FormData();
    fd.set("donation_id", donationId);
    startTransition(() => {
      void action(fd);
    });
  }

  if (closed) {
    return (
      <span className="text-xs text-gray-500">
        {reportStatus === "resolved" ? "Resolved" : "Dismissed"}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(resolveReportAction)}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        Mark Resolved
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(dismissReportAction)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Dismiss Report
      </button>
    </div>
  );
}
