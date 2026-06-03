import Link from "next/link";
import { LeaderboardPagination } from "@/components/LeaderboardPagination";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { fetchLeaderboardPage } from "@/lib/data/leaderboard";

export const metadata = {
  title: "Leaderboard — Blood Bridge BD",
  description: "Top blood donors ranked by points on Blood Bridge BD",
};

type LeaderboardPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps) {
  const params = await searchParams;
  const pageParam = Number(params.page ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { donors, totalCount, totalPages, page: currentPage } =
    await fetchLeaderboardPage(page);

  const safePage = Math.min(currentPage, totalPages || 1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pt-28 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Donor Leaderboard
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Top donors ranked by total points from confirmed donations. Earn
            badges as you climb the ranks.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-semibold text-red-600 hover:underline"
          >
            ← Back to home
          </Link>
        </div>

        {donors.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <p className="text-gray-500">No donors on the leaderboard yet.</p>
            <Link
              href="/register"
              className="mt-4 inline-block font-semibold text-red-600 hover:underline"
            >
              Register as a donor
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-10">
              <LeaderboardTable donors={donors} page={safePage} />
            </div>
            <LeaderboardPagination
              page={safePage}
              totalPages={totalPages}
              totalCount={totalCount}
            />
          </>
        )}
      </div>
    </div>
  );
}
