"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUserSuperAdmin } from "@/lib/roles";
import type { ActionResult } from "@/app/actions/donor-requests";
import type { BroadcastTargetType, BroadcastPriority } from "@/lib/types/database";

async function assertSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isUserSuperAdmin(user.id))) {
    return { supabase: null, user: null, error: "Not authorized." as const };
  }

  return { supabase, user, error: null };
}

export async function createBroadcastAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const priority = String(formData.get("priority") ?? "").trim() as BroadcastPriority;
  const targetType = String(formData.get("target_type") ?? "").trim() as BroadcastTargetType;
  const targetValue = String(formData.get("target_value") ?? "").trim() || null;

  if (!title || !message) {
    return { error: "Title and message are required." };
  }

  if (!["normal", "urgent"].includes(priority)) {
    return { error: "Invalid priority." };
  }

  if (
    !["all_users", "all_donors", "blood_group", "division", "district"].includes(
      targetType
    )
  ) {
    return { error: "Invalid target type." };
  }

  if (
    (targetType === "blood_group" ||
      targetType === "division" ||
      targetType === "district") &&
    !targetValue
  ) {
    return { error: "Target value is required for this target type." };
  }

  const { data, error } = await auth.supabase.rpc("create_broadcast", {
    p_title: title,
    p_message: message,
    p_priority: priority,
    p_target_type: targetType,
    p_target_value: targetValue,
  });

  if (error) return { error: error.message };

  revalidatePath("/super-admin/broadcasts");
  return { success: "Broadcast created successfully." };
}

export async function sendBroadcastAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const broadcastId = String(formData.get("broadcast_id") ?? "").trim();

  if (!broadcastId) {
    return { error: "Invalid broadcast." };
  }

  const { data, error } = await auth.supabase.rpc("send_broadcast", {
    p_broadcast_id: broadcastId,
  });

  if (error) return { error: error.message };

  revalidatePath("/super-admin/broadcasts");
  return {
    success: `Broadcast sent to ${data ?? 0} recipients.`,
  };
}

export async function refreshBroadcastAnalyticsAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const { error } = await auth.supabase.rpc("refresh_broadcast_analytics");

  if (error) return { error: error.message };

  revalidatePath("/super-admin/broadcasts");
  return { success: "Analytics refreshed." };
}
