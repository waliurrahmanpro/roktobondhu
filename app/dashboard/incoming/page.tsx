import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/DashboardNav";
import { IncomingDonorRequestCard } from "@/components/IncomingDonorRequestCard";
import { fetchIncomingDonorRequests } from "@/lib/data/donor-requests";
import { fetchUnreadNotificationCount } from "@/lib/data/donor-requests";

export const metadata = {
  title: "Incoming requests — Blood Bridge BD",
};

export default async function IncomingRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/incoming");
  }

  const [requests, unreadCount] = await Promise.all([
    fetchIncomingDonorRequests(user.id),
    fetchUnreadNotificationCount(user.id),
  ]);

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pt-28 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Incoming requests</h1>
        <p className="mt-2 text-gray-600">
          People who requested your blood. Accept or reject each request.
        </p>

        <DashboardNav
          currentPath="/dashboard/incoming"
          unreadCount={unreadCount}
        />

        {requests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center text-gray-500">
            No incoming blood requests yet.
          </p>
        ) : (
          <div className="space-y-4">
            {pending.length > 0 && (
              <p className="text-sm font-medium text-amber-700">
                {pending.length} pending request{pending.length === 1 ? "" : "s"}
              </p>
            )}
            {requests.map((request) => (
              <IncomingDonorRequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
