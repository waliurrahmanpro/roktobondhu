import Image from "next/image";
import { formatDate } from "@/lib/format";
import type { Profile } from "@/lib/types/database";
type DonorCardProps = {
  donor: Profile;
};

export function DonorCard({ donor }: DonorCardProps) {
  const location = `${donor.upazila}, ${donor.district}`;

  return (
    <article className="rounded-2xl border border-gray-100 p-6 transition hover:border-red-200 hover:shadow-lg hover:shadow-red-50">
      <div className="flex items-start justify-between gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-100 text-lg font-bold text-red-600">
          {donor.profile_picture_url ? (
            <Image
              src={donor.profile_picture_url}
              alt={donor.full_name}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <span>{donor.blood_group}</span>
          )}
        </div>
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
          Available
        </span>
      </div>
      <h3 className="mt-4 font-semibold text-gray-900">{donor.full_name}</h3>
      <p className="mt-1 text-sm text-gray-500">{location}</p>
      <p className="mt-1 text-xs text-gray-400">{donor.division} Division</p>
      <p className="mt-3 text-xs text-gray-400">
        Last donated: {formatDate(donor.last_donation_date)}
      </p>
      <a
        href={`tel:${donor.phone}`}
        className="mt-4 flex w-full items-center justify-center rounded-lg border border-red-200 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        Contact Donor
      </a>
    </article>
  );
}
