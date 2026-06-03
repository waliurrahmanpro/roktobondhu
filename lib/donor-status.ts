import {
  isDonationAgeEligible,
  isVerifiedDonor,
} from "@/lib/eligibility";
import type { Profile, VerificationStatus } from "@/lib/types/database";

export type DonorStatusKind =
  | "available"
  | "cooling_down"
  | "not_verified"
  | "under_17"
  | "blacklisted"
  | "shadow_banned"
  | "banned";

export type DonorStatus = {
  kind: DonorStatusKind;
  label: string;
  description?: string;
};

export function isInDonationCooldown(
  nextEligibleDate: string | null | undefined,
  asOf: Date = new Date()
): boolean {
  if (!nextEligibleDate) return false;
  const today = asOf.toISOString().split("T")[0];
  return nextEligibleDate > today;
}

export type DonorStatusProfile = Pick<
  Profile,
  | "date_of_birth"
  | "verification_status"
  | "next_eligible_date"
  | "donation_availability"
> & {
  is_banned?: boolean;
  is_blacklisted?: boolean;
  is_shadow_banned?: boolean;
};

export function getDonorStatus(profile: DonorStatusProfile): DonorStatus {
  if (profile.is_blacklisted) {
    return {
      kind: "blacklisted",
      label: "Blacklisted",
      description: "Cannot log in or participate on the platform.",
    };
  }

  if (profile.is_banned) {
    return {
      kind: "banned",
      label: "Banned",
      description: "This account is suspended.",
    };
  }

  if (profile.is_shadow_banned) {
    return {
      kind: "shadow_banned",
      label: "Shadow banned",
      description:
        "Can use the dashboard but is hidden from search, leaderboard, and matching.",
    };
  }

  if (!isDonationAgeEligible(profile.date_of_birth)) {
    return {
      kind: "under_17",
      label: "Under 17",
      description: "Blood donation is only available for users aged 17+.",
    };
  }

  if (
    !isVerifiedDonor(profile.verification_status as VerificationStatus)
  ) {
    return {
      kind: "not_verified",
      label: "Not Verified",
      description: "Complete NID verification to appear as an available donor.",
    };
  }

  if (isInDonationCooldown(profile.next_eligible_date)) {
    return {
      kind: "cooling_down",
      label: "Cooling Down",
      description: profile.next_eligible_date
        ? `Eligible again from ${formatEligibleDate(profile.next_eligible_date)}.`
        : "In post-donation cooldown.",
    };
  }

  return {
    kind: "available",
    label: "Available",
    description: profile.donation_availability
      ? "Ready to receive blood requests."
      : "Turn on donation availability to appear in search.",
  };
}

function formatEligibleDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const DONOR_STATUS_STYLES: Record<
  DonorStatusKind,
  { badge: string; dot: string }
> = {
  available: {
    badge: "bg-green-100 text-green-800 ring-green-200",
    dot: "bg-green-500",
  },
  cooling_down: {
    badge: "bg-sky-100 text-sky-800 ring-sky-200",
    dot: "bg-sky-500",
  },
  not_verified: {
    badge: "bg-amber-100 text-amber-900 ring-amber-200",
    dot: "bg-amber-500",
  },
  under_17: {
    badge: "bg-gray-100 text-gray-700 ring-gray-200",
    dot: "bg-gray-400",
  },
  banned: {
    badge: "bg-red-100 text-red-800 ring-red-200",
    dot: "bg-red-500",
  },
  blacklisted: {
    badge: "bg-gray-900 text-white ring-gray-700",
    dot: "bg-gray-900",
  },
  shadow_banned: {
    badge: "bg-purple-100 text-purple-900 ring-purple-200",
    dot: "bg-purple-500",
  },
};
