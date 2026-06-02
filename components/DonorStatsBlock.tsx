import { DonorBadgeLabel } from "@/components/DonorBadgeLabel";
import type { Profile } from "@/lib/types/database";

type DonorStatsBlockProps = {
  donor: Pick<
    Profile,
    "total_points" | "total_donations" | "full_name" | "blood_group"
  >;
  showBloodGroup?: boolean;
};

export function DonorStatsBlock({
  donor,
  showBloodGroup = true,
}: DonorStatsBlockProps) {
  const points = donor.total_points ?? 0;
  const donations = donor.total_donations ?? 0;

  return (
    <div className="space-y-2">
      {showBloodGroup && (
        <span className="inline-block rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
          {donor.blood_group}
        </span>
      )}
      <div>
        <DonorBadgeLabel totalPoints={points} size="sm" />
      </div>
      <p className="text-sm text-gray-600">
        <span className="font-medium text-gray-900">Points:</span> {points}
      </p>
      <p className="text-sm text-gray-600">
        <span className="font-medium text-gray-900">Donations:</span>{" "}
        {donations}
      </p>
    </div>
  );
}
