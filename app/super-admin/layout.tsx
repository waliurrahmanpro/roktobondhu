import Link from "next/link";
import { requireSuperAdmin } from "@/lib/roles";

export const metadata = {
  title: "Super Admin — RoktoBondhu",
};

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-gray-100 pt-28 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
            <p className="text-sm text-gray-600">
              Platform control — admins cannot access this area
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href="/admin" className="font-semibold text-red-600 hover:underline">
              Admin panel
            </Link>
            <Link href="/dashboard" className="font-semibold text-gray-600 hover:underline">
              Dashboard
            </Link>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
