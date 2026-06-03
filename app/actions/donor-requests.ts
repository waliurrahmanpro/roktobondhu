"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertUserNotBanned } from "@/lib/banned";
import { canAppearInDonorSearch } from "@/lib/eligibility";
import type { DonorRequestStatus } from "@/lib/types/database";

export type ActionResult = {
  error?: string;
  success?: string;
} | null;

/** Donor-to-donor request only — never creates a public blood_requests post */
export async function createDonorRequest(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in to request blood from a donor." };
  }

  const banError = await assertUserNotBanned(user.id);
  if (banError) return { error: banError };

  const donorId = String(formData.get("donor_id") ?? "").trim();

  if (!donorId) {
    return { error: "Invalid donor." };
  }

  if (donorId === user.id) {
    return { error: "You cannot request blood from yourself." };
  }

  const { data: donorProfile } = await supabase
    .from("profiles")
    .select(
      "user_id, donation_availability, full_name, is_banned, verification_status, date_of_birth, next_eligible_date"
    )
    .eq("user_id", donorId)
    .single();

  if (!donorProfile) {
    return {
      error:
        "Donor profile not found. Ask them to complete their profile first.",
    };
  }

  if (donorProfile.is_banned) {
    return { error: "This donor is not available." };
  }

  if (!canAppearInDonorSearch(donorProfile)) {
    return { error: "This donor is not available right now." };
  }

  const { data: existing } = await supabase
    .from("donor_requests")
    .select("id")
    .eq("donor_id", donorId)
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return { error: "You already have a pending request with this donor." };
  }

  const { error } = await supabase.from("donor_requests").insert({
    donor_id: donorId,
    receiver_id: user.id,
    status: "pending",
  });

  if (error) {
    if (error.code === "42P01") {
      return {
        error:
          "Donor requests are not set up yet. Run migration 005_donor_requests_notifications.sql in Supabase.",
      };
    }
    if (error.code === "23505") {
      return { error: "You already have a pending request with this donor." };
    }
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/my-requests");
  revalidatePath("/dashboard/incoming");

  return {
    success: `Request sent to ${donorProfile.full_name}. Track status under My Requests.`,
  };
}

/** Callable from client button (no form navigation) */
export async function submitDonorRequest(
  formData: FormData
): Promise<ActionResult> {
  return createDonorRequest(null, formData);
}

async function updateRequestStatus(
  requestId: string,
  status: DonorRequestStatus
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in." };
  }

  const banError = await assertUserNotBanned(user.id);
  if (banError) return { error: banError };

  const { data: request, error: fetchError } = await supabase
    .from("donor_requests")
    .select("id, donor_id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return { error: "Request not found." };
  }

  if (request.donor_id !== user.id) {
    return { error: "You are not allowed to update this request." };
  }

  if (request.status !== "pending") {
    return { error: "This request has already been responded to." };
  }

  const { error } = await supabase
    .from("donor_requests")
    .update({ status })
    .eq("id", requestId)
    .eq("donor_id", user.id)
    .eq("status", "pending");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/incoming");
  revalidatePath("/dashboard/my-requests");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");

  return {
    success:
      status === "accepted"
        ? "Request accepted. The requester has been notified."
        : "Request rejected. The requester has been notified.",
  };
}

export async function acceptDonorRequest(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const requestId = String(formData.get("request_id") ?? "").trim();
  if (!requestId) return { error: "Invalid request." };
  return updateRequestStatus(requestId, "accepted");
}

export async function rejectDonorRequest(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const requestId = String(formData.get("request_id") ?? "").trim();
  if (!requestId) return { error: "Invalid request." };
  return updateRequestStatus(requestId, "rejected");
}

export async function acceptDonorRequestAction(formData: FormData) {
  await acceptDonorRequest(null, formData);
}

export async function rejectDonorRequestAction(formData: FormData) {
  await rejectDonorRequest(null, formData);
}
