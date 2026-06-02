import Image from "next/image";
import Link from "next/link";
import { DonorBadgeLabel } from "@/components/DonorBadgeLabel";
import { VerifiedDonorBadge } from "@/components/VerifiedDonorBadge";
import { DropletIcon } from "@/components/DropletIcon";
import { LEADERBOARD_PAGE_SIZE } from "@/lib/data/leaderboard";
import type { Profile } from "@/lib/types/database";

type LeaderboardTableProps = {
  donors: Profile[];
  page: number;
};

export function LeaderboardTable({ donors, page }: LeaderboardTableProps) {
  const rankOffset = (page - 1) * LEADERBOARD_PAGE_SIZE;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-red-50/50 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Donor</th>
              <th className="px-4 py-3">Blood</th>
              <th className="px-4 py-3">District</th>
              <th className="px-4 py-3">Points</th>
              <th className="px-4 py-3">Donations</th>
              <th className="px-4 py-3">Badge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {donors.map((donor, index) => {
              const rank = rankOffset + index + 1;
              return (
                <tr key={donor.id} className="hover:bg-red-50/30">
                  <td className="px-4 py-4 font-bold text-red-600">#{rank}</td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/donor/${donor.user_id}`}
                      className="flex items-center gap-3 font-semibold text-gray-900 hover:text-red-600"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-red-100 bg-red-50">
                        {donor.profile_picture_url ? (
                          <Image
                            src={donor.profile_picture_url}
                            alt={donor.full_name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-red-400">
                            <DropletIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <span className="flex flex-col gap-1">
                        <span>{donor.full_name}</span>
                        <VerifiedDonorBadge
                          verificationStatus={donor.verification_status}
                          compact
                        />
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-4 font-medium">{donor.blood_group}</td>
                  <td className="px-4 py-4 text-gray-600">{donor.district}</td>
                  <td className="px-4 py-4 font-semibold text-amber-800">
                    {donor.total_points ?? 0}
                  </td>
                  <td className="px-4 py-4">{donor.total_donations ?? 0}</td>
                  <td className="px-4 py-4">
                    <DonorBadgeLabel totalPoints={donor.total_points ?? 0} size="sm" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-gray-100 md:hidden">
        {donors.map((donor, index) => {
          const rank = rankOffset + index + 1;
          return (
            <li key={donor.id} className="p-4">
              <Link
                href={`/donor/${donor.user_id}`}
                className="flex items-start gap-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
                  {rank}
                </span>
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-red-100">
                  {donor.profile_picture_url ? (
                    <Image
                      src={donor.profile_picture_url}
                      alt={donor.full_name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-red-50 text-red-400">
                      <DropletIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{donor.full_name}</p>
                    <VerifiedDonorBadge
                      verificationStatus={donor.verification_status}
                      compact
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    {donor.blood_group} · {donor.district}
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="font-semibold text-amber-800">
                      {donor.total_points ?? 0} pts
                    </span>
                    {" · "}
                    {donor.total_donations ?? 0} donations
                  </p>
                  <div className="mt-2">
                    <DonorBadgeLabel
                      totalPoints={donor.total_points ?? 0}
                      size="sm"
                    />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
