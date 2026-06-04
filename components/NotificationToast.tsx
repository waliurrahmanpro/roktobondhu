"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ToastProps = {
  id: string;
  title: string;
  message: string;
  onClose: () => void;
};

function Toast({ id, title, message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="pointer-events-auto flex w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-900/5">
      <div className="flex-1 p-4">
        <div className="flex items-start">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex flex-shrink-0 rounded-lg bg-white p-1.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <Link
          href="/dashboard/notifications"
          className="mt-3 block text-sm font-medium text-red-600 hover:text-red-700"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}

export function NotificationToast() {
  const [toasts, setToasts] = useState<
    Array<{ id: string; title: string; message: string }>
  >([]);

  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail as {
        id: string;
        title: string;
        message: string;
      };

      setToasts((prev) => [
        ...prev,
        {
          id: notification.id,
          title: notification.title,
          message: notification.message,
        },
      ]);
    };

    window.addEventListener("new-notification", handleNewNotification as EventListener);

    return () => {
      window.removeEventListener(
        "new-notification",
        handleNewNotification as EventListener
      );
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-20 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
