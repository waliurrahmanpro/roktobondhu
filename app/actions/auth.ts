"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchSiteSettings } from "@/lib/settings";
import { validateAndNormalizeLocation } from "@/lib/validate-location";
import {
  DONATION_AGE_MESSAGE,
  enforceDonationAvailability,
  isDonationAgeEligible,
} from "@/lib/eligibility";
import {
  assertPhoneAvailable,
  mapProfileSaveError,
} from "@/lib/phone-unique";
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
  const dateOfBirth = String(formData.get("date_of_birth") ?? "").trim();
  const donationRequested = formData.get("donation_availability") === "on";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (
    !fullName ||
    !bloodGroup ||
    !division ||
    !district ||
    !upazila ||
    !phone ||
    !dateOfBirth
  ) {
    return { error: "Please fill in all required profile fields." };
  }

  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime()) || dob > new Date()) {
    return { error: "Please enter a valid date of birth." };
  }

  const donationAvailability = enforceDonationAvailability(
    dateOfBirth,
    "not_submitted",
    donationRequested
  );

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

  const phoneError = await assertPhoneAvailable(phone);
  if (phoneError) {
    return { error: phoneError };
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
        date_of_birth: dateOfBirth,
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
        date_of_birth: dateOfBirth,
        donation_availability: donationAvailability,
        verification_status: "not_submitted",
      },
      { onConflict: "user_id" }
    );

    if (profileError) {
      return { error: mapProfileSaveError(profileError.message) };
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  const successMessage = !isDonationAgeEligible(dateOfBirth)
    ? `Account created. ${DONATION_AGE_MESSAGE} Check your email to confirm, then log in.`
    : "Account created. Check your email to confirm your address, then log in.";

  return { success: successMessage };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
