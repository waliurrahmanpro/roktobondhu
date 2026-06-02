import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/types/database";

const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  registration_enabled: true,
  blood_request_enabled: true,
  maintenance_mode: false,
  updated_at: new Date().toISOString(),
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("Site settings fetch failed:", error.message);
    }
    return DEFAULT_SETTINGS;
  }

  return data as SiteSettings;
}
