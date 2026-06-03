import { normalizeBdPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

export const PHONE_ALREADY_REGISTERED =
  "This phone number is already registered.";

export function phoneUniqueKey(phone: string): string {
  return normalizeBdPhone(phone.trim());
}

export function isUniquePhoneDbError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("profiles_phone_normalized_unique") ||
    lower.includes("duplicate key") ||
    lower.includes("unique constraint")
  );
}

export function mapProfileSaveError(errorMessage: string): string {
  if (isUniquePhoneDbError(errorMessage)) {
    return PHONE_ALREADY_REGISTERED;
  }
  return errorMessage;
}

export async function assertPhoneAvailable(
  phone: string,
  excludeUserId?: string | null
): Promise<string | null> {
  const trimmed = phone.trim();
  if (!trimmed) {
    return "Phone number is required.";
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_phone_available", {
    p_phone: trimmed,
    p_exclude_user_id: excludeUserId ?? undefined,
  });

  if (error) {
    console.error("Phone availability check failed:", error.message);
    return "Could not verify phone number. Please try again.";
  }

  if (data === false) {
    return PHONE_ALREADY_REGISTERED;
  }

  return null;
}
