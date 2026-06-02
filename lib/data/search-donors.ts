import { createClient } from "@/lib/supabase/server";
import type { BloodGroup, Profile } from "@/lib/types/database";

export type DonorSearchParams = {
  bloodGroup: BloodGroup;
  district?: string;
  upazila?: string;
};

function sanitizeIlike(value: string) {
  return value.replace(/[%_]/g, "").trim();
}

export async function searchDonors({
  bloodGroup,
  district,
  upazila,
}: DonorSearchParams): Promise<Profile[]> {
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("*")
    .eq("blood_group", bloodGroup)
    .eq("donation_availability", true)
    .order("updated_at", { ascending: false })
    .limit(3);

  const districtTrimmed = district ? sanitizeIlike(district) : "";
  if (districtTrimmed) {
    query = query.ilike("district", `%${districtTrimmed}%`);
  }

  const upazilaTrimmed = upazila ? sanitizeIlike(upazila) : "";
  if (upazilaTrimmed) {
    query = query.ilike("upazila", `%${upazilaTrimmed}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Donor search failed:", error.message);
    return [];
  }

  return data ?? [];
}
