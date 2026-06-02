import type { BloodRequest, UrgencyLevel } from "@/lib/types/database";

export const URGENCY_SORT: Record<UrgencyLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function sortBloodRequests(requests: BloodRequest[]) {
  return [...requests].sort((a, b) => {
    const urgencyDiff =
      URGENCY_SORT[a.urgency_level] - URGENCY_SORT[b.urgency_level];
    if (urgencyDiff !== 0) return urgencyDiff;
    return (
      new Date(b.request_date).getTime() - new Date(a.request_date).getTime()
    );
  });
}

export function urgencyStyles(level: UrgencyLevel) {
  switch (level) {
    case "critical":
      return {
        badge: "bg-red-600 text-white",
        border: "border-red-300",
        dot: "bg-red-600",
      };
    case "high":
      return {
        badge: "bg-orange-500 text-white",
        border: "border-orange-200",
        dot: "bg-orange-500",
      };
    case "medium":
      return {
        badge: "bg-amber-500 text-white",
        border: "border-amber-200",
        dot: "bg-amber-500",
      };
    case "low":
      return {
        badge: "bg-gray-500 text-white",
        border: "border-gray-200",
        dot: "bg-gray-400",
      };
  }
}

export function urgencyLabel(level: UrgencyLevel) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}
