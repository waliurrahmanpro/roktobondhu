import { createClient } from "@/lib/supabase/server";
import type { BloodGroup, Profile } from "@/lib/types/database";

export const DONOR_PAGE_SIZE = 12;

export type DonorFilters = {
  bloodGroup?: BloodGroup;
  division?: string;
  district?: string;
  upazila?: string;
  offset?: number;
};

export type DonorQueryResult = {
  donors: Profile[];
  hasMore: boolean;
  totalCount: number;
};

export async function queryAvailableDonors(
  filters: DonorFilters = {}
): Promise<DonorQueryResult> {
  const { offset = 0, bloodGroup, division, district, upazila } = filters;
  const supabase = await createClient();

  const divisionTrimmed = division?.trim() ?? "";
  const districtTrimmed = district?.trim() ?? "";
  const upazilaTrimmed = upazila?.trim() ?? "";

  let countQuery = supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("donation_availability", true)
    .eq("is_banned", false)
    .neq("full_name", "New Donor");

  if (bloodGroup) {
    countQuery = countQuery.eq("blood_group", bloodGroup);
  }
  if (divisionTrimmed) {
    countQuery = countQuery.eq("division", divisionTrimmed);
  }
  if (districtTrimmed) {
    countQuery = countQuery.eq("district", districtTrimmed);
  }
  if (upazilaTrimmed) {
    countQuery = countQuery.eq("upazila", upazilaTrimmed);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error("Donor count failed:", countError.message);
    return { donors: [], hasMore: false, totalCount: 0 };
  }

  const totalCount = count ?? 0;

  let dataQuery = supabase
    .from("profiles")
    .select("*")
    .eq("donation_availability", true)
    .eq("is_banned", false)
    .neq("full_name", "New Donor")
    .order("updated_at", { ascending: false });

  if (bloodGroup) {
    dataQuery = dataQuery.eq("blood_group", bloodGroup);
  }
  if (divisionTrimmed) {
    dataQuery = dataQuery.eq("division", divisionTrimmed);
  }
  if (districtTrimmed) {
    dataQuery = dataQuery.eq("district", districtTrimmed);
  }
  if (upazilaTrimmed) {
    dataQuery = dataQuery.eq("upazila", upazilaTrimmed);
  }

  const { data, error } = await dataQuery.range(
    offset,
    offset + DONOR_PAGE_SIZE - 1
  );

  if (error) {
    console.error("Donor query failed:", error.message);
    return { donors: [], hasMore: false, totalCount };
  }

  const donors = data ?? [];
  const hasMore = offset + donors.length < totalCount;

  return { donors, hasMore, totalCount };
}

export async function fetchAvailableDonorsPage(offset = 0) {
  return queryAvailableDonors({ offset });
}
