export const AVATAR_BUCKET = "avatars";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 2 * 1024 * 1024;

export function getAvatarStoragePath(userId: string, mimeType: string) {
  const ext =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : mimeType === "image/gif"
          ? "gif"
          : "jpg";
  return `${userId}/profile.${ext}`;
}

export function validateAvatarFile(file: File): string | null {
  if (!file.size) return null;
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Please upload a JPEG, PNG, WebP, or GIF image.";
  }
  if (file.size > MAX_BYTES) {
    return "Image must be 2 MB or smaller.";
  }
  return null;
}
