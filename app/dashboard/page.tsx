import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardForm } from "@/app/dashboard/DashboardForm";
import { ProfileDisplay } from "@/components/ProfileDisplay";
import { DashboardNav } from "@/components/DashboardNav";
import { logout } from "@/app/actions/auth";
import {
  fetchIncomingDonorRequests,
  fetchReceiverDonorRequests,
  fetchUnreadNotificationCount,
} from "@/lib/data/donor-requests";

export const metadata = {
  title: "Dashboard — RoktoBondhu",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 pb-16">
        <div className="mx-auto max-w-lg px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Profile not found</h1>
          <p className="mt-2 text-gray-600">
            Your account exists but the donor profile is missing. Run the SQL
            migrations in Supabase, then register again or contact support.
          </p>
          <form action={logout} className="mt-6">
            <button
              type="submit"
              className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    );
  }

  const [incoming, myRequests, unreadCount] = await Promise.all([
    fetchIncomingDonorRequests(user.id),
    fetchReceiverDonorRequests(user.id),
    fetchUnreadNotificationCount(user.id),
  ]);

  const pendingIncoming = incoming.filter((r) => r.status === "pending").length;
  const pendingOutgoing = myRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pt-28 pb-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-gray-600">Manage your donor profile and requests.</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </form>
        </div>

        <DashboardNav currentPath="/dashboard" unreadCount={unreadCount} />

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/dashboard/incoming"
            className="rounded-xl border border-red-100 bg-white p-4 shadow-sm transition hover:border-red-200"
          >
            <p className="text-2xl font-bold text-red-600">{pendingIncoming}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              Incoming (donor)
            </p>
            <p className="text-xs text-gray-500">Accept or reject</p>
          </Link>
          <Link
            href="/dashboard/my-requests"
            className="rounded-xl border border-red-100 bg-white p-4 shadow-sm transition hover:border-red-200"
          >
            <p className="text-2xl font-bold text-red-600">{pendingOutgoing}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">My requests</p>
            <p className="text-xs text-gray-500">Status as requester</p>
          </Link>
          <Link
            href="/dashboard/notifications"
            className="rounded-xl border border-red-100 bg-white p-4 shadow-sm transition hover:border-red-200"
          >
            <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">Notifications</p>
            <p className="text-xs text-gray-500">Unread</p>
          </Link>
        </div>

        <ProfileDisplay profile={profile} email={user.email} />

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-lg shadow-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Edit profile</h2>
          <p className="mt-1 text-sm text-gray-500">
            Update your details and photo, then click Save Profile.
          </p>
          <div className="mt-6">
            <DashboardForm profile={profile} />
          </div>
        </div>
      </div>
    </div>
  );
}
