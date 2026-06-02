import Image from "next/image";
import { DropletIcon } from "@/components/DropletIcon";
import { POINTS_PER_DONATION } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Profile } from "@/lib/types/database";

type ProfileDisplayProps = {
  profile: Profile;
  email?: string | null;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-0 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-gray-900 sm:col-span-2 sm:mt-0">
        {value}
      </dd>
    </div>
  );
}

export function ProfileDisplay({ profile, email }: ProfileDisplayProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-lg shadow-red-50">
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-8 text-white sm:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white/40 bg-white/20">
            {profile.profile_picture_url ? (
              <Image
                src={profile.profile_picture_url}
                alt={profile.full_name}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <DropletIcon className="h-10 w-10 text-white/90" />
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold">{profile.full_name}</h2>
            <p className="mt-1 text-red-100">{email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-red-600">
                {profile.blood_group}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  profile.donation_availability
                    ? "bg-green-500 text-white"
                    : "bg-white/20 text-white"
                }`}
              >
                {profile.donation_availability ? "Available ON" : "Available OFF"}
              </span>
              <span className="rounded-full bg-amber-400 px-3 py-1 text-sm font-bold text-amber-950">
                {profile.total_points ?? 0} points
              </span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-red-700">
                {profile.total_donations ?? 0} donations
              </span>
            </div>
          </div>
        </div>
      </div>

      <dl className="px-6 py-2 sm:px-8">
        <DetailRow label="Full name" value={profile.full_name} />
        <DetailRow label="Blood group" value={profile.blood_group} />
        <DetailRow label="Division" value={profile.division} />
        <DetailRow label="District" value={profile.district} />
        <DetailRow label="Upazila" value={profile.upazila} />
        <DetailRow label="Phone number" value={profile.phone} />
        <DetailRow
          label="Last donation date"
          value={formatDate(profile.last_donation_date)}
        />
        <DetailRow
          label="Donation availability"
          value={profile.donation_availability ? "ON" : "OFF"}
        />
        <DetailRow
          label="Total points"
          value={`${profile.total_points ?? 0} (${POINTS_PER_DONATION} per confirmed donation)`}
        />
        <DetailRow
          label="Total donations"
          value={String(profile.total_donations ?? 0)}
        />
      </dl>
    </section>
  );
}
