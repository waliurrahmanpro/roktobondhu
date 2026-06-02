import type { Notification } from "@/lib/types/database";

export function notificationLink(notification: Notification): string {
  if (notification.blood_request_id) {
    return `/requests/${notification.blood_request_id}`;
  }

  const title = notification.title.toLowerCase();

  if (title.includes("nid approved") || title.includes("nid rejected")) {
    return "/dashboard";
  }

  if (!notification.donor_request_id) {
    return "/dashboard/notifications";
  }

  if (
    title.includes("urgent blood") ||
    title.includes("near you") ||
    title.includes("new request") ||
    title.includes("new blood") ||
    title.includes("request received")
  ) {
    return "/dashboard/incoming";
  }

  if (title.includes("donation confirmed") || title.includes("earned")) {
    return "/dashboard/my-donations";
  }

  if (title.includes("report submitted") || title.includes("report has been")) {
    return "/dashboard/reports";
  }

  return "/dashboard/my-requests";
}
