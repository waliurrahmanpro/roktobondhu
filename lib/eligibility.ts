import { isInDonationCooldown } from "@/lib/donor-status";
import type { Profile, VerificationStatus } from "@/lib/types/database";

export const MIN_DONOR_AGE = 17;

export const DONATION_AGE_MESSAGE =
  "Blood donation is only available for users aged 17+.";

export function calculateAge(
  dateOfBirth: string,
  asOf: Date = new Date()
): number {
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return 0;

  let age = asOf.getFullYear() - dob.getFullYear();
  const monthDiff = asOf.getMonth() - dob.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && asOf.getDate() < dob.getDate())
  ) {
    age -= 1;
  }
  return age;
}

export function isDonationAgeEligible(
  dateOfBirth: string | null | undefined
): boolean {
  if (!dateOfBirth) return false;
  return calculateAge(dateOfBirth) >= MIN_DONOR_AGE;
}

export function maxDateOfBirthForDonorAge(asOf: Date = new Date()): string {
  const d = new Date(asOf);
  d.setFullYear(d.getFullYear() - MIN_DONOR_AGE);
  return d.toISOString().split("T")[0];
}

export function canEnableDonationAvailability(
  dateOfBirth: string | null | undefined,
  verificationStatus: VerificationStatus,
  nextEligibleDate?: string | null
): boolean {
  return (
    isDonationAgeEligible(dateOfBirth) &&
    verificationStatus === "approved" &&
    !isInDonationCooldown(nextEligibleDate)
  );
}

export function isVerifiedDonor(
  verificationStatus: VerificationStatus
): boolean {
  return verificationStatus === "approved";
}

export function canAppearInDonorSearch(
  profile: Pick<
    Profile,
    | "donation_availability"
    | "is_banned"
    | "verification_status"
    | "date_of_birth"
    | "full_name"
    | "next_eligible_date"
  >
): boolean {
  if (profile.is_banned || !profile.donation_availability) return false;
  if (profile.full_name === "New Donor") return false;
  if (profile.verification_status !== "approved") return false;
  if (!isDonationAgeEligible(profile.date_of_birth)) return false;
  if (isInDonationCooldown(profile.next_eligible_date)) return false;
  return true;
}

export function enforceDonationAvailability(
  dateOfBirth: string | null | undefined,
  verificationStatus: VerificationStatus,
  requested: boolean,
  nextEligibleDate?: string | null
): boolean {
  if (!requested) return false;
  return canEnableDonationAvailability(
    dateOfBirth,
    verificationStatus,
    nextEligibleDate
  );
}
