import { SuperAdminNav } from "@/components/super-admin/SuperAdminNav";
import { AnnouncementsPanel } from "@/components/super-admin/AnnouncementsPanel";
import { fetchAnnouncementsAdmin } from "@/lib/data/super-admin";

export default async function SuperAdminAnnouncementsPage() {
  const announcements = await fetchAnnouncementsAdmin();

  return (
    <>
      <SuperAdminNav currentPath="/super-admin/announcements" />

      <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
      <p className="mt-1 text-sm text-gray-600">
        Platform-wide messages and emergency broadcasts.
      </p>

      <div className="mt-6">
        <AnnouncementsPanel announcements={announcements} />
      </div>
    </>
  );
}
