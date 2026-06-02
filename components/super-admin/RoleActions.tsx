"use client";

import { useTransition } from "react";
import { setUserRoleAction } from "@/app/actions/super-admin";
import type { UserRole } from "@/lib/types/database";

type RoleActionsProps = {
  userId: string;
  currentRole: UserRole;
  currentUserId: string;
};

export function RoleActions({
  userId,
  currentRole,
  currentUserId,
}: RoleActionsProps) {
  const [pending, startTransition] = useTransition();
  const isSelf = userId === currentUserId;

  function setRole(role: UserRole) {
    const fd = new FormData();
    fd.set("user_id", userId);
    fd.set("role", role);
    startTransition(() => {
      void setUserRoleAction(null, fd);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentRole === "user" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setRole("admin")}
          className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Promote to Admin
        </button>
      )}
      {currentRole === "admin" && (
        <>
          <button
            type="button"
            disabled={pending || isSelf}
            onClick={() => setRole("super_admin")}
            className="rounded-lg bg-purple-700 px-2 py-1 text-xs font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
          >
            Promote to Super Admin
          </button>
          <button
            type="button"
            disabled={pending || isSelf}
            onClick={() => setRole("user")}
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Remove Admin
          </button>
        </>
      )}
      {currentRole === "super_admin" && !isSelf && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setRole("admin")}
          className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Demote to Admin
        </button>
      )}
      {currentRole === "super_admin" && isSelf && (
        <span className="text-xs text-gray-500">You</span>
      )}
    </div>
  );
}
