import { createClient } from "@/lib/supabase/server";
import { isLoginBlocked } from "@/lib/moderation";

const SUSPENDED_MESSAGE =
  "Your account has been suspended. Contact support if you believe this is a mistake.";

export async function isProfileBanned(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("is_banned, is_blacklisted")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Ban check failed:", error.message);
    return false;
  }

  return isLoginBlocked(data ?? undefined);
}

export async function assertUserNotBanned(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("is_banned, is_blacklisted")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Ban check failed:", error.message);
    return null;
  }

  if (isLoginBlocked(data ?? undefined)) {
    return SUSPENDED_MESSAGE;
  }

  return null;
}
