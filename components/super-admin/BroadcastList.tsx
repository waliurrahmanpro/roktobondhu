"use client";

import { useFormState, useFormStatus } from "react-dom";
import { sendBroadcastAction, refreshBroadcastAnalyticsAction } from "@/app/actions/broadcasts";
import type { Broadcast } from "@/lib/types/database";
import { formatDateTime } from "@/lib/format";

type BroadcastListProps = {
  broadcasts: Broadcast[];
};

function SendButton({ broadcastId, sentAt }: { broadcastId: string; sentAt: string | null }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="broadcast_id"
      value={broadcastId}
      disabled={pending || sentAt !== null}
      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Sending..." : sentAt ? "Sent" : "Send"}
    </button>
  );
}

function RefreshButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Refreshing..." : "Refresh Analytics"}
    </button>
  );
}

export function BroadcastList({ broadcasts }: BroadcastListProps) {
  const [sendState, sendFormAction] = useFormState(sendBroadcastAction, null);
  const [refreshState, refreshFormAction] = useFormState(
    refreshBroadcastAnalyticsAction,
    null
  );

  if (broadcasts.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Broadcast History</h2>
        <p className="mt-4 text-sm text-gray-500">No broadcasts created yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Broadcast History</h2>
        <form action={refreshFormAction}>
          <RefreshButton />
        </form>
      </div>

      {refreshState?.error && (
        <p className="mt-2 text-sm text-red-600">{refreshState.error}</p>
      )}
      {refreshState?.success && (
        <p className="mt-2 text-sm text-green-600">{refreshState.success}</p>
      )}

      <div className="mt-6 space-y-4">
        {broadcasts.map((broadcast) => (
          <div
            key={broadcast.id}
            className="rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{broadcast.title}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      broadcast.priority === "urgent"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {broadcast.priority}
                  </span>
                  {broadcast.sent_at && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      Sent
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600">{broadcast.message}</p>

                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>Target: {broadcast.target_type.replace(/_/g, " ")}</span>
                  {broadcast.target_value && (
                    <span>Value: {broadcast.target_value}</span>
                  )}
                  <span>
                    Recipients: {broadcast.total_recipients}
                  </span>
                  {broadcast.sent_at && (
                    <>
                      <span>
                        Delivered: {broadcast.delivered_count}
                      </span>
                      <span>Read: {broadcast.read_count}</span>
                    </>
                  )}
                  <span>Created: {formatDateTime(broadcast.created_at)}</span>
                </div>
              </div>

              <form action={sendFormAction}>
                <SendButton
                  broadcastId={broadcast.id}
                  sentAt={broadcast.sent_at}
                />
              </form>
            </div>

            {sendState?.error && sendState?.error.includes(broadcast.id) && (
              <p className="mt-2 text-sm text-red-600">{sendState.error}</p>
            )}
            {sendState?.success && (
              <p className="mt-2 text-sm text-green-600">{sendState.success}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
