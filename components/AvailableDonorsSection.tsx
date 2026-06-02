"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import {
  searchDonorsAction,
  loadMoreDonorsAction,
  type DonorListState,
  type DonorSearchFilters,
} from "@/app/actions/donors";
import { DonorCard } from "@/components/DonorCard";
import { BLOOD_GROUPS, inputClassName } from "@/lib/constants";
import type { Profile } from "@/lib/types/database";

type AvailableDonorsSectionProps = {
  initialDonors: Profile[];
  initialHasMore: boolean;
  initialTotalCount: number;
};

export function AvailableDonorsSection({
  initialDonors,
  initialHasMore,
  initialTotalCount,
}: AvailableDonorsSectionProps) {
  const initialSnapshot = useRef({
    donors: initialDonors,
    hasMore: initialHasMore,
    totalCount: initialTotalCount,
  });

  const [donors, setDonors] = useState(initialDonors);
  const [mode, setMode] = useState<"all" | "search">("all");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [searchFilters, setSearchFilters] = useState<DonorSearchFilters | null>(
    null
  );
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | undefined>();
  const [loadMorePending, startLoadMore] = useTransition();

  const [, formAction, searchPending] = useActionState(
    async (prev: DonorListState, formData: FormData) => {
      const result = await searchDonorsAction(prev, formData);
      setDonors(result.donors);
      setMode(result.mode);
      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);
      setSearchFilters(result.filters ?? null);
      setSearched(result.searched);
      setSearchError(result.error);
      return result;
    },
    {
      donors: initialDonors,
      mode: "all",
      searched: false,
      hasMore: initialHasMore,
      totalCount: initialTotalCount,
    }
  );

  function handleReset() {
    const snap = initialSnapshot.current;
    setDonors(snap.donors);
    setMode("all");
    setHasMore(snap.hasMore);
    setTotalCount(snap.totalCount);
    setSearchFilters(null);
    setSearched(false);
    setSearchError(undefined);
  }

  function handleLoadMore() {
    startLoadMore(async () => {
      const result = await loadMoreDonorsAction(
        mode,
        searchFilters,
        donors.length
      );
      setDonors((prev) => [...prev, ...result.donors]);
      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);
    });
  }

  const showingCount = donors.length;
  const emptyMessage =
    mode === "search" ? "No donors found." : "No available donors right now.";

  return (
    <>
      <form
        action={formAction}
        className="mx-auto mt-12 max-w-4xl rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-100 sm:p-8"
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label
              htmlFor="blood_group"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Blood group
            </label>
            <select
              id="blood_group"
              name="blood_group"
              defaultValue=""
              className={inputClassName}
            >
              <option value="">Any blood group</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="district"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              District
            </label>
            <input
              id="district"
              name="district"
              type="text"
              placeholder="e.g. Dhaka"
              className={inputClassName}
            />
          </div>
          <div>
            <label
              htmlFor="upazila"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Upazila / Area
            </label>
            <input
              id="upazila"
              name="upazila"
              type="text"
              placeholder="e.g. Mirpur"
              className={inputClassName}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1 sm:justify-end">
            <button
              type="submit"
              disabled={searchPending}
              className="w-full rounded-xl bg-red-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {searchPending ? "Searching…" : "Search Donors"}
            </button>
            {searched && (
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Show all donors
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="mt-12">
        {searchError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {searchError}
          </p>
        )}

        {donors.length === 0 && (mode === "all" || searched) && !searchError && (
          <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-gray-600">
            {emptyMessage}
          </p>
        )}

        {donors.length > 0 && (
          <>
            <p className="mb-6 text-center text-sm text-gray-500">
              Showing {showingCount} of {totalCount} available donor
              {totalCount === 1 ? "" : "s"}
              {mode === "search" ? " (filtered)" : ""} · most recently active
              first
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {donors.map((donor) => (
                <DonorCard key={donor.id} donor={donor} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadMorePending}
                  className="rounded-full border border-red-200 bg-white px-8 py-3 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadMorePending ? "Loading…" : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
