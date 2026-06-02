import type { VerificationStatus } from "@/lib/types/database";
import { isVerifiedDonor } from "@/lib/eligibility";

type VerifiedDonorBadgeProps = {
  verificationStatus: VerificationStatus;
  className?: string;
  compact?: boolean;
};

export function VerifiedDonorBadge({
  verificationStatus,
  className = "",
  compact = false,
}: VerifiedDonorBadgeProps) {
  if (!isVerifiedDonor(verificationStatus)) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-blue-200 ${className}`}
    >
      <span aria-hidden>✓</span>
      {compact ? "Verified" : "Verified Donor"}
    </span>
  );
}
