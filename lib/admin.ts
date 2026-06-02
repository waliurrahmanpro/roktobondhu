import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Admin check failed:", error.message);
    return false;
  }

  return Boolean(data);
}

export async function isProfileBanned(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Ban check failed:", error.message);
    return false;
  }

  return data?.is_banned ?? false;
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const admin = await isUserAdmin(user.id);
  if (!admin) {
    redirect("/");
  }

  return { supabase, user };
}
