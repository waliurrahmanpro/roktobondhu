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

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase: null, user: null, error: "Not authorized." as const };
  }

  const { isUserAdmin } = await import("@/lib/roles");
  if (!(await isUserAdmin(user.id))) {
    return { supabase: null, user: null, error: "Not authorized." as const };
  }

  return { supabase, user, error: null };
}

function revalidateUserPaths(userId: string) {
  revalidatePath("/super-admin/users");
  revalidatePath(`/super-admin/users/${userId}`);
  revalidatePath("/super-admin/logs");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath(`/donor/${userId}`);
}

export async function setUserBlacklistedAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Not authorized." };
  }

  const userId = String(formData.get("user_id") ?? "").trim();
  const blacklisted = formData.get("blacklisted") === "true";

  if (!userId) return { error: "Invalid user." };

  const { error } = await auth.supabase.rpc("super_admin_set_user_blacklisted", {
    p_user_id: userId,
    p_blacklisted: blacklisted,
  });

  if (error) return { error: error.message };

  revalidateUserPaths(userId);
  return {
    success: blacklisted ? "User blacklisted." : "User removed from blacklist.",
  };
}

export async function setUserShadowBannedAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Not authorized." };
  }

  const userId = String(formData.get("user_id") ?? "").trim();
  const shadowBanned = formData.get("shadow_banned") === "true";

  if (!userId) return { error: "Invalid user." };

  const { error } = await auth.supabase.rpc(
    "super_admin_set_user_shadow_banned",
    {
      p_user_id: userId,
      p_shadow_banned: shadowBanned,
    }
  );

  if (error) return { error: error.message };

  revalidateUserPaths(userId);
  return {
    success: shadowBanned
      ? "User shadow banned."
      : "Shadow ban removed.",
  };
}

export async function createUserNoteAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Not authorized." };
  }

  const subjectUserId = String(formData.get("user_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!subjectUserId || !body) {
    return { error: "User and note text are required." };
  }

  const { error } = await auth.supabase.rpc("admin_create_user_note", {
    p_subject_user_id: subjectUserId,
    p_body: body,
  });

  if (error) return { error: error.message };

  revalidateUserPaths(subjectUserId);
  return { success: "Note added." };
}

export async function updateUserNoteAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Not authorized." };
  }

  const noteId = String(formData.get("note_id") ?? "").trim();
  const subjectUserId = String(formData.get("user_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!noteId || !body) {
    return { error: "Note and text are required." };
  }

  const { error } = await auth.supabase.rpc("admin_update_user_note", {
    p_note_id: noteId,
    p_body: body,
  });

  if (error) return { error: error.message };

  if (subjectUserId) revalidateUserPaths(subjectUserId);
  return { success: "Note updated." };
}

export async function deleteUserNoteAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Not authorized." };
  }

  const noteId = String(formData.get("note_id") ?? "").trim();
  const subjectUserId = String(formData.get("user_id") ?? "").trim();

  if (!noteId) return { error: "Invalid note." };

  const { error } = await auth.supabase.rpc("admin_delete_user_note", {
    p_note_id: noteId,
  });

  if (error) return { error: error.message };

  if (subjectUserId) revalidateUserPaths(subjectUserId);
  return { success: "Note deleted." };
}
