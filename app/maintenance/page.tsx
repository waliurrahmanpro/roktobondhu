import Link from "next/link";

export const metadata = {
  title: "Maintenance — Blood Bridge BD",
};

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 pt-20 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Under maintenance</h1>
      <p className="mt-4 max-w-md text-gray-600">
        Blood Bridge BD is temporarily unavailable while we perform updates. Please
        check back soon.
      </p>
      <Link
        href="/login"
        className="mt-8 text-sm font-semibold text-red-600 hover:underline"
      >
        Staff login
      </Link>
    </div>
  );
}
