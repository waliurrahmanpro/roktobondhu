import { getTrustStatus } from "@/lib/trust";

type TrustStatusLabelProps = {
  totalDonations: number;
  reportedDonations: number;
  size?: "sm" | "md";
};

export function TrustStatusLabel({
  totalDonations,
  reportedDonations,
  size = "md",
}: TrustStatusLabelProps) {
  const trust = getTrustStatus(totalDonations, reportedDonations);
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`inline-flex rounded-full border font-semibold ${trust.className} ${sizeClass}`}
    >
      {trust.label}
    </span>
  );
}
