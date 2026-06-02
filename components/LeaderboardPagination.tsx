import Link from "next/link";

type LeaderboardPaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
};

export function LeaderboardPagination({
  page,
  totalPages,
  totalCount,
}: LeaderboardPaginationProps) {
  if (totalPages <= 1) {
    return (
      <p className="mt-6 text-center text-sm text-gray-500">
        Showing {totalCount} donor{totalCount === 1 ? "" : "s"}
      </p>
    );
  }

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages} · {totalCount} donors
      </p>
      <div className="flex gap-2">
        {prevPage ? (
          <Link
            href={`/leaderboard?page=${prevPage}`}
            className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:border-red-200 hover:text-red-600"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-full border border-gray-100 px-5 py-2 text-sm text-gray-300">
            Previous
          </span>
        )}
        {nextPage ? (
          <Link
            href={`/leaderboard?page=${nextPage}`}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-full bg-gray-100 px-5 py-2 text-sm text-gray-400">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
