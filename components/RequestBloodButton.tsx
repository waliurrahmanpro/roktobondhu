"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitDonorRequest } from "@/app/actions/donor-requests";
import { DropletIcon } from "@/components/DropletIcon";

type RequestBloodButtonProps = {
  donorUserId: string;
  isLoggedIn: boolean;
};

const buttonClass =
  "inline-flex h-full min-h-[4.5rem] w-full flex-col items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm";

export function RequestBloodButton({
  donorUserId,
  isLoggedIn,
}: RequestBloodButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?redirect=${encodeURIComponent("/#search")}`}
        className={buttonClass}
      >
        <DropletIcon className="h-4 w-4" />
        Request Blood
      </Link>
    );
  }

  function handleRequest() {
    setFeedback(null);
    const formData = new FormData();
    formData.set("donor_id", donorUserId);

    startTransition(async () => {
      const result = await submitDonorRequest(formData);
      if (result?.error) {
        setFeedback({ type: "error", text: result.error });
        return;
      }
      if (result?.success) {
        setFeedback({ type: "success", text: result.success });
        router.refresh();
      }
    });
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleRequest}
        className={buttonClass}
        aria-label="Request blood from this donor"
      >
        <DropletIcon className="h-4 w-4" />
        {pending ? "Sending…" : "Request Blood"}
      </button>
      {feedback?.type === "success" && (
        <div className="rounded-lg bg-green-50 px-2 py-2 text-center text-[10px] leading-snug text-green-800 sm:text-xs">
          <p>{feedback.text}</p>
          <Link
            href="/dashboard/my-requests"
            className="mt-1 inline-block font-semibold underline"
          >
            View My Requests →
          </Link>
        </div>
      )}
      {feedback?.type === "error" && (
        <p className="text-center text-[10px] leading-snug text-red-600 sm:text-xs">
          {feedback.text}
        </p>
      )}
    </div>
  );
}
