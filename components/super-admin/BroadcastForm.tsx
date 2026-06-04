"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createBroadcastAction,
  sendBroadcastAction,
  refreshBroadcastAnalyticsAction,
} from "@/app/actions/broadcasts";
import type { BroadcastTargetType, BroadcastPriority } from "@/lib/types/database";

type BroadcastFormProps = {
  bloodGroups: string[];
  divisions: string[];
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Creating..." : "Create Broadcast"}
    </button>
  );
}

export function BroadcastForm({ bloodGroups, divisions }: BroadcastFormProps) {
  const [state, formAction] = useFormState(createBroadcastAction, null);
  const [targetType, setTargetType] = useState<BroadcastTargetType>("all_users");

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
          placeholder="Broadcast title"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
          placeholder="Broadcast message"
        />
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
        >
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div>
        <label htmlFor="target_type" className="block text-sm font-medium text-gray-700">
          Target Audience
        </label>
        <select
          id="target_type"
          name="target_type"
          value={targetType}
          onChange={(e) => setTargetType(e.target.value as BroadcastTargetType)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
        >
          <option value="all_users">All Users</option>
          <option value="all_donors">All Donors</option>
          <option value="blood_group">Specific Blood Group</option>
          <option value="division">Specific Division</option>
          <option value="district">Specific District</option>
        </select>
      </div>

      {(targetType === "blood_group" ||
        targetType === "division" ||
        targetType === "district") && (
        <div>
          <label htmlFor="target_value" className="block text-sm font-medium text-gray-700">
            {targetType === "blood_group"
              ? "Blood Group"
              : targetType === "division"
                ? "Division"
                : "District"}
          </label>
          {targetType === "blood_group" ? (
            <select
              id="target_value"
              name="target_value"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
            >
              <option value="">Select blood group</option>
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          ) : targetType === "division" ? (
            <select
              id="target_value"
              name="target_value"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
            >
              <option value="">Select division</option>
              {divisions.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              id="target_value"
              name="target_value"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
              placeholder="Enter district name"
            />
          )}
        </div>
      )}

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600">{state.success}</p>
      )}

      <SubmitButton disabled={!!state?.success} />
    </form>
  );
}
