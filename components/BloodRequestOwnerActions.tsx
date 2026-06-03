"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  completeBloodRequestOwnerAction,
  deleteBloodRequestAction,
  reopenBloodRequestAction,
} from "@/app/actions/blood-requests";
import type { BloodRequest, BloodRequestStatus } from "@/lib/types/database";

type BloodRequestOwnerActionsProps = {
  request: BloodRequest;
};

function statusLabel(status: BloodRequestStatus): string {
  if (status === "completed") return "Completed";
  if (status === "removed") return "Removed";
  return "Active";
}

export function BloodRequestOwnerActions({
  request,
}: BloodRequestOwnerActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isActive = request.status === "active";
  const isCompleted = request.status === "completed";
  const isRemoved = request.status === "removed";

  function runAction(
    action: (fd: FormData) => Promise<{ error?: string; success?: string } | null>
  ) {
    setFeedback(null);
    const fd = new FormData();
    fd.set("request_id", request.id);
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

  function confirmDelete() {
    setFeedback(null);
    const fd = new FormData();
    fd.set("request_id", request.id);
    startTransition(async () => {
      await deleteBloodRequestAction(fd);
    });
  }

  if (isRemoved) {
    return (
      <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
        This request has been deleted.
      </p>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Manage request</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
            isActive
              ? "bg-green-100 text-green-800"
              : isCompleted
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          {statusLabel(request.status)}
        </span>
      </div>

      {feedback && (
        <p
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {isActive && (
          <>
            <Link
              href={`/requests/${request.id}/edit`}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Edit Request
            </Link>
            <button
              type="button"
              disabled={pending}
              onClick={() => runAction(completeBloodRequestOwnerAction)}
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-60"
            >
              Mark Completed
            </button>
          </>
        )}

        {isCompleted && (
          <button
            type="button"
            disabled={pending}
            onClick={() => runAction(reopenBloodRequestAction)}
            className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100 disabled:opacity-60"
          >
            Reopen Request
          </button>
        )}

        {(isActive || isCompleted) && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
          >
            Delete Request
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-request-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3
              id="delete-request-title"
              className="text-lg font-bold text-gray-900"
            >
              Delete blood request?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete this blood request?
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {pending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
