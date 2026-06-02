import Image from "next/image";
import Link from "next/link";
import { DonorBadgeLabel } from "@/components/DonorBadgeLabel";
import { DropletIcon } from "@/components/DropletIcon";
import type { Profile } from "@/lib/types/database";

type TopDonorsSectionProps = {
  donors: Profile[];
};

export function TopDonorsSection({ donors }: TopDonorsSectionProps) {
  if (donors.length === 0) {
    return null;
  }

  return (
    <section className="border-y border-red-100 bg-gradient-to-b from-amber-50/40 to-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-red-600">
              Top donors
            </span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Community heroes
            </h2>
            <p className="mt-2 max-w-xl text-gray-600">
              Donors with the most points from confirmed donations.
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="rounded-full border-2 border-red-600 px-6 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-white"
          >
            View Full Leaderboard
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {donors.map((donor, index) => (
            <Link
              key={donor.id}
              href={`/donor/${donor.user_id}`}
              className="group relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-red-200 hover:shadow-lg hover:shadow-red-50"
            >
              <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                {index + 1}
              </span>
              <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full border-2 border-red-100 bg-red-50">
                {donor.profile_picture_url ? (
                  <Image
                    src={donor.profile_picture_url}
                    alt={donor.full_name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-red-400">
                    <DropletIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
              <h3 className="mt-4 truncate text-center font-semibold text-gray-900 group-hover:text-red-600">
                {donor.full_name}
              </h3>
              <p className="mt-1 text-center text-sm font-bold text-red-600">
                {donor.blood_group}
              </p>
              <div className="mt-3 flex justify-center">
                <DonorBadgeLabel totalPoints={donor.total_points ?? 0} size="sm" />
              </div>
              <p className="mt-3 text-center text-xs text-gray-600">
                {donor.total_points ?? 0} pts · {donor.total_donations ?? 0}{" "}
                donations
              </p>
              <p className="mt-1 truncate text-center text-xs text-gray-500">
                {donor.district}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
