import { getDonorBadge } from "@/lib/badges";

type DonorBadgeLabelProps = {
  totalPoints: number;
  size?: "sm" | "md";
};

export function DonorBadgeLabel({
  totalPoints,
  size = "md",
}: DonorBadgeLabelProps) {
  const badge = getDonorBadge(totalPoints);
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${badge.bgColor} ${badge.borderColor} ${badge.color} ${sizeClass}`}
    >
      <span aria-hidden>{badge.icon}</span>
      {badge.name}
    </span>
  );
}
