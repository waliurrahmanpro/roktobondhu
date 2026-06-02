import type { Notification } from "@/lib/types/database";

export function notificationLink(notification: Notification): string {
  if (!notification.donor_request_id) {
    return "/dashboard/notifications";
  }

  const title = notification.title.toLowerCase();

  if (
    title.includes("new request") ||
    title.includes("new blood") ||
    title.includes("request received")
  ) {
    return "/dashboard/incoming";
  }

  return "/dashboard/my-requests";
}
