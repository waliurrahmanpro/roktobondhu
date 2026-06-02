import type { Announcement } from "@/lib/types/database";

type AnnouncementBannerProps = {
  announcements: Announcement[];
  compact?: boolean;
};

export function AnnouncementBanner({
  announcements,
  compact = false,
}: AnnouncementBannerProps) {
  if (announcements.length === 0) return null;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {announcements.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"
        >
          <p className="font-semibold">{item.title}</p>
          <p className={`mt-1 text-amber-900/90 ${compact ? "text-sm" : ""}`}>
            {item.body}
          </p>
        </div>
      ))}
    </div>
  );
}
