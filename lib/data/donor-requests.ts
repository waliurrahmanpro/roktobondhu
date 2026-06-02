import { createClient } from "@/lib/supabase/server";
import {
  attachProfilesToRequests,
  fetchProfilesByUserIds,
} from "@/lib/data/profiles";
import type { DonorRequest, DonorRequestWithProfiles } from "@/lib/types/database";

export async function fetchIncomingDonorRequests(
  donorUserId: string
): Promise<DonorRequestWithProfiles[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("donor_requests")
    .select("*")
    .eq("donor_id", donorUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch incoming requests:", error.message);
    return [];
  }

  const requests = (data ?? []) as DonorRequest[];
  const profileMap = await fetchProfilesByUserIds(
    requests.flatMap((r) => [r.donor_id, r.receiver_id])
  );

  return attachProfilesToRequests(requests, profileMap);
}

export async function fetchReceiverDonorRequests(
  receiverUserId: string
): Promise<DonorRequestWithProfiles[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("donor_requests")
    .select("*")
    .eq("receiver_id", receiverUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch my requests:", error.message);
    return [];
  }

  const requests = (data ?? []) as DonorRequest[];
  const profileMap = await fetchProfilesByUserIds(
    requests.flatMap((r) => [r.donor_id, r.receiver_id])
  );

  return attachProfilesToRequests(requests, profileMap);
}

export async function fetchUnreadNotificationCount(userId: string) {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.error("Failed to count notifications:", error.message);
    return 0;
  }

  return count ?? 0;
}
