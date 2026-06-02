import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const metadata = {
  title: "Admin — RoktoBondhu",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-100 pt-28 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
            <p className="text-sm text-gray-600">Moderation and platform overview</p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-red-600 hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
