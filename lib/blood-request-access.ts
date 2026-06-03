import { isUserAdmin } from "@/lib/roles";
import type { BloodRequest } from "@/lib/types/database";

export async function canManageBloodRequest(
  userId: string | null | undefined,
  request: Pick<BloodRequest, "user_id">
): Promise<boolean> {
  if (!userId) return false;
  if (request.user_id === userId) return true;
  return isUserAdmin(userId);
}

export function isBloodRequestPubliclyVisible(
  status: BloodRequest["status"]
): boolean {
  return status === "active";
}

export function canViewBloodRequest(
  request: BloodRequest,
  viewerUserId: string | null | undefined,
  viewerIsAdmin: boolean
): boolean {
  if (isBloodRequestPubliclyVisible(request.status)) return true;
  if (!viewerUserId) return false;
  if (viewerIsAdmin) return true;
  return request.user_id === viewerUserId && request.status !== "removed";
}
