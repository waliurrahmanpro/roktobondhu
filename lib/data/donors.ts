import { createClient } from "@/lib/supabase/server";
import type { BloodGroup, Profile } from "@/lib/types/database";

export const DONOR_PAGE_SIZE = 12;

export type DonorFilters = {
  bloodGroup?: BloodGroup;
  district?: string;
  upazila?: string;
  offset?: number;
};

export type DonorQueryResult = {
  donors: Profile[];
  hasMore: boolean;
  totalCount: number;
};

function sanitizeIlike(value: string) {
  return value.replace(/[%_]/g, "").trim();
}

export async function queryAvailableDonors(
  filters: DonorFilters = {}
): Promise<DonorQueryResult> {
  const { offset = 0, bloodGroup, district, upazila } = filters;
  const supabase = await createClient();

  const districtTrimmed = district ? sanitizeIlike(district) : "";
  const upazilaTrimmed = upazila ? sanitizeIlike(upazila) : "";

  let countQuery = supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("donation_availability", true)
    .neq("full_name", "New Donor");

  if (bloodGroup) {
    countQuery = countQuery.eq("blood_group", bloodGroup);
  }
  if (districtTrimmed) {
    countQuery = countQuery.ilike("district", `%${districtTrimmed}%`);
  }
  if (upazilaTrimmed) {
    countQuery = countQuery.ilike("upazila", `%${upazilaTrimmed}%`);
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
    .neq("full_name", "New Donor")
    .order("updated_at", { ascending: false });

  if (bloodGroup) {
    dataQuery = dataQuery.eq("blood_group", bloodGroup);
  }
  if (districtTrimmed) {
    dataQuery = dataQuery.ilike("district", `%${districtTrimmed}%`);
  }
  if (upazilaTrimmed) {
    dataQuery = dataQuery.ilike("upazila", `%${upazilaTrimmed}%`);
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
