import type { AuditLog, AuditLogCategory } from "@/lib/types/database";
import { formatDateTime } from "@/lib/format";

type TimelineProps = {
  logs: (AuditLog & { actor_name?: string | null })[];
  currentUserId?: string;
};

const categoryColors: Record<AuditLogCategory, string> = {
  verification: "bg-purple-100 text-purple-800 border-purple-200",
  requests: "bg-blue-100 text-blue-800 border-blue-200",
  donations: "bg-green-100 text-green-800 border-green-200",
  moderation: "bg-red-100 text-red-800 border-red-200",
  points: "bg-amber-100 text-amber-800 border-amber-200",
  profile: "bg-gray-100 text-gray-800 border-gray-200",
  auth: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const categoryLabels: Record<AuditLogCategory, string> = {
  verification: "Verification",
  requests: "Requests",
  donations: "Donations",
  moderation: "Moderation",
  points: "Points",
  profile: "Profile",
  auth: "Auth",
};

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDetails(details: Record<string, unknown>): string {
  const entries: string[] = [];
  
  for (const [key, value] of Object.entries(details)) {
    if (value === null || value === undefined) continue;
    
    if (typeof value === "object") {
      const nested = formatDetails(value as Record<string, unknown>);
      if (nested) {
        entries.push(`${key}: ${nested}`);
      }
    } else {
      entries.push(`${key}: ${value}`);
    }
  }
  
  return entries.join(", ");
}

export function UserTimeline({ logs, currentUserId }: TimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
        <p className="mt-4 text-sm text-gray-500">No activity recorded for this user.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
      <div className="mt-6 space-y-6">
        {logs.map((log) => (
          <div key={log.id} className="relative pl-8">
            <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-gray-300" />
            </div>
            <div className="absolute left-2 top-7 h-full w-px bg-gray-200 last:hidden" />
            
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      {formatAction(log.action)}
                    </span>
                    {log.category && (
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${categoryColors[log.category]}`}
                      >
                        {categoryLabels[log.category]}
                      </span>
                    )}
                  </div>
                  
                  {log.actor_name && log.actor_id !== currentUserId && (
                    <p className="text-sm text-gray-600">
                      by {log.actor_name}
                    </p>
                  )}
                  
                  {log.actor_id === currentUserId && (
                    <p className="text-sm text-gray-600">
                      by you
                    </p>
                  )}
                  
                  {Object.keys(log.details).length > 0 && (
                    <p className="text-sm text-gray-500">
                      {formatDetails(log.details)}
                    </p>
                  )}
                </div>
                
                <time className="whitespace-nowrap text-xs text-gray-400">
                  {formatDateTime(log.created_at)}
                </time>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
