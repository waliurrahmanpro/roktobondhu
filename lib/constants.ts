export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export const URGENCY_LEVELS = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

export { BANGLADESH_DIVISIONS as DIVISIONS } from "@/lib/bangladesh-locations";

export const POINTS_PER_DONATION = 10;

export const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100";

export const labelClassName = "mb-1.5 block text-sm font-medium text-gray-700";

export const buttonPrimaryClassName =
  "w-full rounded-xl bg-red-600 py-3.5 font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60";
