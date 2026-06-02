import { createClient } from "@/lib/supabase/server";
import type { BloodGroup, Profile } from "@/lib/types/database";

export const DONOR_PAGE_SIZE = 3;

export type DonorSearchParams = {
  bloodGroup: BloodGroup;
  district?: string;
  upazila?: string;
  offset?: number;
};

export type DonorSearchResult = {
  donors: Profile[];
  hasMore: boolean;
  totalCount: number;
};

function sanitizeIlike(value: string) {
  return value.replace(/[%_]/g, "").trim();
}

export async function searchDonors({
  bloodGroup,
  district,
  upazila,
  offset = 0,
}: DonorSearchParams): Promise<DonorSearchResult> {
  const supabase = await createClient();

  const districtTrimmed = district ? sanitizeIlike(district) : "";
  const upazilaTrimmed = upazila ? sanitizeIlike(upazila) : "";

  let countQuery = supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("blood_group", bloodGroup)
    .eq("donation_availability", true);

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
    .eq("blood_group", bloodGroup)
    .eq("donation_availability", true)
    .order("updated_at", { ascending: false });

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
    console.error("Donor search failed:", error.message);
    return { donors: [], hasMore: false, totalCount };
  }

  const donors = data ?? [];
  const hasMore = offset + donors.length < totalCount;

  return { donors, hasMore, totalCount };
}
