"use client";

import { useState } from "react";
import type { AuditLog, AuditLogCategory } from "@/lib/types/database";
import { UserTimeline } from "./UserTimeline";

type TimelineWithFiltersProps = {
  logs: (AuditLog & { actor_name?: string | null })[];
  currentUserId?: string;
};

const filterOptions: { value: AuditLogCategory | "all"; label: string }[] = [
  { value: "all", label: "All Activity" },
  { value: "verification", label: "Verification" },
  { value: "requests", label: "Requests" },
  { value: "donations", label: "Donations" },
  { value: "moderation", label: "Moderation" },
  { value: "points", label: "Points" },
];

export function UserTimelineWithFilters({
  logs,
  currentUserId,
}: TimelineWithFiltersProps) {
  const [selectedFilter, setSelectedFilter] = useState<AuditLogCategory | "all">(
    "all"
  );

  const filteredLogs =
    selectedFilter === "all"
      ? logs
      : logs.filter((log) => log.category === selectedFilter);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedFilter(option.value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                selectedFilter === option.value
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">
          {selectedFilter === "all"
            ? "No activity recorded for this user."
            : `No ${filterOptions.find((o) => o.value === selectedFilter)?.label.toLowerCase()} activity recorded.`}
        </p>
      ) : (
        <div className="mt-6">
          <UserTimeline logs={filteredLogs} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
}
