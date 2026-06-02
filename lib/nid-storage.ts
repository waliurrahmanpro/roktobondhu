export const NID_BUCKET = "nid-documents";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function getNidStoragePath(
  userId: string,
  side: "front" | "back",
  mimeType: string
) {
  const ext =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : "jpg";
  return `${userId}/${side}.${ext}`;
}

export function validateNidFile(file: File): string | null {
  if (!file.size) return "Please select an image file.";
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Please upload a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}
