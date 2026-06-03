"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertUserNotBanned } from "@/lib/banned";
import { canManageBloodRequest } from "@/lib/blood-request-access";
import { fetchBloodRequestRaw } from "@/lib/data/blood-requests";
import { fetchSiteSettings } from "@/lib/settings";
import { validateAndNormalizeLocation } from "@/lib/validate-location";
import type { AuthActionState } from "@/app/actions/auth";
import type { BloodGroup, UrgencyLevel } from "@/lib/types/database";

const VALID_URGENCY: UrgencyLevel[] = ["critical", "high", "medium", "low"];

export type BloodRequestActionResult = {
  error?: string;
  success?: string;
} | null;

async function logBloodRequestAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  action: string,
  requestId: string,
  details: Record<string, unknown> = {}
) {
  const { error } = await supabase.rpc("log_blood_request_audit", {
    p_action: action,
    p_request_id: requestId,
    p_details: details,
  });

  if (error) {
    console.error("Audit log failed:", error.message);
  }
}

async function assertCanManageRequest(requestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in.", supabase: null, user: null, request: null };
  }

  const banError = await assertUserNotBanned(user.id);
  if (banError) {
    return { error: banError, supabase: null, user: null, request: null };
  }

  const request = await fetchBloodRequestRaw(requestId);
  if (!request) {
    return { error: "Blood request not found.", supabase: null, user: null, request: null };
  }

  if (!(await canManageBloodRequest(user.id, request))) {
    return { error: "You cannot manage this request.", supabase: null, user: null, request: null };
  }

  return { error: null, supabase, user, request };
}

function parseBloodRequestFields(formData: FormData) {
  const patientName = String(formData.get("patient_name") ?? "").trim();
  const bloodGroup = String(formData.get("blood_group") ?? "") as BloodGroup;
  const hospitalName = String(formData.get("hospital_name") ?? "").trim();
  const division = String(formData.get("division") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const upazila = String(formData.get("upazila") ?? "").trim();
  const contactNumber = String(formData.get("contact_number") ?? "").trim();
  const urgencyLevel = String(formData.get("urgency_level") ?? "") as UrgencyLevel;

  return {
    patientName,
    bloodGroup,
    hospitalName,
    division,
    district,
    upazila,
    contactNumber,
    urgencyLevel,
  };
}

function revalidateBloodRequestPaths(requestId: string) {
  revalidatePath("/");
  revalidatePath("/dashboard/requests");
  revalidatePath(`/requests/${requestId}`);
  revalidatePath(`/requests/${requestId}/edit`);
}

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

  const fields = parseBloodRequestFields(formData);
  const requestDate = String(formData.get("request_date") ?? "").trim();

  if (
    !fields.patientName ||
    !fields.bloodGroup ||
    !fields.hospitalName ||
    !fields.contactNumber ||
    !fields.urgencyLevel ||
    !requestDate
  ) {
    return { error: "Please fill in all required fields." };
  }

  const locResult = validateAndNormalizeLocation(
    fields.division,
    fields.district,
    fields.upazila
  );
  if (locResult.error || !locResult.location) {
    return { error: locResult.error ?? "Please select a valid location." };
  }

  if (!VALID_URGENCY.includes(fields.urgencyLevel)) {
    return { error: "Please select a valid urgency level." };
  }

  const { data, error } = await supabase
    .from("blood_requests")
    .insert({
      user_id: user.id,
      patient_name: fields.patientName,
      blood_group: fields.bloodGroup,
      hospital_name: fields.hospitalName,
      division: locResult.location.division,
      district: locResult.location.district,
      upazila: locResult.location.upazila,
      contact_number: fields.contactNumber,
      urgency_level: fields.urgencyLevel,
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

  revalidateBloodRequestPaths(data.id);
  redirect(`/requests/${data.id}`);
}

export async function updateBloodRequest(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const requestId = String(formData.get("request_id") ?? "").trim();
  if (!requestId) return { error: "Invalid request." };

  const auth = await assertCanManageRequest(requestId);
  if (auth.error || !auth.supabase || !auth.request) {
    return { error: auth.error ?? "Not authorized." };
  }

  if (auth.request.status === "removed") {
    return { error: "This request has been deleted." };
  }

  const fields = parseBloodRequestFields(formData);

  if (
    !fields.patientName ||
    !fields.bloodGroup ||
    !fields.hospitalName ||
    !fields.contactNumber ||
    !fields.urgencyLevel
  ) {
    return { error: "Please fill in all required fields." };
  }

  const locResult = validateAndNormalizeLocation(
    fields.division,
    fields.district,
    fields.upazila
  );
  if (locResult.error || !locResult.location) {
    return { error: locResult.error ?? "Please select a valid location." };
  }

  if (!VALID_URGENCY.includes(fields.urgencyLevel)) {
    return { error: "Please select a valid urgency level." };
  }

  const { error } = await auth.supabase
    .from("blood_requests")
    .update({
      patient_name: fields.patientName,
      blood_group: fields.bloodGroup,
      hospital_name: fields.hospitalName,
      division: locResult.location.division,
      district: locResult.location.district,
      upazila: locResult.location.upazila,
      contact_number: fields.contactNumber,
      urgency_level: fields.urgencyLevel,
    })
    .eq("id", requestId);

  if (error) {
    return { error: error.message };
  }

  await logBloodRequestAudit(auth.supabase, "Request Edited", requestId, {
    patient_name: fields.patientName,
    blood_group: fields.bloodGroup,
  });

  if (auth.request.status === "active") {
    const { error: matchError } = await auth.supabase.rpc(
      "process_blood_request_matching",
      { p_request_id: requestId }
    );
    if (matchError) {
      console.error("Matching RPC failed:", matchError.message);
    }
  }

  revalidateBloodRequestPaths(requestId);
  redirect(`/requests/${requestId}`);
}

export async function deleteBloodRequestAction(
  formData: FormData
): Promise<BloodRequestActionResult> {
  const requestId = String(formData.get("request_id") ?? "").trim();
  if (!requestId) return { error: "Invalid request." };

  const auth = await assertCanManageRequest(requestId);
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Not authorized." };
  }

  const { error } = await auth.supabase
    .from("blood_requests")
    .update({ status: "removed" })
    .eq("id", requestId);

  if (error) return { error: error.message };

  await logBloodRequestAudit(auth.supabase, "Request Deleted", requestId);

  revalidateBloodRequestPaths(requestId);
  revalidatePath("/admin/requests");
  redirect("/dashboard/requests");
}

export async function completeBloodRequestOwnerAction(
  formData: FormData
): Promise<BloodRequestActionResult> {
  const requestId = String(formData.get("request_id") ?? "").trim();
  if (!requestId) return { error: "Invalid request." };

  const auth = await assertCanManageRequest(requestId);
  if (auth.error || !auth.supabase || !auth.request) {
    return { error: auth.error ?? "Not authorized." };
  }

  if (auth.request.status !== "active") {
    return { error: "Only active requests can be marked completed." };
  }

  const { error } = await auth.supabase
    .from("blood_requests")
    .update({ status: "completed" })
    .eq("id", requestId);

  if (error) return { error: error.message };

  await logBloodRequestAudit(auth.supabase, "Request Completed", requestId);

  revalidateBloodRequestPaths(requestId);
  revalidatePath("/admin/requests");
  return { success: "Request marked as completed." };
}

export async function reopenBloodRequestAction(
  formData: FormData
): Promise<BloodRequestActionResult> {
  const requestId = String(formData.get("request_id") ?? "").trim();
  if (!requestId) return { error: "Invalid request." };

  const auth = await assertCanManageRequest(requestId);
  if (auth.error || !auth.supabase || !auth.request) {
    return { error: auth.error ?? "Not authorized." };
  }

  if (auth.request.status !== "completed") {
    return { error: "Only completed requests can be reopened." };
  }

  const settings = await fetchSiteSettings();
  if (!settings.blood_request_enabled) {
    return { error: "Posting blood requests is temporarily disabled." };
  }

  const { error } = await auth.supabase
    .from("blood_requests")
    .update({ status: "active" })
    .eq("id", requestId);

  if (error) return { error: error.message };

  await logBloodRequestAudit(auth.supabase, "Request Reopened", requestId);

  const { error: matchError } = await auth.supabase.rpc(
    "process_blood_request_matching",
    { p_request_id: requestId }
  );
  if (matchError) {
    console.error("Matching RPC failed:", matchError.message);
  }

  revalidateBloodRequestPaths(requestId);
  revalidatePath("/admin/requests");
  return { success: "Request reopened and is active again." };
}
