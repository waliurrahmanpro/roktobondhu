"use server";

import {
  queryAvailableDonors,
  type DonorFilters,
} from "@/lib/data/donors";
import type { BloodGroup, Profile } from "@/lib/types/database";
import { BLOOD_GROUPS } from "@/lib/constants";

export type DonorSearchFilters = {
  bloodGroup: string;
  district: string;
  upazila: string;
};

export type DonorListState = {
  donors: Profile[];
  mode: "all" | "search";
  searched: boolean;
  error?: string;
  hasMore: boolean;
  totalCount: number;
  filters?: DonorSearchFilters;
};

const VALID_GROUPS = new Set<string>(BLOOD_GROUPS);

function parseFilters(formData: FormData): DonorSearchFilters {
  return {
    bloodGroup: String(formData.get("blood_group") ?? "").trim(),
    district: String(formData.get("district") ?? "").trim(),
    upazila: String(formData.get("upazila") ?? "").trim(),
  };
}

function toQueryFilters(filters: DonorSearchFilters): DonorFilters {
  const bloodGroup = filters.bloodGroup;
  return {
    bloodGroup:
      bloodGroup && VALID_GROUPS.has(bloodGroup)
        ? (bloodGroup as BloodGroup)
        : undefined,
    district: filters.district || undefined,
    upazila: filters.upazila || undefined,
    offset: 0,
  };
}

export async function searchDonorsAction(
  _prevState: DonorListState,
  formData: FormData
): Promise<DonorListState> {
  const filters = parseFilters(formData);

  if (filters.bloodGroup && !VALID_GROUPS.has(filters.bloodGroup)) {
    return {
      donors: [],
      mode: "search",
      searched: true,
      error: "Please select a valid blood group.",
      hasMore: false,
      totalCount: 0,
    };
  }

  const { donors, hasMore, totalCount } = await queryAvailableDonors(
    toQueryFilters(filters)
  );

  return {
    donors,
    mode: "search",
    searched: true,
    hasMore,
    totalCount,
    filters,
  };
}

export async function loadMoreDonorsAction(
  mode: "all" | "search",
  filters: DonorSearchFilters | null,
  offset: number
): Promise<Pick<DonorListState, "donors" | "hasMore" | "totalCount">> {
  const queryFilters: DonorFilters =
    mode === "search" && filters
      ? { ...toQueryFilters(filters), offset }
      : { offset };

  return queryAvailableDonors(queryFilters);
}
