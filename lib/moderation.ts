import type { Profile } from "@/lib/types/database";

export type ModerationProfileFields = {
  is_banned?: boolean;
  is_blacklisted?: boolean;
  is_shadow_banned?: boolean;
};

export function isProfileBlacklisted(
  profile: Pick<Profile, "is_blacklisted"> | null | undefined
): boolean {
  return profile?.is_blacklisted ?? false;
}

export function isProfileShadowBanned(
  profile: Pick<Profile, "is_shadow_banned"> | null | undefined
): boolean {
  return profile?.is_shadow_banned ?? false;
}

/** Hidden from donor search, leaderboard, matching, and donor requests */
export function isHiddenFromPublicDonorFeatures(
  profile: ModerationProfileFields | null | undefined
): boolean {
  if (!profile) return true;
  return !!(
    profile.is_banned ||
    profile.is_blacklisted ||
    profile.is_shadow_banned
  );
}

/** Cannot sign in (same as legacy ban + blacklist) */
export function isLoginBlocked(
  profile: ModerationProfileFields | null | undefined
): boolean {
  if (!profile) return false;
  return !!(profile.is_banned || profile.is_blacklisted);
}
