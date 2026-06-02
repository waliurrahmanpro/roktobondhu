import Link from "next/link";
import { BloodRequestCard } from "@/components/BloodRequestCard";
import type { BloodRequest } from "@/lib/types/database";

type BloodRequestFeedProps = {
  requests: BloodRequest[];
  title?: string;
  emptyMessage?: string;
};

export function BloodRequestFeed({
  requests,
  title = "Live blood requests",
  emptyMessage = "No blood requests yet. Be the first to post one.",
}: BloodRequestFeedProps) {
  return (
    <section id="requests" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-red-600">
              Request feed
            </span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-gray-600">
              Real-time blood requests from patients and families across
              Bangladesh.
            </p>
          </div>
          <Link
            href="/dashboard/requests"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-700"
          >
            Create blood request
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
            <p className="text-gray-600">{emptyMessage}</p>
            <Link
              href="/login?redirect=/dashboard/requests"
              className="mt-4 inline-block text-sm font-semibold text-red-600 hover:underline"
            >
              Log in to create a request →
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <BloodRequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
