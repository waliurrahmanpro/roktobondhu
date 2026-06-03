"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createUserNoteAction,
  deleteUserNoteAction,
  setUserBlacklistedAction,
  setUserShadowBannedAction,
  updateUserNoteAction,
} from "@/app/actions/super-admin-moderation";
import { inputClassName, labelClassName } from "@/lib/constants";
import type { Profile } from "@/lib/types/database";
import type { UserNoteWithAuthor } from "@/lib/data/user-notes";
import { formatDate } from "@/lib/format";

type SuperAdminUserModerationPanelProps = {
  profile: Profile;
  currentUserId: string;
  notes: UserNoteWithAuthor[];
};

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div>
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
        <p className="mt-2 text-xs font-medium text-gray-500">
          Status: {checked ? "ON" : "OFF"}
        </p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition disabled:opacity-50 ${
          checked ? "bg-red-600" : "bg-gray-300"
        }`}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "translate-x-6" : ""
          }`}
        />
      </button>
    </div>
  );
}

export function SuperAdminUserModerationPanel({
  profile,
  currentUserId,
  notes,
}: SuperAdminUserModerationPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const isSelf = profile.user_id === currentUserId;

  function run(action: (fd: FormData) => Promise<{ error?: string; success?: string } | null>) {
    return (fd: FormData) => {
      setFeedback(null);
      startTransition(async () => {
        const result = await action(fd);
        if (!result) return;
        if (result.error) {
          setFeedback({ type: "error", text: result.error });
          return;
        }
        setFeedback({ type: "success", text: result.success ?? "Saved." });
        router.refresh();
      });
    };
  }

  function toggleBlacklist(next: boolean) {
    const fd = new FormData();
    fd.set("user_id", profile.user_id);
    fd.set("blacklisted", next ? "true" : "false");
    run(setUserBlacklistedAction)(fd);
  }

  function toggleShadowBan(next: boolean) {
    const fd = new FormData();
    fd.set("user_id", profile.user_id);
    fd.set("shadow_banned", next ? "true" : "false");
    run(setUserShadowBannedAction)(fd);
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    const body = newNote.trim();
    if (!body) return;
    const fd = new FormData();
    fd.set("user_id", profile.user_id);
    fd.set("body", body);
    setFeedback(null);
    startTransition(async () => {
      const result = await createUserNoteAction(fd);
      if (!result) return;
      if (result.error) {
        setFeedback({ type: "error", text: result.error });
        return;
      }
      setNewNote("");
      setFeedback({ type: "success", text: result.success ?? "Note added." });
      router.refresh();
    });
  }

  function handleUpdateNote(noteId: string) {
    const fd = new FormData();
    fd.set("note_id", noteId);
    fd.set("user_id", profile.user_id);
    fd.set("body", editBody.trim());
    run(updateUserNoteAction)(fd);
    setEditingId(null);
    setEditBody("");
  }

  function handleDeleteNote(noteId: string) {
    if (!window.confirm("Delete this note?")) return;
    const fd = new FormData();
    fd.set("note_id", noteId);
    fd.set("user_id", profile.user_id);
    run(deleteUserNoteAction)(fd);
  }

  return (
    <section className="space-y-6 rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Moderation</h2>
        <p className="mt-1 text-sm text-gray-600">
          Blacklist, shadow ban, and private staff notes (not visible to the user).
        </p>
      </div>

      <div className="space-y-3">
        <ToggleRow
          label="Blacklist"
          description="Blocks login, blood requests, donor search, matching, and earning points."
          checked={profile.is_blacklisted ?? false}
          disabled={pending || isSelf}
          onToggle={toggleBlacklist}
        />
        <ToggleRow
          label="Shadow ban"
          description="User can log in and use the dashboard but is hidden from public donor features."
          checked={profile.is_shadow_banned ?? false}
          disabled={pending || isSelf}
          onToggle={toggleShadowBan}
        />
        {isSelf && (
          <p className="text-xs text-amber-700">
            You cannot blacklist or shadow ban your own account.
          </p>
        )}
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="font-semibold text-gray-900">Private notes</h3>
        <p className="mt-1 text-xs text-gray-500">
          Visible to admins and super admins only.
        </p>

        <form onSubmit={handleAddNote} className="mt-4 space-y-3">
          <label htmlFor="new_note" className={labelClassName}>
            Add note
          </label>
          <textarea
            id="new_note"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            placeholder="e.g. Trusted donor, suspected duplicate, manual review required"
            className={inputClassName}
            disabled={pending}
          />
          <button
            type="submit"
            disabled={pending || !newNote.trim()}
            className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-900 hover:bg-purple-100 disabled:opacity-50"
          >
            Add note
          </button>
        </form>

        {notes.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No notes yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={3}
                      className={inputClassName}
                      disabled={pending}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pending || !editBody.trim()}
                        onClick={() => handleUpdateNote(note.id)}
                        className="rounded-lg bg-purple-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditBody("");
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap text-sm text-gray-900">
                      {note.body}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {note.author_name ?? "Staff"} ·{" "}
                      {formatDate(note.created_at)}
                      {note.updated_at !== note.created_at
                        ? ` (updated ${formatDate(note.updated_at)})`
                        : ""}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setEditingId(note.id);
                          setEditBody(note.body);
                        }}
                        className="text-sm font-medium text-purple-800 hover:underline disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {feedback && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
          role="alert"
        >
          {feedback.text}
        </p>
      )}
    </section>
  );
}
