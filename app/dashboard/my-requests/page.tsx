import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/DashboardNav";
import { ReceiverRequestCard } from "@/components/ReceiverRequestCard";
import {
  fetchReceiverDonorRequests,
  fetchUnreadNotificationCount,
} from "@/lib/data/donor-requests";

export const metadata = {
  title: "My requests — RoktoBondhu",
};

export default async function MyRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/my-requests");
  }

  const [requests, unreadCount] = await Promise.all([
    fetchReceiverDonorRequests(user.id),
    fetchUnreadNotificationCount(user.id),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pt-28 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">My requests</h1>
        <p className="mt-2 text-gray-600">
          Blood requests you sent to donors and their current status.
        </p>

        <DashboardNav
          currentPath="/dashboard/my-requests"
          unreadCount={unreadCount}
        />

        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
            <p className="text-gray-500">You have not sent any blood requests yet.</p>
            <Link
              href="/#search"
              className="mt-4 inline-block text-sm font-semibold text-red-600 hover:underline"
            >
              Find donors on homepage →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <ReceiverRequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
