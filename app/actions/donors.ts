"use server";

import { searchDonors } from "@/lib/data/search-donors";
import type { BloodGroup, Profile } from "@/lib/types/database";
import { BLOOD_GROUPS } from "@/lib/constants";

export type DonorSearchFilters = {
  bloodGroup: BloodGroup;
  district: string;
  upazila: string;
};

export type DonorSearchState = {
  donors: Profile[];
  searched: boolean;
  error?: string;
  hasMore?: boolean;
  totalCount?: number;
  filters?: DonorSearchFilters;
};

const VALID_GROUPS = new Set<string>(BLOOD_GROUPS);

function parseFilters(formData: FormData): DonorSearchFilters | { error: string } {
  const bloodGroup = String(formData.get("blood_group") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const upazila = String(formData.get("upazila") ?? "").trim();

  if (!bloodGroup) {
    return { error: "Please select a blood group." };
  }

  if (!VALID_GROUPS.has(bloodGroup)) {
    return { error: "Please select a valid blood group." };
  }

  return {
    bloodGroup: bloodGroup as BloodGroup,
    district,
    upazila,
  };
}

export async function searchDonorsAction(
  _prevState: DonorSearchState,
  formData: FormData
): Promise<DonorSearchState> {
  const parsed = parseFilters(formData);

  if ("error" in parsed) {
    return {
      donors: [],
      searched: true,
      error: parsed.error,
      hasMore: false,
      totalCount: 0,
    };
  }

  const { donors, hasMore, totalCount } = await searchDonors({
    bloodGroup: parsed.bloodGroup,
    district: parsed.district || undefined,
    upazila: parsed.upazila || undefined,
    offset: 0,
  });

  return {
    donors,
    searched: true,
    hasMore,
    totalCount,
    filters: parsed,
  };
}

export async function loadMoreDonorsAction(
  filters: DonorSearchFilters,
  offset: number
): Promise<Pick<DonorSearchState, "donors" | "hasMore" | "totalCount">> {
  const { donors, hasMore, totalCount } = await searchDonors({
    bloodGroup: filters.bloodGroup,
    district: filters.district || undefined,
    upazila: filters.upazila || undefined,
    offset,
  });

  return { donors, hasMore, totalCount };
}
