import { createClient } from "@/lib/supabase/server";
import type { Broadcast } from "@/lib/types/database";

export async function fetchBroadcasts(): Promise<Broadcast[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("broadcasts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching broadcasts:", error);
    return [];
  }

  return data || [];
}

export async function fetchBroadcastById(id: string): Promise<Broadcast | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("broadcasts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching broadcast:", error);
    return null;
  }

  return data;
}
