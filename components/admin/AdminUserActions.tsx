"use client";

import { useTransition } from "react";
import { banUserAction, unbanUserAction } from "@/app/actions/admin";

type AdminUserActionsProps = {
  userId: string;
  isBanned: boolean;
};

export function AdminUserActions({ userId, isBanned }: AdminUserActionsProps) {
  const [pending, startTransition] = useTransition();

  function run(action: (fd: FormData) => Promise<unknown>) {
    const fd = new FormData();
    fd.set("user_id", userId);
    startTransition(() => {
      void action(fd);
    });
  }

  if (isBanned) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => run(unbanUserAction)}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        Unban User
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => run(banUserAction)}
      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
    >
      Ban User
    </button>
  );
}
