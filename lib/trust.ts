export type TrustStatusKind = "trusted" | "new" | "under_review";

export type TrustStatus = {
  kind: TrustStatusKind;
  label: string;
  className: string;
};

export function getTrustStatus(
  totalDonations: number,
  reportedDonations: number
): TrustStatus {
  if (reportedDonations > 0) {
    return {
      kind: "under_review",
      label: "Under Review ⚠️",
      className: "bg-amber-100 text-amber-900 border-amber-300",
    };
  }
  if (totalDonations >= 3) {
    return {
      kind: "trusted",
      label: "Trusted Donor ✅",
      className: "bg-green-100 text-green-900 border-green-300",
    };
  }
  return {
    kind: "new",
    label: "New Donor",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  };
}
