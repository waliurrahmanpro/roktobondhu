import { createClient } from "@/lib/supabase/server";

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

export async function assertUserNotBanned(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Ban check failed:", error.message);
    return null;
  }

  if (data?.is_banned) {
    return "Your account has been suspended. Contact support if you believe this is a mistake.";
  }

  return null;
}
