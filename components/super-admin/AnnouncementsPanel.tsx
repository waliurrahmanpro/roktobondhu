"use client";

import { useActionState } from "react";
import {
  broadcastNotificationAction,
  createAnnouncementAction,
  toggleAnnouncementFormAction,
} from "@/app/actions/super-admin";
import type { ActionResult } from "@/app/actions/donor-requests";
import { formatDateTime } from "@/lib/format";
import type { Announcement } from "@/lib/types/database";
import {
  buttonPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/lib/constants";

type AnnouncementsPanelProps = {
  announcements: Announcement[];
};

export function AnnouncementsPanel({ announcements }: AnnouncementsPanelProps) {
  const [createState, createAction, createPending] = useActionState<
    ActionResult,
    FormData
  >(createAnnouncementAction, null);
  const [broadcastState, broadcastAction, broadcastPending] = useActionState<
    ActionResult,
    FormData
  >(broadcastNotificationAction, null);
  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Create announcement</h3>
        <p className="mt-1 text-sm text-gray-600">
          Shown on homepage, dashboard, and notifications list.
        </p>

        {createState?.error && (
          <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
            {createState.error}
          </p>
        )}
        {createState?.success && (
          <p className="mt-3 rounded-lg bg-green-100 px-3 py-2 text-sm text-green-800">
            {createState.success}
          </p>
        )}

        <form action={createAction} className="mt-4 space-y-4">
          <div>
            <label className={labelClassName} htmlFor="ann-title">
              Title
            </label>
            <input id="ann-title" name="title" required className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName} htmlFor="ann-body">
              Body
            </label>
            <textarea
              id="ann-body"
              name="body"
              required
              rows={4}
              className={inputClassName}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="notify_all" className="h-4 w-4" />
            Also send as notification to all users
          </label>
          <button
            type="submit"
            disabled={createPending}
            className={`${buttonPrimaryClassName} w-auto bg-purple-900 hover:bg-purple-950`}
          >
            {createPending ? "Publishing…" : "Publish announcement"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-900">Emergency broadcast</h3>
        <p className="mt-1 text-sm text-red-800">
          Sends a notification to every non-banned user immediately.
        </p>

        {broadcastState?.error && (
          <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
            {broadcastState.error}
          </p>
        )}
        {broadcastState?.success && (
          <p className="mt-3 rounded-lg bg-green-100 px-3 py-2 text-sm text-green-800">
            {broadcastState.success}
          </p>
        )}

        <form action={broadcastAction} className="mt-4 space-y-4">
          <div>
            <label className={labelClassName} htmlFor="bc-title">
              Title
            </label>
            <input
              id="bc-title"
              name="title"
              required
              className={inputClassName}
              placeholder="Urgent O+ blood needed in Dhaka"
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="bc-message">
              Message
            </label>
            <textarea
              id="bc-message"
              name="message"
              required
              rows={3}
              className={inputClassName}
            />
          </div>
          <button
            type="submit"
            disabled={broadcastPending}
            className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {broadcastPending ? "Sending…" : "Send broadcast"}
          </button>
        </form>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900">All announcements</h3>
        {announcements.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No announcements yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {announcements.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
              >
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{item.body}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {formatDateTime(item.created_at)} ·{" "}
                    {item.is_active ? "Active" : "Hidden"}
                  </p>
                </div>
                <form action={toggleAnnouncementFormAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={String(item.is_active)}
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
                  >
                    {item.is_active ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
