"use server";

import { searchDonors } from "@/lib/data/search-donors";
import type { BloodGroup, Profile } from "@/lib/types/database";
import { BLOOD_GROUPS } from "@/lib/constants";

export type DonorSearchState = {
  donors: Profile[];
  searched: boolean;
  error?: string;
};

const VALID_GROUPS = new Set<string>(BLOOD_GROUPS);

export async function searchDonorsAction(
  _prevState: DonorSearchState,
  formData: FormData
): Promise<DonorSearchState> {
  const bloodGroup = String(formData.get("blood_group") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const upazila = String(formData.get("upazila") ?? "").trim();

  if (!bloodGroup) {
    return {
      donors: [],
      searched: true,
      error: "Please select a blood group.",
    };
  }

  if (!VALID_GROUPS.has(bloodGroup)) {
    return {
      donors: [],
      searched: true,
      error: "Please select a valid blood group.",
    };
  }

  const donors = await searchDonors({
    bloodGroup: bloodGroup as BloodGroup,
    district: district || undefined,
    upazila: upazila || undefined,
  });

  return { donors, searched: true };
}
