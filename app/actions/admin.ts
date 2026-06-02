"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/admin";
import type { ActionResult } from "@/app/actions/donor-requests";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isUserAdmin(user.id))) {
    return { supabase: null, user: null, error: "Not authorized." as const };
  }

  return { supabase, user, error: null };
}

export async function resolveReportAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const donationId = String(formData.get("donation_id") ?? "").trim();
  if (!donationId) return { error: "Invalid donation." };

  const { error } = await auth.supabase
    .from("donations")
    .update({ report_status: "resolved" })
    .eq("id", donationId)
    .eq("feedback_status", "reported");

  if (error) return { error: error.message };

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  return { success: "Report marked as resolved." };
}

export async function dismissReportAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const donationId = String(formData.get("donation_id") ?? "").trim();
  if (!donationId) return { error: "Invalid donation." };

  const { error } = await auth.supabase
    .from("donations")
    .update({ report_status: "dismissed" })
    .eq("id", donationId)
    .eq("feedback_status", "reported");

  if (error) return { error: error.message };

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  return { success: "Report dismissed." };
}

export async function banUserAction(formData: FormData): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "Invalid user." };

  if (userId === auth.user!.id) {
    return { error: "You cannot ban yourself." };
  }

  const { error } = await auth.supabase
    .from("profiles")
    .update({ is_banned: true, donation_availability: false })
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: "User banned." };
}

export async function unbanUserAction(formData: FormData): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { error: "Invalid user." };

  const { error } = await auth.supabase
    .from("profiles")
    .update({ is_banned: false })
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: "User unbanned." };
}

export async function removeBloodRequestAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const requestId = String(formData.get("request_id") ?? "").trim();
  if (!requestId) return { error: "Invalid request." };

  const { error } = await auth.supabase
    .from("blood_requests")
    .update({ status: "removed" })
    .eq("id", requestId);

  if (error) return { error: error.message };

  revalidatePath("/admin/requests");
  revalidatePath("/");
  return { success: "Request removed from public feed." };
}

export async function completeBloodRequestAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Not authorized." };

  const requestId = String(formData.get("request_id") ?? "").trim();
  if (!requestId) return { error: "Invalid request." };

  const { error } = await auth.supabase
    .from("blood_requests")
    .update({ status: "completed" })
    .eq("id", requestId);

  if (error) return { error: error.message };

  revalidatePath("/admin/requests");
  revalidatePath("/");
  return { success: "Request marked as completed." };
}
