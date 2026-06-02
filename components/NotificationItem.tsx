import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { notificationLink } from "@/lib/notifications";
import { markNotificationReadAction } from "@/app/actions/notifications";
import type { Notification } from "@/lib/types/database";

type NotificationItemProps = {
  notification: Notification;
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const isUnread = !notification.read_at;
  const linkHref = notificationLink(notification);

  return (
    <article
      className={`rounded-2xl border p-5 ${
        isUnread
          ? "border-red-200 bg-red-50/50"
          : "border-gray-100 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
          <p className="mt-2 text-xs text-gray-400">
            {formatDateTime(notification.created_at)}
          </p>
        </div>
        {isUnread && (
          <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
            New
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={linkHref}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          View related requests →
        </Link>
        {isUnread && (
          <form action={markNotificationReadAction}>
            <input
              type="hidden"
              name="notification_id"
              value={notification.id}
            />
            <button
              type="submit"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Mark as read
            </button>
          </form>
        )}
      </div>
    </article>
  );
}
