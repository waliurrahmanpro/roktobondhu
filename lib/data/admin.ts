import { createClient } from "@/lib/supabase/server";
import { fetchProfilesByUserIds } from "@/lib/data/profiles";
import { calculateAge } from "@/lib/eligibility";
import { getNidSignedUrl } from "@/lib/nid-url";
import { formatPhoneDisplay } from "@/lib/phone";
import { phoneUniqueKey } from "@/lib/phone-unique";
import type {
  BloodRequest,
  BloodRequestStatus,
  Donation,
  DonationReportStatus,
  Profile,
} from "@/lib/types/database";

export type AdminStats = {
  totalUsers: number;
  activeDonors: number;
  totalBloodRequests: number;
  totalDonations: number;
  totalReports: number;
  totalMatchesGenerated: number;
  acceptedMatches: number;
  successfulDonationsFromMatches: number;
};

export type ReportedDonationRow = Donation & {
  donor_profile: { full_name: string } | null;
  receiver_profile: { full_name: string } | null;
};

export type AdminActivityItem = {
  id: string;
  type: "user" | "donation" | "report" | "blood_request";
  title: string;
  subtitle: string;
  at: string;
};

export type MonthlyCount = { month: string; count: number };
export type LabelCount = { label: string; count: number };

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return months;
}

function aggregateByMonth(
  dates: string[],
  monthLabels: string[]
): MonthlyCount[] {
  const map = new Map(monthLabels.map((m) => [m, 0]));
  for (const iso of dates) {
    const key = monthKey(iso);
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return monthLabels.map((month) => ({
    month,
    count: map.get(month) ?? 0,
  }));
}

function aggregateLabels(
  items: { label: string }[]
): LabelCount[] {
  const map = new Map<string, number>();
  for (const { label } of items) {
    const key = label.trim() || "Unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();

  const [
    usersRes,
    donorsRes,
    requestsRes,
    donationsRes,
    reportsRes,
    matchesRes,
    acceptedRes,
    donatedRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("donation_availability", true)
      .eq("is_banned", false)
      .eq("is_blacklisted", false)
      .eq("is_shadow_banned", false)
      .eq("verification_status", "approved")
      .not("date_of_birth", "is", null)
      .or(
        `next_eligible_date.is.null,next_eligible_date.lte.${new Date().toISOString().split("T")[0]}`
      ),
    supabase.from("blood_requests").select("*", { count: "exact", head: true }),
    supabase.from("donations").select("*", { count: "exact", head: true }),
    supabase
      .from("donations")
      .select("*", { count: "exact", head: true })
      .eq("feedback_status", "reported"),
    supabase.from("match_logs").select("*", { count: "exact", head: true }),
    supabase
      .from("match_logs")
      .select("*", { count: "exact", head: true })
      .not("accepted_at", "is", null),
    supabase
      .from("match_logs")
      .select("*", { count: "exact", head: true })
      .not("donation_completed_at", "is", null),
  ]);

  return {
    totalUsers: usersRes.count ?? 0,
    activeDonors: donorsRes.count ?? 0,
    totalBloodRequests: requestsRes.count ?? 0,
    totalDonations: donationsRes.count ?? 0,
    totalReports: reportsRes.count ?? 0,
    totalMatchesGenerated: matchesRes.count ?? 0,
    acceptedMatches: acceptedRes.count ?? 0,
    successfulDonationsFromMatches: donatedRes.count ?? 0, // completed donations from matches
  };
}

export async function fetchAdminRecentActivity(
  limit = 12
): Promise<AdminActivityItem[]> {
  const supabase = await createClient();

  const [profiles, donations, reports, bloodRequests] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("donations")
      .select("id, completed_at, feedback_status")
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("donations")
      .select("id, completed_at, feedback_message")
      .eq("feedback_status", "reported")
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("blood_requests")
      .select("id, patient_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const items: AdminActivityItem[] = [];

  for (const p of profiles.data ?? []) {
    items.push({
      id: `user-${p.id}`,
      type: "user",
      title: `New user: ${p.full_name}`,
      subtitle: "Registration",
      at: p.created_at,
    });
  }

  for (const d of donations.data ?? []) {
    if (d.feedback_status === "fine") {
      items.push({
        id: `donation-${d.id}`,
        type: "donation",
        title: "Donation confirmed",
        subtitle: "Points awarded",
        at: d.completed_at,
      });
    }
  }

  for (const r of reports.data ?? []) {
    items.push({
      id: `report-${r.id}`,
      type: "report",
      title: "New report submitted",
      subtitle: r.feedback_message?.slice(0, 60) ?? "No message",
      at: r.completed_at,
    });
  }

  for (const b of bloodRequests.data ?? []) {
    items.push({
      id: `br-${b.id}`,
      type: "blood_request",
      title: `Blood request: ${b.patient_name}`,
      subtitle: "Public post",
      at: b.created_at,
    });
  }

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

export async function fetchAdminReportedDonations(): Promise<
  ReportedDonationRow[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("donations")
    .select("*")
    .eq("feedback_status", "reported")
    .order("completed_at", { ascending: false });

  if (error) {
    console.error("Admin reports fetch failed:", error.message);
    return [];
  }

  const donations = (data ?? []) as Donation[];
  const profileMap = await fetchProfilesByUserIds(
    donations.flatMap((d) => [d.donor_id, d.receiver_id])
  );

  return donations.map((d) => ({
    ...d,
    donor_profile: profileMap.get(d.donor_id)
      ? { full_name: profileMap.get(d.donor_id)!.full_name }
      : null,
    receiver_profile: profileMap.get(d.receiver_id)
      ? { full_name: profileMap.get(d.receiver_id)!.full_name }
      : null,
  }));
}

export async function fetchAdminUsers(): Promise<Profile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Admin users fetch failed:", error.message);
    return [];
  }

  return (data ?? []) as Profile[];
}

export async function fetchAdminBloodRequests(): Promise<BloodRequest[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blood_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Admin blood requests fetch failed:", error.message);
    return [];
  }

  return (data ?? []) as BloodRequest[];
}

export type AdminAnalytics = {
  donationsByMonth: MonthlyCount[];
  usersByMonth: MonthlyCount[];
  topBloodGroups: LabelCount[];
  topDistricts: LabelCount[];
};

export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  const supabase = await createClient();
  const months = lastMonths(6);

  const [donationsRes, profilesRes, requestsRes] = await Promise.all([
    supabase
      .from("donations")
      .select("completed_at")
      .gte(
        "completed_at",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth() - 5,
          1
        ).toISOString()
      ),
    supabase
      .from("profiles")
      .select("created_at")
      .gte(
        "created_at",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth() - 5,
          1
        ).toISOString()
      ),
    supabase.from("blood_requests").select("blood_group, district, status"),
  ]);

  const donationDates = (donationsRes.data ?? []).map((d) => d.completed_at);
  const userDates = (profilesRes.data ?? []).map((p) => p.created_at);
  const activeRequests = (requestsRes.data ?? []).filter(
    (r) => r.status !== "removed"
  );

  return {
    donationsByMonth: aggregateByMonth(donationDates, months),
    usersByMonth: aggregateByMonth(userDates, months),
    topBloodGroups: aggregateLabels(
      activeRequests.map((r) => ({ label: r.blood_group }))
    ),
    topDistricts: aggregateLabels(
      activeRequests.map((r) => ({ label: r.district }))
    ),
  };
}

export function formatReportStatus(
  status: DonationReportStatus | null | undefined
): string {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatBloodRequestStatus(status: BloodRequestStatus): string {
  if (status === "removed") return "Removed";
  if (status === "completed") return "Completed";
  return "Active";
}

export type PendingVerificationRow = Profile & {
  age: number | null;
  nidFrontSignedUrl: string | null;
  nidBackSignedUrl: string | null;
};

export type DuplicatePhoneUser = {
  user_id: string;
  full_name: string;
  phone: string;
};

export type DuplicatePhoneGroup = {
  phoneNormalized: string;
  phoneDisplay: string;
  users: DuplicatePhoneUser[];
};

/** Existing duplicate phones — report only, no automatic changes. */
export async function fetchDuplicatePhoneAccounts(): Promise<
  DuplicatePhoneGroup[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, phone")
    .not("phone", "is", null)
    .neq("phone", "");

  if (error) {
    console.error("Duplicate phone report failed:", error.message);
    return [];
  }

  const groups = new Map<string, DuplicatePhoneUser[]>();

  for (const row of data ?? []) {
    const key = phoneUniqueKey(row.phone);
    if (!key) continue;

    const list = groups.get(key) ?? [];
    list.push({
      user_id: row.user_id,
      full_name: row.full_name,
      phone: row.phone,
    });
    groups.set(key, list);
  }

  return [...groups.entries()]
    .filter(([, users]) => users.length > 1)
    .map(([phoneNormalized, users]) => ({
      phoneNormalized,
      phoneDisplay: formatPhoneDisplay(users[0].phone),
      users: users.sort((a, b) => a.full_name.localeCompare(b.full_name)),
    }))
    .sort((a, b) => b.users.length - a.users.length);
}

export async function fetchPendingVerifications(): Promise<
  PendingVerificationRow[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("verification_status", "pending")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Pending verifications fetch failed:", error.message);
    return [];
  }

  const rows = await Promise.all(
    (data ?? []).map(async (profile) => {
      const p = profile as Profile;
      const [nidFrontSignedUrl, nidBackSignedUrl] = await Promise.all([
        getNidSignedUrl(p.nid_front_url),
        getNidSignedUrl(p.nid_back_url),
      ]);
      return {
        ...p,
        age: p.date_of_birth ? calculateAge(p.date_of_birth) : null,
        nidFrontSignedUrl,
        nidBackSignedUrl,
      };
    })
  );

  return rows;
}
