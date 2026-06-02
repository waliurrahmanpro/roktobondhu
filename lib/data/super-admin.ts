import { createClient } from "@/lib/supabase/server";
import type {
  Announcement,
  AuditLog,
  PointTransaction,
  Profile,
  SiteSettings,
} from "@/lib/types/database";

export type SuperAdminStats = {
  totalUsers: number;
  totalDonors: number;
  totalDonations: number;
  totalBloodRequests: number;
  totalReports: number;
  totalAdmins: number;
};

export async function fetchSuperAdminStats(): Promise<SuperAdminStats> {
  const supabase = await createClient();

  const [
    usersRes,
    donorsRes,
    donationsRes,
    requestsRes,
    reportsRes,
    adminsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("donation_availability", true),
    supabase.from("donations").select("*", { count: "exact", head: true }),
    supabase.from("blood_requests").select("*", { count: "exact", head: true }),
    supabase
      .from("donations")
      .select("*", { count: "exact", head: true })
      .eq("feedback_status", "reported"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", ["admin", "super_admin"]),
  ]);

  return {
    totalUsers: usersRes.count ?? 0,
    totalDonors: donorsRes.count ?? 0,
    totalDonations: donationsRes.count ?? 0,
    totalBloodRequests: requestsRes.count ?? 0,
    totalReports: reportsRes.count ?? 0,
    totalAdmins: adminsRes.count ?? 0,
  };
}

export async function fetchStaffProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "super_admin", "user"])
    .order("full_name", { ascending: true })
    .limit(500);

  if (error) {
    console.error("Staff profiles fetch failed:", error.message);
    return [];
  }

  return (data ?? []) as Profile[];
}

export async function fetchAdminStaff(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "super_admin"])
    .order("role", { ascending: false });

  if (error) {
    console.error("Admin staff fetch failed:", error.message);
    return [];
  }

  return (data ?? []) as Profile[];
}

export async function fetchSiteSettingsAdmin(): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();

  if (error) {
    console.error("Settings fetch failed:", error.message);
    return null;
  }

  return data as SiteSettings;
}

export async function fetchAnnouncementsAdmin(): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Announcements fetch failed:", error.message);
    return [];
  }

  return (data ?? []) as Announcement[];
}

export async function fetchActiveAnnouncements(): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Active announcements fetch failed:", error.message);
    return [];
  }

  return (data ?? []) as Announcement[];
}

export async function fetchPointTransactions(
  limit = 100
): Promise<PointTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("point_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Point transactions fetch failed:", error.message);
    return [];
  }

  return (data ?? []) as PointTransaction[];
}

export async function fetchAuditLogs(limit = 200): Promise<AuditLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Audit logs fetch failed:", error.message);
    return [];
  }

  return (data ?? []) as AuditLog[];
}

export async function lookupProfileByUserId(
  userId: string
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Profile lookup failed:", error.message);
    return null;
  }

  return (data as Profile) ?? null;
}
