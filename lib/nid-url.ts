import { NID_BUCKET } from "@/lib/nid-storage";
import { createClient } from "@/lib/supabase/server";

export async function getNidSignedUrl(
  storagePath: string | null | undefined
): Promise<string | null> {
  if (!storagePath) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(NID_BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error || !data?.signedUrl) {
    console.error("NID signed URL failed:", error?.message);
    return null;
  }

  return data.signedUrl;
}
