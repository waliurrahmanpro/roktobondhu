import { createClient } from "@/lib/supabase/server";
import { maxDateOfBirthForDonorAge } from "@/lib/eligibility";
import {
  calculateDonorMatchScore,
  matchScorePercent,
  rankDonorMatches,
  type BloodRequestForMatching,
} from "@/lib/matching";
import type { BloodRequest, Profile } from "@/lib/types/database";

export type MatchLogWithDonor = {
  id: string;
  request_id: string;
  donor_id: string;
  match_score: number;
  match_percent: number;
  created_at: string;
  donor: Pick<
    Profile,
    | "user_id"
    | "full_name"
    | "blood_group"
    | "district"
    | "upazila"
    | "phone"
    | "total_points"
    | "donation_availability"
  >;
};

export type NearbyBloodRequest = BloodRequest & {
  match_score: number;
  match_percent: number;
};

export type MatchingAnalytics = {
  totalMatches: number;
  acceptedMatches: number;
  successfulDonations: number;
};

export async function fetchBloodRequestById(
  id: string
): Promise<BloodRequest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch blood request:", error.message);
    return null;
  }

  return (data as BloodRequest) ?? null;
}

export async function fetchTopMatchesForRequest(
  requestId: string,
  limit = 10
): Promise<MatchLogWithDonor[]> {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("match_logs")
    .select("*")
    .eq("request_id", requestId)
    .order("match_score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch match logs:", error.message);
    return [];
  }

  if (!logs?.length) return [];

  const donorIds = logs.map((l) => l.donor_id);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select(
      "user_id, full_name, blood_group, district, upazila, phone, total_points, donation_availability"
    )
    .in("user_id", donorIds);

  if (profileError) {
    console.error("Failed to fetch match donor profiles:", profileError.message);
    return [];
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  return logs
    .map((log) => {
      const donor = profileMap.get(log.donor_id);
      if (!donor) return null;
      return {
        id: log.id,
        request_id: log.request_id,
        donor_id: log.donor_id,
        match_score: log.match_score,
        match_percent: matchScorePercent(log.match_score),
        created_at: log.created_at,
        donor,
      };
    })
    .filter((x): x is MatchLogWithDonor => x !== null);
}

/** Recompute matches client-side if logs missing (legacy requests). */
export async function computeTopMatchesForRequest(
  request: BloodRequest,
  limit = 10
): Promise<MatchLogWithDonor[]> {
  const fromLogs = await fetchTopMatchesForRequest(request.id, limit);
  if (fromLogs.length > 0) return fromLogs;

  const supabase = await createClient();
  const maxDob = maxDateOfBirthForDonorAge();

  const { data: donors, error } = await supabase
    .from("profiles")
    .select(
      "user_id, full_name, blood_group, district, upazila, phone, total_points, total_donations, reported_donations, donation_availability, is_banned, verification_status, date_of_birth, next_eligible_date"
    )
    .eq("donation_availability", true)
    .eq("is_banned", false)
    .eq("verification_status", "approved")
    .not("date_of_birth", "is", null)
    .lte("date_of_birth", maxDob)
    .or(
      `next_eligible_date.is.null,next_eligible_date.lte.${new Date().toISOString().split("T")[0]}`
    )
    .neq("user_id", request.user_id);

  if (error || !donors) return [];

  const req: BloodRequestForMatching = {
    blood_group: request.blood_group,
    district: request.district,
    upazila: request.upazila,
    user_id: request.user_id,
  };

  const ranked = rankDonorMatches(req, donors, limit);

  return ranked.map((d, i) => ({
    id: `computed-${d.user_id}`,
    request_id: request.id,
    donor_id: d.user_id,
    match_score: d.match_score,
    match_percent: d.match_percent,
    created_at: request.created_at,
    donor: {
      user_id: d.user_id,
      full_name: d.full_name,
      blood_group: d.blood_group,
      district: d.district,
      upazila: d.upazila,
      phone: d.phone,
      total_points: d.total_points,
      donation_availability: d.donation_availability,
    },
  }));
}

export async function fetchNearbyBloodRequestsForDonor(
  donorUserId: string,
  limit = 8
): Promise<NearbyBloodRequest[]> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "user_id, blood_group, district, upazila, donation_availability, total_points, total_donations, reported_donations, is_banned, verification_status, date_of_birth, next_eligible_date"
    )
    .eq("user_id", donorUserId)
    .single();

  if (profileError || !profile) return [];

  const { data: requests, error } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("status", "active")
    .eq("blood_group", profile.blood_group)
    .neq("user_id", donorUserId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !requests) return [];

  const scored: NearbyBloodRequest[] = requests
    .map((request) => {
      const match_score = calculateDonorMatchScore(
        {
          blood_group: request.blood_group,
          district: request.district,
          upazila: request.upazila,
          user_id: request.user_id,
        },
        profile
      );

      return {
        ...(request as BloodRequest),
        match_score,
        match_percent: matchScorePercent(match_score),
      };
    })
    .filter((r) => r.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);

  return scored;
}

export async function fetchMatchingAnalytics(): Promise<MatchingAnalytics> {
  const supabase = await createClient();

  const [totalRes, acceptedRes, donatedRes] = await Promise.all([
    supabase.from("match_logs").select("*", { count: "exact", head: true }),
    supabase
      .from("match_logs")
      .select("*", { count: "exact", head: true })
      .not("accepted_at", "is", null),
    supabase
      .from("match_logs")
      .select("*", { count: "exact", head: true })
      .not("donation_completed_at", "is", null),
  ]);

  return {
    totalMatches: totalRes.count ?? 0,
    acceptedMatches: acceptedRes.count ?? 0,
    successfulDonations: donatedRes.count ?? 0,
  };
}
