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
    .select("*")
    .or(`actor_id.eq.${userId},target_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  console.log("Timeline query for userId:", userId);
  console.log("Query error:", error);
  console.log("Query data length:", data?.length);
  console.log("Query data:", data);

  if (error) {
    console.error("Error fetching user timeline with profile:", error);
    return [];
  }

  if (!data || data.length === 0) {
    console.log("No data returned from timeline query");
    return [];
  }

  // Fetch actor names separately
  const actorIds = [...new Set(data.map((log) => log.actor_id).filter((id): id is string => id !== null))];
  
  const { data: actorProfiles } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", actorIds);

  const actorNameMap = new Map(
    (actorProfiles || []).map((p) => [p.user_id, p.full_name])
  );

  const result = data.map((log) => ({
    ...log,
    actor_name: log.actor_id ? actorNameMap.get(log.actor_id) || null : null,
  }));

  console.log("Final timeline result length:", result.length);
  return result;
}
