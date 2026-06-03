import { createClient } from "@/lib/supabase/server";
import { canViewBloodRequest } from "@/lib/blood-request-access";
import { isUserAdmin } from "@/lib/roles";
import type { BloodRequest } from "@/lib/types/database";

export async function fetchBloodRequestRaw(
  id: string
): Promise<BloodRequest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch blood request:", error.message);
    return null;
  }

  return (data as BloodRequest) ?? null;
}

/** Active requests only (public feed, matching). */
export async function fetchActiveBloodRequestById(
  id: string
): Promise<BloodRequest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch active blood request:", error.message);
    return null;
  }

  return (data as BloodRequest) ?? null;
}

/** Owner/admin can view completed; public sees active only. */
export async function fetchBloodRequestForViewer(
  id: string,
  viewerUserId: string | null
): Promise<BloodRequest | null> {
  const request = await fetchBloodRequestRaw(id);
  if (!request) return null;

  const viewerIsAdmin = viewerUserId
    ? await isUserAdmin(viewerUserId)
    : false;

  if (!canViewBloodRequest(request, viewerUserId, viewerIsAdmin)) {
    return null;
  }

  return request;
}
