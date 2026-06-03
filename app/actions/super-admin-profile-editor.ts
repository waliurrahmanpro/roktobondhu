"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUserSuperAdmin } from "@/lib/roles";
import {
  assertPhoneAvailable,
  mapProfileSaveError,
} from "@/lib/phone-unique";
import {
  AVATAR_BUCKET,
  getAvatarStoragePath,
  validateAvatarFile,
} from "@/lib/storage";
import { validateAndNormalizeLocation } from "@/lib/validate-location";
import type { ActionResult } from "@/app/actions/donor-requests";
import type {
  BloodGroup,
  Profile,
  VerificationStatus,
} from "@/lib/types/database";

const VERIFICATION_STATUSES: VerificationStatus[] = [
  "not_submitted",
  "pending",
  "approved",
  "rejected",
];

async function assertSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isUserSuperAdmin(user.id))) {
    return { supabase: null, user: null, error: "Not authorized." as const };
  }

  return { supabase, user, error: null };
}

function revalidateUserPaths(userId: string) {
  revalidatePath("/super-admin/users");
  revalidatePath(`/super-admin/users/${userId}`);
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath(`/donor/${userId}`);
  revalidatePath("/admin/users");
  revalidatePath("/super-admin/logs");
}

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

function auditDetails(
  superAdminId: string,
  oldValue: unknown,
  newValue: unknown,
  field?: string
) {
  return {
    ...(field ? { field } : {}),
    old_value: oldValue,
    new_value: newValue,
    super_admin_id: superAdminId,
  };
}

async function logSuperAdminAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  action: string,
  targetUserId: string,
  details: Record<string, unknown>
) {
  const { error } = await supabase.rpc("super_admin_log_user_action", {
    p_action: action,
    p_user_id: targetUserId,
    p_details: details,
  });
  if (error) {
    console.error(`Audit log failed (${action}):`, error.message);
  }
}

function normDate(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  return v || null;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  return String(a) === String(b);
}

export async function updateSuperAdminUserProfileAction(
  formData: FormData
): Promise<ActionResult> {
  const auth = await assertSuperAdmin();
  if (auth.error || !auth.supabase || !auth.user) {
    return { error: auth.error ?? "Not authorized." };
  }

  const { supabase, user: superAdmin } = auth;
  const targetUserId = String(formData.get("user_id") ?? "").trim();

  if (!targetUserId) {
    return { error: "Invalid user." };
  }

  const attemptedRole = String(formData.get("role") ?? "").trim();
  if (attemptedRole) {
    return { error: "Role cannot be changed from this editor." };
  }

  const { data: oldRow, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (fetchError || !oldRow) {
    return { error: fetchError?.message ?? "User not found." };
  }

  const old = oldRow as Profile;

  if (targetUserId === superAdmin.id) {
    const selfRoleAttempt = String(formData.get("role_override") ?? "").trim();
    if (selfRoleAttempt && selfRoleAttempt !== old.role) {
      return { error: "You cannot change your own role." };
    }
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const bloodGroup = String(formData.get("blood_group") ?? "") as BloodGroup;
  const dateOfBirth = String(formData.get("date_of_birth") ?? "").trim();
  const division = String(formData.get("division") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const upazila = String(formData.get("upazila") ?? "").trim();
  const fullAddress = String(formData.get("full_address") ?? "").trim();
  const pictureUrlInput = String(formData.get("profile_picture_url") ?? "").trim();
  const verificationStatus = String(
    formData.get("verification_status") ?? ""
  ) as VerificationStatus;
  const donationAvailability = formData.get("donation_availability") === "on";
  const nextEligibleDate = normDate(
    String(formData.get("next_eligible_date") ?? "")
  );
  const totalPointsRaw = String(formData.get("total_points") ?? "").trim();
  const totalDonationsRaw = String(formData.get("total_donations") ?? "").trim();

  const existingUrl = String(
    formData.get("existing_profile_picture_url") ?? ""
  ).trim();
  const removePicture = formData.get("remove_profile_picture") === "true";
  const pictureFile = formData.get("profile_picture");

  if (
    !fullName ||
    !phone ||
    !bloodGroup ||
    !dateOfBirth ||
    !division ||
    !district ||
    !upazila
  ) {
    return { error: "Please fill in all required fields." };
  }

  if (!VERIFICATION_STATUSES.includes(verificationStatus)) {
    return { error: "Invalid verification status." };
  }

  if (
    targetUserId === superAdmin.id &&
    verificationStatus !== old.verification_status
  ) {
    return { error: "You cannot change your own verification status." };
  }

  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime()) || dob > new Date()) {
    return { error: "Please enter a valid date of birth." };
  }

  const totalPoints = Number(totalPointsRaw);
  const totalDonations = Number(totalDonationsRaw);
  if (
    !Number.isFinite(totalPoints) ||
    totalPoints < 0 ||
    !Number.isInteger(totalPoints)
  ) {
    return { error: "Total points must be a non-negative whole number." };
  }
  if (
    !Number.isFinite(totalDonations) ||
    totalDonations < 0 ||
    !Number.isInteger(totalDonations)
  ) {
    return { error: "Total donations must be a non-negative whole number." };
  }

  const locationCheck = validateAndNormalizeLocation(
    division,
    district,
    upazila
  );
  if (locationCheck.error || !locationCheck.location) {
    return { error: locationCheck.error ?? "Invalid location." };
  }

  const phoneError = await assertPhoneAvailable(phone, targetUserId);
  if (phoneError) {
    return { error: phoneError };
  }

  let profilePictureUrl: string | null = old.profile_picture_url;
  if (pictureUrlInput) {
    profilePictureUrl = pictureUrlInput;
  } else if (existingUrl) {
    profilePictureUrl = existingUrl;
  }

  if (pictureFile instanceof File && pictureFile.size > 0) {
    const validationError = validateAvatarFile(pictureFile);
    if (validationError) {
      return { error: validationError };
    }

    await removeUserAvatars(supabase, targetUserId);

    const path = getAvatarStoragePath(targetUserId, pictureFile.type);
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
    await removeUserAvatars(supabase, targetUserId);
    profilePictureUrl = null;
  }

  const updatePayload = {
    full_name: fullName,
    phone,
    blood_group: bloodGroup,
    date_of_birth: dateOfBirth,
    division: locationCheck.location.division,
    district: locationCheck.location.district,
    upazila: locationCheck.location.upazila,
    full_address: fullAddress || null,
    profile_picture_url: profilePictureUrl,
    verification_status: verificationStatus,
    donation_availability: donationAvailability,
    next_eligible_date: nextEligibleDate,
    total_points: totalPoints,
    total_donations: totalDonations,
  };

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("user_id", targetUserId);

  if (updateError) {
    return { error: mapProfileSaveError(updateError.message) };
  }

  const superAdminId = superAdmin.id;
  const profileFieldChanges: Record<
    string,
    { old_value: unknown; new_value: unknown }
  > = {};

  const profileFields: Array<{
    key: keyof typeof updatePayload;
    oldVal: unknown;
    newVal: unknown;
  }> = [
    { key: "full_name", oldVal: old.full_name, newVal: fullName },
    { key: "date_of_birth", oldVal: old.date_of_birth, newVal: dateOfBirth },
    { key: "division", oldVal: old.division, newVal: updatePayload.division },
    { key: "district", oldVal: old.district, newVal: updatePayload.district },
    { key: "upazila", oldVal: old.upazila, newVal: updatePayload.upazila },
    {
      key: "full_address",
      oldVal: old.full_address,
      newVal: updatePayload.full_address,
    },
    {
      key: "profile_picture_url",
      oldVal: old.profile_picture_url,
      newVal: profilePictureUrl,
    },
    {
      key: "donation_availability",
      oldVal: old.donation_availability,
      newVal: donationAvailability,
    },
    {
      key: "next_eligible_date",
      oldVal: normDate(old.next_eligible_date),
      newVal: nextEligibleDate,
    },
  ];

  for (const { key, oldVal, newVal } of profileFields) {
    if (!valuesEqual(oldVal, newVal)) {
      profileFieldChanges[key] = { old_value: oldVal, new_value: newVal };
    }
  }

  if (!valuesEqual(old.phone, phone)) {
    await logSuperAdminAudit(
      supabase,
      "Phone Changed",
      targetUserId,
      auditDetails(superAdminId, old.phone, phone, "phone")
    );
  }

  if (!valuesEqual(old.blood_group, bloodGroup)) {
    await logSuperAdminAudit(
      supabase,
      "Blood Group Changed",
      targetUserId,
      auditDetails(superAdminId, old.blood_group, bloodGroup, "blood_group")
    );
  }

  if (!valuesEqual(old.total_points, totalPoints)) {
    await logSuperAdminAudit(
      supabase,
      "Points Adjusted",
      targetUserId,
      auditDetails(superAdminId, old.total_points, totalPoints, "total_points")
    );
  }

  if (!valuesEqual(old.total_donations, totalDonations)) {
    await logSuperAdminAudit(
      supabase,
      "Donations Adjusted",
      targetUserId,
      auditDetails(
        superAdminId,
        old.total_donations,
        totalDonations,
        "total_donations"
      )
    );
  }

  if (!valuesEqual(old.verification_status, verificationStatus)) {
    await logSuperAdminAudit(
      supabase,
      "Verification Changed",
      targetUserId,
      auditDetails(
        superAdminId,
        old.verification_status,
        verificationStatus,
        "verification_status"
      )
    );
  }

  if (Object.keys(profileFieldChanges).length > 0) {
    await logSuperAdminAudit(supabase, "Profile Edited", targetUserId, {
      super_admin_id: superAdminId,
      changes: profileFieldChanges,
    });
  }

  revalidateUserPaths(targetUserId);
  return { success: "Profile updated successfully." };
}
