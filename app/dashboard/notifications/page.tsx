import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/DashboardNav";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { NotificationItem } from "@/components/NotificationItem";
import { fetchActiveAnnouncements } from "@/lib/data/super-admin";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { fetchUserNotifications } from "@/lib/data/notifications";
import { fetchUnreadNotificationCount } from "@/lib/data/donor-requests";

export const metadata = {
  title: "Notifications — RoktoBondhu",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/notifications");
  }

  const [notifications, unreadCount, announcements] = await Promise.all([
    fetchUserNotifications(user.id),
    fetchUnreadNotificationCount(user.id),
    fetchActiveAnnouncements(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pt-28 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="mt-2 text-gray-600">
              Updates about blood requests you sent or received.
            </p>
          </div>
          {unreadCount > 0 && (
            <form action={markAllNotificationsReadAction}>
              <button
                type="submit"
                className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Mark all as read
              </button>
            </form>
          )}
        </div>

        <DashboardNav
          currentPath="/dashboard/notifications"
          unreadCount={unreadCount}
        />

        {announcements.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Announcements
            </h2>
            <AnnouncementBanner announcements={announcements} compact />
          </div>
        )}

        {notifications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center text-gray-500">
            No notifications yet.
          </p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
