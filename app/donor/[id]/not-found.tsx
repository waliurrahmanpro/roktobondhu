import Link from "next/link";

export default function DonorNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-red-50 px-4 pt-20">
      <h1 className="text-2xl font-bold text-gray-900">Donor not found</h1>
      <p className="mt-2 text-gray-600">
        This profile does not exist or has been removed.
      </p>
      <Link
        href="/leaderboard"
        className="mt-6 font-semibold text-red-600 hover:underline"
      >
        View leaderboard
      </Link>
    </div>
  );
}
