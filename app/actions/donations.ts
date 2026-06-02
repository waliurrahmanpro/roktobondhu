"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/app/actions/donor-requests";
import type { DonationFeedbackStatus } from "@/lib/types/database";

function parseFeedbackStatus(raw: string): DonationFeedbackStatus | null {
  if (raw === "fine" || raw === "reported") return raw;
  return null;
}

export async function completeDonation(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in." };
  }

  const requestId = String(formData.get("request_id") ?? "").trim();
  const feedbackStatus = parseFeedbackStatus(
    String(formData.get("feedback_status") ?? "").trim()
  );
  const feedbackMessage = String(formData.get("feedback_message") ?? "").trim();

  if (!requestId) {
    return { error: "Invalid request." };
  }

  if (!feedbackStatus) {
    return { error: "Please select whether the donation went well." };
  }

  const { error } = await supabase.rpc("complete_donation", {
    p_request_id: requestId,
    p_feedback_status: feedbackStatus,
    p_feedback_message: feedbackMessage || null,
  });

  if (error) {
    if (error.code === "42883" || error.message.includes("complete_donation")) {
      return {
        error:
          "Donation completion is not set up yet. Run migration 007_donation_completion_points.sql in Supabase.",
      };
    }
    const msg = error.message.toLowerCase();
    if (msg.includes("already confirmed")) {
      return { error: "This donation was already confirmed." };
    }
    if (msg.includes("must be accepted")) {
      return { error: "This request must be accepted before you can confirm donation." };
    }
    if (msg.includes("not authorized") || msg.includes("requester")) {
      return { error: "You cannot confirm this donation." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/my-requests");
  revalidatePath("/dashboard/my-donations");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
  revalidatePath("/");

  return {
    success:
      feedbackStatus === "fine"
        ? "Donation confirmed. The donor earned 10 points."
        : "Report submitted. Our team will review this case.",
  };
}
