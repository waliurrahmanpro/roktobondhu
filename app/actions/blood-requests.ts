"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertUserNotBanned } from "@/lib/banned";
import { fetchSiteSettings } from "@/lib/settings";
import { validateAndNormalizeLocation } from "@/lib/validate-location";
import type { AuthActionState } from "@/app/actions/auth";
import type { BloodGroup, UrgencyLevel } from "@/lib/types/database";

const VALID_URGENCY: UrgencyLevel[] = ["critical", "high", "medium", "low"];

export async function createBloodRequest(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/requests");
  }

  const banError = await assertUserNotBanned(user.id);
  if (banError) {
    return { error: banError };
  }

  const settings = await fetchSiteSettings();
  if (!settings.blood_request_enabled) {
    return { error: "Posting blood requests is temporarily disabled." };
  }

  const patientName = String(formData.get("patient_name") ?? "").trim();
  const bloodGroup = String(formData.get("blood_group") ?? "") as BloodGroup;
  const hospitalName = String(formData.get("hospital_name") ?? "").trim();
  const division = String(formData.get("division") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const upazila = String(formData.get("upazila") ?? "").trim();
  const contactNumber = String(formData.get("contact_number") ?? "").trim();
  const urgencyLevel = String(formData.get("urgency_level") ?? "") as UrgencyLevel;
  const requestDate = String(formData.get("request_date") ?? "").trim();

  if (
    !patientName ||
    !bloodGroup ||
    !hospitalName ||
    !contactNumber ||
    !urgencyLevel ||
    !requestDate
  ) {
    return { error: "Please fill in all required fields." };
  }

  const locResult = validateAndNormalizeLocation(division, district, upazila);
  if (locResult.error || !locResult.location) {
    return { error: locResult.error ?? "Please select a valid location." };
  }

  if (!VALID_URGENCY.includes(urgencyLevel)) {
    return { error: "Please select a valid urgency level." };
  }

  const { data, error } = await supabase
    .from("blood_requests")
    .insert({
      user_id: user.id,
      patient_name: patientName,
      blood_group: bloodGroup,
      hospital_name: hospitalName,
      division: locResult.location.division,
      district: locResult.location.district,
      upazila: locResult.location.upazila,
      contact_number: contactNumber,
      urgency_level: urgencyLevel,
      request_date: requestDate,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create blood request." };
  }

  const { error: matchError } = await supabase.rpc("process_blood_request_matching", {
    p_request_id: data.id,
  });

  if (matchError) {
    console.error("Matching RPC failed:", matchError.message);
  }

  revalidatePath("/");
  revalidatePath("/dashboard/requests");
  revalidatePath(`/requests/${data.id}`);
  redirect(`/requests/${data.id}`);
}
