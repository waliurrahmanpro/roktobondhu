import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types/database";

export async function fetchUserNotifications(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to fetch notifications:", error.message);
    return [] as Notification[];
  }

  return (data ?? []) as Notification[];
}
