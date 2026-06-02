import { createClient } from "@/lib/supabase/server";
import { fetchProfilesByUserIds } from "@/lib/data/profiles";
import type {
  Donation,
  DonationWithProfiles,
} from "@/lib/types/database";

function attachProfilesToDonations(
  donations: Donation[],
  profileMap: Awaited<ReturnType<typeof fetchProfilesByUserIds>>
): DonationWithProfiles[] {
  return donations.map((d) => ({
    ...d,
    donor_profile: profileMap.get(d.donor_id) ?? null,
    receiver_profile: profileMap.get(d.receiver_id) ?? null,
  }));
}

export async function fetchMyDonations(
  donorUserId: string
): Promise<DonationWithProfiles[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("donations")
    .select("*")
    .eq("donor_id", donorUserId)
    .eq("feedback_status", "fine")
    .order("completed_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch my donations:", error.message);
    return [];
  }

  const donations = (data ?? []) as Donation[];
  const profileMap = await fetchProfilesByUserIds(
    donations.flatMap((d) => [d.donor_id, d.receiver_id])
  );

  return attachProfilesToDonations(donations, profileMap);
}

export async function fetchReports(
  userId: string
): Promise<DonationWithProfiles[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("donations")
    .select("*")
    .eq("feedback_status", "reported")
    .or(`receiver_id.eq.${userId},donor_id.eq.${userId}`)
    .order("completed_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch reports:", error.message);
    return [];
  }

  const donations = (data ?? []) as Donation[];
  const profileMap = await fetchProfilesByUserIds(
    donations.flatMap((d) => [d.donor_id, d.receiver_id])
  );

  return attachProfilesToDonations(donations, profileMap);
}
