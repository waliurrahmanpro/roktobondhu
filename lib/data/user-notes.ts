import { createClient } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/roles";
import type { UserNote } from "@/lib/types/database";

export type UserNoteWithAuthor = UserNote & {
  author_name: string | null;
};

export async function fetchUserNotesForAdmin(
  subjectUserId: string
): Promise<UserNoteWithAuthor[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isUserAdmin(user.id))) {
    return [];
  }

  const { data: notes, error } = await supabase
    .from("user_notes")
    .select("*")
    .eq("subject_user_id", subjectUserId)
    .order("created_at", { ascending: false });

  if (error || !notes?.length) {
    if (error) {
      console.error("User notes fetch failed:", error.message);
    }
    return [];
  }

  const authorIds = [
    ...new Set(
      notes
        .map((n) => n.author_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const authorNames = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", authorIds);

    for (const a of authors ?? []) {
      authorNames.set(a.user_id, a.full_name);
    }
  }

  return (notes as UserNote[]).map((note) => ({
    ...note,
    author_name: note.author_id
      ? (authorNames.get(note.author_id) ?? null)
      : null,
  }));
}
