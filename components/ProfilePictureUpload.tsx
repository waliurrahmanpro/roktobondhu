"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { DropletIcon } from "@/components/DropletIcon";
import { labelClassName } from "@/lib/constants";

type ProfilePictureUploadProps = {
  currentUrl?: string | null;
};

export function ProfilePictureUpload({ currentUrl }: ProfilePictureUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function handleRemove() {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className={labelClassName}>Profile picture</label>
      <input
        type="hidden"
        name="existing_profile_picture_url"
        value={preview && preview.startsWith("http") ? preview : ""}
      />
      <input
        type="hidden"
        name="remove_profile_picture"
        value={preview ? "" : "true"}
      />
      <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-red-100 bg-red-50 shadow-md">
          {preview ? (
            <Image
              src={preview}
              alt="Profile preview"
              fill
              className="object-cover"
              unoptimized={preview.startsWith("blob:")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-red-400">
              <DropletIcon className="h-12 w-12" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            id="profile_picture"
            name="profile_picture"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Upload photo
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-sm text-gray-500 hover:text-red-600"
            >
              Remove photo
            </button>
          )}
          <p className="text-xs text-gray-500">JPEG, PNG, WebP or GIF. Max 2 MB.</p>
        </div>
      </div>
    </div>
  );
}
