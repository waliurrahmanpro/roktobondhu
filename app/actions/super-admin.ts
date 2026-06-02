"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUserSuperAdmin } from "@/lib/roles";
import type { ActionResult } from "@/app/actions/donor-requests";
import type { UserRole } from "@/lib/types/database";

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

export async function setUserRoleAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const userId = String(formData.get("user_id") ?? "").trim();
  const newRole = String(formData.get("role") ?? "").trim() as UserRole;

  if (!userId || !["user", "admin", "super_admin"].includes(newRole)) {
    return { error: "Invalid user or role." };
  }

  const { error } = await auth.supabase.rpc("set_user_role", {
    p_user_id: userId,
    p_new_role: newRole,
  });

  if (error) return { error: error.message };

  revalidatePath("/super-admin/admins");
  revalidatePath("/super-admin");
  return { success: `Role updated to ${newRole}.` };
}

export async function updateSiteSettingsAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const registrationEnabled = formData.get("registration_enabled") === "on";
  const bloodRequestEnabled = formData.get("blood_request_enabled") === "on";
  const maintenanceMode = formData.get("maintenance_mode") === "on";

  const { error } = await auth.supabase.rpc("update_site_settings", {
    p_registration_enabled: registrationEnabled,
    p_blood_request_enabled: bloodRequestEnabled,
    p_maintenance_mode: maintenanceMode,
  });

  if (error) return { error: error.message };

  revalidatePath("/super-admin/settings");
  revalidatePath("/", "layout");
  return { success: "Site settings saved." };
}

export async function createAnnouncementAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const notifyAll = formData.get("notify_all") === "on";

  if (!title || !body) {
    return { error: "Title and body are required." };
  }

  const { error } = await auth.supabase.rpc("create_announcement", {
    p_title: title,
    p_body: body,
    p_notify_all: notifyAll,
  });

  if (error) return { error: error.message };

  revalidatePath("/super-admin/announcements");
  revalidatePath("/");
  revalidatePath("/dashboard");
  return { success: "Announcement published." };
}

export async function toggleAnnouncementAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const id = String(formData.get("id") ?? "").trim();
  const isActive = formData.get("is_active") === "true";

  if (!id) return { error: "Invalid announcement." };

  const { error } = await auth.supabase
    .from("announcements")
    .update({ is_active: !isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  await auth.supabase.rpc("insert_audit_log", {
    p_action: "announcement_toggled",
    p_target_type: "announcement",
    p_target_id: id,
    p_details: { is_active: !isActive },
  });

  revalidatePath("/super-admin/announcements");
  revalidatePath("/");
  revalidatePath("/dashboard");
  return { success: "Announcement updated." };
}

export async function toggleAnnouncementFormAction(formData: FormData) {
  await toggleAnnouncementAction(null, formData);
}

export async function broadcastNotificationAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!title || !message) {
    return { error: "Title and message are required." };
  }

  const { data, error } = await auth.supabase.rpc("broadcast_notification", {
    p_title: title,
    p_message: message,
  });

  if (error) return { error: error.message };

  revalidatePath("/super-admin/announcements");
  revalidatePath("/dashboard/notifications");
  return {
    success: `Broadcast sent to ${data ?? 0} users.`,
  };
}

export async function adjustPointsAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const userId = String(formData.get("user_id") ?? "").trim();
  const delta = Number(formData.get("delta"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!userId || !Number.isFinite(delta) || delta === 0) {
    return { error: "Valid user and non-zero points change required." };
  }

  if (!reason) {
    return { error: "Reason is required." };
  }

  const { error } = await auth.supabase.rpc("adjust_user_points", {
    p_user_id: userId,
    p_delta: Math.trunc(delta),
    p_reason: reason,
  });

  if (error) return { error: error.message };

  revalidatePath("/super-admin/points");
  revalidatePath("/leaderboard");
  revalidatePath("/donor/" + userId);
  return { success: `Points adjusted by ${delta}.` };
}
