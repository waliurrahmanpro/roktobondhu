import { createClient } from "@/lib/supabase/server";
import type { ProfileSummary } from "@/lib/types/database";

export async function fetchProfilesByUserIds(
  userIds: string[]
): Promise<Map<string, ProfileSummary>> {
  if (userIds.length === 0) return new Map();

  const supabase = await createClient();
  const uniqueIds = [...new Set(userIds)];

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, blood_group, district, upazila, phone")
    .in("user_id", uniqueIds);

  if (error) {
    console.error("Failed to fetch profiles:", error.message);
    return new Map();
  }

  return new Map((data ?? []).map((p) => [p.user_id, p]));
}

export function attachProfilesToRequests<
  T extends { donor_id: string; receiver_id: string },
>(
  requests: T[],
  profileMap: Map<string, ProfileSummary>
) {
  return requests.map((r) => ({
    ...r,
    donor_profile: profileMap.get(r.donor_id) ?? null,
    receiver_profile: profileMap.get(r.receiver_id) ?? null,
  }));
}
