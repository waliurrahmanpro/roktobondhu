import type { DonorRequestStatus } from "@/lib/types/database";

export function statusLabel(status: DonorRequestStatus) {
  switch (status) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    case "completed":
      return "Completed";
    case "reported":
      return "Reported";
  }
}

export function statusStyles(status: DonorRequestStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "accepted":
      return "bg-green-50 text-green-800 border-green-200";
    case "rejected":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "completed":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "reported":
      return "bg-red-50 text-red-800 border-red-200";
  }
}
