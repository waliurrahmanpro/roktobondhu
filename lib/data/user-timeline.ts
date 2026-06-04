import { createClient } from "@/lib/supabase/server";
import type { AuditLog, AuditLogCategory } from "@/lib/types/database";

export async function fetchUserTimeline(
  userId: string,
  category?: AuditLogCategory
): Promise<AuditLog[]> {
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select("*")
    .or(`actor_id.eq.${userId},target_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching user timeline:", error);
    return [];
  }

  return data || [];
}

export async function fetchUserTimelineWithProfile(
  userId: string,
  category?: AuditLogCategory
): Promise<(AuditLog & { actor_name?: string | null })[]> {
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select(`
      *,
      profiles!audit_logs_actor_id_fkey (
        full_name
      )
    `)
    .or(`actor_id.eq.${userId},target_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching user timeline with profile:", error);
    return [];
  }

  return (
    data?.map((log) => ({
      ...log,
      actor_name: (log.profiles as any)?.full_name || null,
    })) || []
  );
}
