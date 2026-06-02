import { createClient } from "@/lib/supabase/server";
import { sortBloodRequests } from "@/lib/blood-requests";

export async function fetchPublicBloodRequests(limit = 50) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch blood requests:", error.message);
    return [];
  }

  return sortBloodRequests(data ?? []);
}
