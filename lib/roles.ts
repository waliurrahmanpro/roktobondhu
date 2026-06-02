import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

export function hasAdminAccess(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

export function hasSuperAdminAccess(role: UserRole | null | undefined): boolean {
  return role === "super_admin";
}

export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Role fetch failed:", error.message);
    return "user";
  }

  const role = data?.role;
  if (role === "admin" || role === "super_admin") return role;
  return "user";
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return hasAdminAccess(role);
}

export async function isUserSuperAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return hasSuperAdminAccess(role);
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const role = await getUserRole(user.id);
  if (!hasAdminAccess(role)) {
    redirect("/");
  }

  return { supabase, user, role };
}

export async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const role = await getUserRole(user.id);
  if (!hasSuperAdminAccess(role)) {
    redirect("/");
  }

  return { supabase, user, role };
}
