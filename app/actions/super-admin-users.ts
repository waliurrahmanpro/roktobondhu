"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUserSuperAdmin } from "@/lib/roles";
import type { ActionResult } from "@/app/actions/donor-requests";

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

function revalidateUserPaths(userId: string) {
  revalidatePath("/super-admin/users");
  revalidatePath(`/super-admin/users/${userId}`);
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath(`/donor/${userId}`);
  revalidatePath("/admin/users");
  revalidatePath("/super-admin/logs");
}

export async function verifyUserAction(formData: FormData): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "Invalid user." };

  const { error } = await auth.supabase.rpc("super_admin_set_user_verification", {
    p_user_id: userId,
    p_verified: true,
  });

  if (error) return { error: error.message };

  revalidateUserPaths(userId);
  return { success: "User verified." };
}

export async function unverifyUserAction(formData: FormData): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "Invalid user." };

  const { error } = await auth.supabase.rpc("super_admin_set_user_verification", {
    p_user_id: userId,
    p_verified: false,
  });

  if (error) return { error: error.message };

  revalidateUserPaths(userId);
  return { success: "User unverified." };
}

export async function banUserSuperAdminAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "Invalid user." };

  const { error } = await auth.supabase.rpc("super_admin_set_user_banned", {
    p_user_id: userId,
    p_banned: true,
  });

  if (error) return { error: error.message };

  revalidateUserPaths(userId);
  return { success: "User banned." };
}

export async function unbanUserSuperAdminAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "Invalid user." };

  const { error } = await auth.supabase.rpc("super_admin_set_user_banned", {
    p_user_id: userId,
    p_banned: false,
  });

  if (error) return { error: error.message };

  revalidateUserPaths(userId);
  return { success: "User unbanned." };
}

export async function enableDonationsAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "Invalid user." };

  const { error } = await auth.supabase.rpc(
    "super_admin_set_donation_availability",
    { p_user_id: userId, p_enabled: true }
  );

  if (error) return { error: error.message };

  revalidateUserPaths(userId);
  return { success: "Donation availability enabled." };
}

export async function disableDonationsAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "Invalid user." };

  const { error } = await auth.supabase.rpc(
    "super_admin_set_donation_availability",
    { p_user_id: userId, p_enabled: false }
  );

  if (error) return { error: error.message };

  revalidateUserPaths(userId);
  return { success: "Donation availability disabled." };
}

export async function addCooldownAction(formData: FormData): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const userId = String(formData.get("user_id") ?? "").trim();
  const days = Number(formData.get("cooldown_days") ?? 90);

  if (!userId) return { error: "Invalid user." };

  const { error } = await auth.supabase.rpc("super_admin_add_cooldown", {
    p_user_id: userId,
    p_days: Number.isFinite(days) ? Math.trunc(days) : 90,
  });

  if (error) return { error: error.message };

  revalidateUserPaths(userId);
  return { success: "Cooldown added." };
}

export async function removeCooldownAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "Invalid user." };

  const { error } = await auth.supabase.rpc("super_admin_set_cooldown", {
    p_user_id: userId,
    p_next_eligible_date: null,
  });

  if (error) return { error: error.message };

  revalidateUserPaths(userId);
  return { success: "Cooldown removed." };
}

export async function setCooldownDateAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const userId = String(formData.get("user_id") ?? "").trim();
  const date = String(formData.get("next_eligible_date") ?? "").trim();

  if (!userId || !date) {
    return { error: "User and date are required." };
  }

  const { error } = await auth.supabase.rpc("super_admin_set_cooldown", {
    p_user_id: userId,
    p_next_eligible_date: date,
  });

  if (error) return { error: error.message };

  revalidateUserPaths(userId);
  return { success: "Next eligible date updated." };
}
