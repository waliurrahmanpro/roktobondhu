import { isDonationAgeEligible, isVerifiedDonor } from "@/lib/eligibility";
import { isInDonationCooldown } from "@/lib/donor-status";
import { getTrustStatus } from "@/lib/trust";
import type { BloodGroup, Profile, VerificationStatus } from "@/lib/types/database";

export const MATCH_POINTS = {
  bloodGroup: 100,
  district: 50,
  upazila: 30,
  verified: 30,
  trusted: 20,
  available: 20,
  pointsMax: 20,
} as const;

export const MAX_MATCH_SCORE =
  MATCH_POINTS.bloodGroup +
  MATCH_POINTS.district +
  MATCH_POINTS.upazila +
  MATCH_POINTS.verified +
  MATCH_POINTS.trusted +
  MATCH_POINTS.pointsMax +
  MATCH_POINTS.available;

export function matchPointsBonus(totalPoints: number): number {
  if (totalPoints >= 500) return 20;
  if (totalPoints >= 250) return 15;
  if (totalPoints >= 100) return 10;
  if (totalPoints >= 50) return 5;
  return 0;
}

export type BloodRequestForMatching = {
  blood_group: BloodGroup;
  district: string;
  upazila?: string | null;
  user_id: string;
};

export type DonorForMatching = Pick<
  Profile,
  | "user_id"
  | "blood_group"
  | "district"
  | "upazila"
  | "donation_availability"
  | "total_points"
  | "total_donations"
  | "reported_donations"
  | "is_banned"
  | "verification_status"
  | "date_of_birth"
  | "next_eligible_date"
>;

export function isMatchableDonor(donor: DonorForMatching): boolean {
  if (donor.is_banned || !donor.donation_availability) return false;
  if (!isVerifiedDonor(donor.verification_status as VerificationStatus)) {
    return false;
  }
  if (!isDonationAgeEligible(donor.date_of_birth)) return false;
  if (isInDonationCooldown(donor.next_eligible_date)) return false;
  return true;
}

export function calculateDonorMatchScore(
  request: BloodRequestForMatching,
  donor: DonorForMatching
): number {
  if (!isMatchableDonor(donor)) {
    return 0;
  }

  if (donor.user_id === request.user_id) {
    return 0;
  }

  let score = 0;

  if (donor.blood_group === request.blood_group) {
    score += MATCH_POINTS.bloodGroup;
  }

  if (
    request.district &&
    donor.district &&
    donor.district.toLowerCase() === request.district.toLowerCase()
  ) {
    score += MATCH_POINTS.district;
  }

  if (
    request.upazila &&
    donor.upazila &&
    donor.upazila.toLowerCase() === request.upazila.toLowerCase()
  ) {
    score += MATCH_POINTS.upazila;
  }

  if (isVerifiedDonor(donor.verification_status as VerificationStatus)) {
    score += MATCH_POINTS.verified;
  }

  const trust = getTrustStatus(
    donor.total_donations ?? 0,
    donor.reported_donations ?? 0
  );
  if (trust.kind === "trusted") {
    score += MATCH_POINTS.trusted;
  }

  score += matchPointsBonus(donor.total_points ?? 0);

  if (donor.donation_availability) {
    score += MATCH_POINTS.available;
  }

  return score;
}

export function matchScorePercent(score: number): number {
  if (score <= 0) return 0;
  return Math.min(100, Math.round((score / MAX_MATCH_SCORE) * 100));
}

export type ScoredDonorMatch<T extends DonorForMatching> = T & {
  match_score: number;
  match_percent: number;
};

export function rankDonorMatches<T extends DonorForMatching>(
  request: BloodRequestForMatching,
  donors: T[],
  limit = 10
): ScoredDonorMatch<T>[] {
  return donors
    .map((donor) => {
      const match_score = calculateDonorMatchScore(request, donor);
      return {
        ...donor,
        match_score,
        match_percent: matchScorePercent(match_score),
      };
    })
    .filter((d) => d.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);
}
