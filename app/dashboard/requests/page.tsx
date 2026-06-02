import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateBloodRequestForm } from "@/components/CreateBloodRequestForm";
import { BloodRequestCard } from "@/components/BloodRequestCard";
import { sortBloodRequests } from "@/lib/blood-requests";

export const metadata = {
  title: "Blood Requests — RoktoBondhu",
};

export default async function BloodRequestsDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/requests");
  }

  const { data: myRequests } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const sorted = sortBloodRequests(myRequests ?? []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pt-28 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-red-600 hover:underline"
          >
            ← Back to profile dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Blood requests
          </h1>
          <p className="mt-2 text-gray-600">
            Create a request for a patient. It will appear on the homepage feed
            for donors to see.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg shadow-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Create blood request
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Fill in patient and hospital details below.
          </p>
          <div className="mt-6">
            <CreateBloodRequestForm />
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Your requests</h2>
          {sorted.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
              You have not posted any blood requests yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {sorted.map((request) => (
                <BloodRequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
