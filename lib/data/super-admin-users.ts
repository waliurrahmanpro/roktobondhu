import { createClient } from "@/lib/supabase/server";
import { isInDonationCooldown } from "@/lib/donor-status";
import { getNidSignedUrl } from "@/lib/nid-url";
import type { Profile, VerificationStatus } from "@/lib/types/database";

export type SuperAdminUserListItem = Pick<
  Profile,
  | "user_id"
  | "full_name"
  | "blood_group"
  | "phone"
  | "role"
  | "verification_status"
  | "is_banned"
  | "is_blacklisted"
  | "is_shadow_banned"
  | "donation_availability"
>;

export type SuperAdminUserDetail = Profile & {
  inCooldown: boolean;
  nidFrontSignedUrl: string | null;
  nidBackSignedUrl: string | null;
};

export function formatNidStatus(profile: Pick<Profile, "verification_status" | "nid_front_url" | "nid_back_url">): string {
  const status = profile.verification_status as VerificationStatus;
  const hasFront = Boolean(profile.nid_front_url);
  const hasBack = Boolean(profile.nid_back_url);

  if (status === "approved") return "Verified (approved)";
  if (status === "pending") {
    return hasFront && hasBack
      ? "Pending review (documents uploaded)"
      : "Pending (incomplete documents)";
  }
  if (status === "rejected") return "Rejected — re-upload required";
  if (hasFront || hasBack) return "Documents on file (not submitted)";
  return "Not submitted";
}

export async function fetchSuperAdminUserList(): Promise<SuperAdminUserListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "user_id, full_name, blood_group, phone, role, verification_status, is_banned, is_blacklisted, is_shadow_banned, donation_availability"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Super admin user list failed:", error.message);
    return [];
  }

  return (data ?? []) as SuperAdminUserListItem[];
}

export async function fetchSuperAdminUserDetail(
  userId: string
): Promise<SuperAdminUserDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Super admin user detail failed:", error.message);
    return null;
  }

  if (!data) return null;

  const profile = data as Profile;
  const [nidFrontSignedUrl, nidBackSignedUrl] = await Promise.all([
    getNidSignedUrl(profile.nid_front_url),
    getNidSignedUrl(profile.nid_back_url),
  ]);

  return {
    ...profile,
    inCooldown: isInDonationCooldown(profile.next_eligible_date),
    nidFrontSignedUrl,
    nidBackSignedUrl,
  };
}
