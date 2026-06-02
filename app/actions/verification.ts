"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/app/actions/auth";
import { isDonationAgeEligible } from "@/lib/eligibility";
import {
  NID_BUCKET,
  getNidStoragePath,
  validateNidFile,
} from "@/lib/nid-storage";

export async function submitNidVerification(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("date_of_birth, verification_status")
    .eq("user_id", user.id)
    .single();

  if (!profile?.date_of_birth) {
    return { error: "Please add your date of birth before submitting NID." };
  }

  if (!isDonationAgeEligible(profile.date_of_birth)) {
    return {
      error: "NID verification is only required for donors aged 17 and above.",
    };
  }

  if (profile.verification_status === "pending") {
    return { error: "Your documents are already under review." };
  }

  if (profile.verification_status === "approved") {
    return { error: "You are already verified." };
  }

  const frontFile = formData.get("nid_front");
  const backFile = formData.get("nid_back");

  if (!(frontFile instanceof File) || frontFile.size === 0) {
    return { error: "Please upload the front of your NID." };
  }

  if (!(backFile instanceof File) || backFile.size === 0) {
    return { error: "Please upload the back of your NID." };
  }

  const frontError = validateNidFile(frontFile);
  if (frontError) return { error: frontError };

  const backError = validateNidFile(backFile);
  if (backError) return { error: backError };

  const frontPath = getNidStoragePath(user.id, "front", frontFile.type);
  const backPath = getNidStoragePath(user.id, "back", backFile.type);

  const { error: frontUploadError } = await supabase.storage
    .from(NID_BUCKET)
    .upload(frontPath, frontFile, { upsert: true, contentType: frontFile.type });

  if (frontUploadError) {
    return { error: frontUploadError.message };
  }

  const { error: backUploadError } = await supabase.storage
    .from(NID_BUCKET)
    .upload(backPath, backFile, { upsert: true, contentType: backFile.type });

  if (backUploadError) {
    return { error: backUploadError.message };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      nid_front_url: frontPath,
      nid_back_url: backPath,
      verification_status: "pending",
    })
    .eq("user_id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/dashboard");
  return {
    success: "NID submitted. An admin will review your documents shortly.",
  };
}
