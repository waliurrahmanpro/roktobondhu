import { createClient } from "@/lib/supabase/server";
import type { Profile, PublicDonorProfile } from "@/lib/types/database";

export const LEADERBOARD_PAGE_SIZE = 20;

export type LeaderboardResult = {
  donors: Profile[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
};

export async function fetchTopDonors(limit = 5): Promise<Profile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("total_points", { ascending: false })
    .order("total_donations", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch top donors:", error.message);
    return [];
  }

  return (data ?? []) as Profile[];
}

export async function fetchLeaderboardPage(
  page = 1
): Promise<LeaderboardResult> {
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * LEADERBOARD_PAGE_SIZE;
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Leaderboard count failed:", countError.message);
    return {
      donors: [],
      totalCount: 0,
      page: safePage,
      totalPages: 0,
      hasMore: false,
    };
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / LEADERBOARD_PAGE_SIZE));

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("total_points", { ascending: false })
    .order("total_donations", { ascending: false })
    .range(offset, offset + LEADERBOARD_PAGE_SIZE - 1);

  if (error) {
    console.error("Leaderboard query failed:", error.message);
    return {
      donors: [],
      totalCount,
      page: safePage,
      totalPages,
      hasMore: false,
    };
  }

  const donors = (data ?? []) as Profile[];
  const hasMore = offset + donors.length < totalCount;

  return {
    donors,
    totalCount,
    page: safePage,
    totalPages,
    hasMore,
  };
}

export async function fetchPublicDonorProfile(
  userId: string
): Promise<PublicDonorProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, user_id, full_name, blood_group, division, district, upazila, profile_picture_url, total_points, total_donations, reported_donations, donation_availability, last_donation_date, created_at, updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch public donor profile:", error.message);
    return null;
  }

  return (data as PublicDonorProfile) ?? null;
}
