import {
  DONOR_STATUS_STYLES,
  getDonorStatus,
  type DonorStatusKind,
} from "@/lib/donor-status";
import type { DonorStatusProfile } from "@/lib/donor-status";

type DonorStatusLabelProps = {
  profile: DonorStatusProfile;
  size?: "sm" | "md";
  showDescription?: boolean;
};

export function DonorStatusLabel({
  profile,
  size = "sm",
  showDescription = false,
}: DonorStatusLabelProps) {
  const status = getDonorStatus(profile);
  const styles = DONOR_STATUS_STYLES[status.kind as DonorStatusKind];
  const sizeClass =
    size === "md"
      ? "px-3 py-1 text-sm"
      : "px-2.5 py-0.5 text-xs";

  return (
    <div className="inline-flex flex-col gap-1">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${styles.badge} ${sizeClass}`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} />
        {status.label}
      </span>
      {showDescription && status.description && (
        <p className="text-xs text-gray-500">{status.description}</p>
      )}
    </div>
  );
}
