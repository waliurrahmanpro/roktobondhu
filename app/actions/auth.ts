"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchSiteSettings } from "@/lib/settings";
import { validateAndNormalizeLocation } from "@/lib/validate-location";
import type { BloodGroup } from "@/lib/types/database";

export type AuthActionState = {
  error?: string;
  success?: string;
} | null;

export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.is_banned) {
      await supabase.auth.signOut();
      return {
        error:
          "Your account has been suspended. Contact support if you believe this is a mistake.",
      };
    }
  }

  revalidatePath("/", "layout");

  const redirectTo = String(formData.get("redirect") ?? "").trim();
  const safeRedirect =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  redirect(safeRedirect);
}

export async function register(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const bloodGroup = String(formData.get("blood_group") ?? "") as BloodGroup;
  const division = String(formData.get("division") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const upazila = String(formData.get("upazila") ?? "").trim();
  const fullAddress = String(formData.get("full_address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const lastDonationDate = String(formData.get("last_donation_date") ?? "").trim();
  const donationAvailability = formData.get("donation_availability") === "on";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (!fullName || !bloodGroup || !division || !district || !upazila || !phone) {
    return { error: "Please fill in all required profile fields." };
  }

  const locationCheck = validateAndNormalizeLocation(
    division,
    district,
    upazila
  );
  if (locationCheck.error || !locationCheck.location) {
    return { error: locationCheck.error ?? "Invalid location." };
  }

  const settings = await fetchSiteSettings();
  if (!settings.registration_enabled) {
    return { error: "New registrations are currently closed." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        blood_group: bloodGroup,
        division: locationCheck.location.division,
        district: locationCheck.location.district,
        upazila: locationCheck.location.upazila,
        full_address: fullAddress || null,
        phone,
        phone_number: phone,
        last_donation_date: lastDonationDate || null,
        donation_availability: donationAvailability,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session && data.user) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: data.user.id,
        full_name: fullName,
        blood_group: bloodGroup,
        division: locationCheck.location.division,
        district: locationCheck.location.district,
        upazila: locationCheck.location.upazila,
        full_address: fullAddress || null,
        phone,
        last_donation_date: lastDonationDate || null,
        donation_availability: donationAvailability,
      },
      { onConflict: "user_id" }
    );

    if (profileError) {
      return { error: profileError.message };
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return {
    success:
      "Account created. Check your email to confirm your address, then log in.",
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
