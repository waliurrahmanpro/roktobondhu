"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/app/actions/auth";
import type { BloodGroup } from "@/lib/types/database";
import {
  AVATAR_BUCKET,
  getAvatarStoragePath,
  validateAvatarFile,
} from "@/lib/storage";

async function removeUserAvatars(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: files } = await supabase.storage.from(AVATAR_BUCKET).list(userId);
  if (files?.length) {
    await supabase.storage
      .from(AVATAR_BUCKET)
      .remove(files.map((f) => `${userId}/${f.name}`));
  }
}

export async function updateProfile(
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

  const fullName = String(formData.get("full_name") ?? "").trim();
  const bloodGroup = String(formData.get("blood_group") ?? "") as BloodGroup;
  const division = String(formData.get("division") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const upazila = String(formData.get("upazila") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const lastDonationDate = String(formData.get("last_donation_date") ?? "").trim();
  const donationAvailability = formData.get("donation_availability") === "on";
  const existingUrl = String(
    formData.get("existing_profile_picture_url") ?? ""
  ).trim();
  const removePicture = formData.get("remove_profile_picture") === "true";
  const pictureFile = formData.get("profile_picture");

  if (!fullName || !bloodGroup || !division || !district || !upazila || !phone) {
    return { error: "Please fill in all required fields." };
  }

  let profilePictureUrl: string | null = existingUrl || null;

  if (pictureFile instanceof File && pictureFile.size > 0) {
    const validationError = validateAvatarFile(pictureFile);
    if (validationError) {
      return { error: validationError };
    }

    await removeUserAvatars(supabase, user.id);

    const path = getAvatarStoragePath(user.id, pictureFile.type);
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, pictureFile, {
        upsert: true,
        contentType: pictureFile.type,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(path);
    profilePictureUrl = urlData.publicUrl;
  } else if (removePicture) {
    await removeUserAvatars(supabase, user.id);
    profilePictureUrl = null;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      blood_group: bloodGroup,
      division,
      district,
      upazila,
      phone,
      last_donation_date: lastDonationDate || null,
      donation_availability: donationAvailability,
      profile_picture_url: profilePictureUrl,
    })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: "Profile saved successfully." };
}
