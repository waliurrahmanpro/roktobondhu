"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  searchDonorsAction,
  loadMoreDonorsAction,
  type DonorSearchState,
} from "@/app/actions/donors";
import { DonorCard } from "@/components/DonorCard";
import { BLOOD_GROUPS, inputClassName } from "@/lib/constants";

const initialState: DonorSearchState = {
  donors: [],
  searched: false,
  hasMore: false,
  totalCount: 0,
};

export function DonorSearch() {
  const [state, formAction, searchPending] = useActionState(
    searchDonorsAction,
    initialState
  );
  const [extraDonors, setExtraDonors] = useState<DonorSearchState["donors"]>(
    []
  );
  const [hasMore, setHasMore] = useState(false);
  const [loadMorePending, startLoadMore] = useTransition();

  useEffect(() => {
    if (state.searched) {
      setExtraDonors([]);
      setHasMore(state.hasMore ?? false);
    }
  }, [state]);

  const allDonors = [...(state.donors ?? []), ...extraDonors];
  const showingCount = allDonors.length;
  const totalCount = state.totalCount ?? 0;

  function handleLoadMore() {
    if (!state.filters) return;

    startLoadMore(async () => {
      const result = await loadMoreDonorsAction(
        state.filters!,
        showingCount
      );
      setExtraDonors((prev) => [...prev, ...result.donors]);
      setHasMore(result.hasMore ?? false);
    });
  }

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
              required
              defaultValue=""
              className={inputClassName}
            >
              <option value="" disabled>
                Select group
              </option>
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
              Area / Thana
            </label>
            <input
              id="upazila"
              name="upazila"
              type="text"
              placeholder="e.g. Mirpur"
              className={inputClassName}
            />
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              type="submit"
              disabled={searchPending}
              className="w-full rounded-xl bg-red-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {searchPending ? "Searching…" : "Search Donors"}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-12">
        {state.error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {state.error}
          </p>
        )}

        {state.searched && !state.error && allDonors.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-gray-600">
            No donors found.
          </p>
        )}

        {allDonors.length > 0 && (
          <>
            {totalCount > 0 && (
              <p className="mb-6 text-center text-sm text-gray-500">
                Showing {showingCount} of {totalCount} donor
                {totalCount === 1 ? "" : "s"} · sorted by most recently active
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allDonors.map((donor) => (
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
