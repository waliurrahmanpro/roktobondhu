import { SuperAdminNav } from "@/components/super-admin/SuperAdminNav";
import { SiteSettingsForm } from "@/components/super-admin/SiteSettingsForm";
import { fetchSiteSettingsAdmin } from "@/lib/data/super-admin";
import { fetchSiteSettings } from "@/lib/settings";

export default async function SuperAdminSettingsPage() {
  const settings = (await fetchSiteSettingsAdmin()) ?? (await fetchSiteSettings());

  return (
    <>
      <SuperAdminNav currentPath="/super-admin/settings" />

      <h2 className="text-xl font-bold text-gray-900">Site settings</h2>
      <p className="mt-1 text-sm text-gray-600">
        Control registration, blood requests, and maintenance mode.
      </p>

      <div className="mt-6">
        <SiteSettingsForm settings={settings} />
      </div>
    </>
  );
}
