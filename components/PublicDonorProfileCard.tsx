import Image from "next/image";
import Link from "next/link";
import { DonorBadgeLabel } from "@/components/DonorBadgeLabel";
import { DropletIcon } from "@/components/DropletIcon";
import { RequestBloodButton } from "@/components/RequestBloodButton";
import { TrustStatusLabel } from "@/components/TrustStatusLabel";
import { VerifiedDonorBadge } from "@/components/VerifiedDonorBadge";
import { formatDate } from "@/lib/format";
import type { PublicDonorProfile } from "@/lib/types/database";

type PublicDonorProfileCardProps = {
  profile: PublicDonorProfile;
  isLoggedIn: boolean;
};

export function PublicDonorProfileCard({
  profile,
  isLoggedIn,
}: PublicDonorProfileCardProps) {
  const points = profile.total_points ?? 0;
  const donations = profile.total_donations ?? 0;
  const reported = profile.reported_donations ?? 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-lg shadow-red-50">
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-10 text-white sm:px-10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white/40 bg-white/20">
            {profile.profile_picture_url ? (
              <Image
                src={profile.profile_picture_url}
                alt={profile.full_name}
                fill
                className="object-cover"
                sizes="112px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <DropletIcon className="h-12 w-12 text-white/90" />
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-3xl font-bold">{profile.full_name}</h1>
              <VerifiedDonorBadge verificationStatus={profile.verification_status} />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-red-600">
                {profile.blood_group}
              </span>
              <DonorBadgeLabel totalPoints={points} />
              <TrustStatusLabel
                totalDonations={donations}
                reportedDonations={reported}
              />
            </div>
          </div>
        </div>
      </div>

      <dl className="grid gap-0 px-6 py-6 sm:grid-cols-2 sm:px-10">
        <div className="border-b border-gray-100 py-4 sm:pr-6">
          <dt className="text-sm text-gray-500">Points</dt>
          <dd className="text-2xl font-bold text-amber-800">{points}</dd>
        </div>
        <div className="border-b border-gray-100 py-4 sm:pl-6">
          <dt className="text-sm text-gray-500">Donations</dt>
          <dd className="text-2xl font-bold text-gray-900">{donations}</dd>
        </div>
        <div className="border-b border-gray-100 py-4 sm:pr-6">
          <dt className="text-sm text-gray-500">Division</dt>
          <dd className="font-semibold text-gray-900">{profile.division}</dd>
        </div>
        <div className="border-b border-gray-100 py-4 sm:pl-6">
          <dt className="text-sm text-gray-500">District</dt>
          <dd className="font-semibold text-gray-900">{profile.district}</dd>
        </div>
        <div className="border-b border-gray-100 py-4 sm:col-span-2">
          <dt className="text-sm text-gray-500">Upazila</dt>
          <dd className="font-semibold text-gray-900">{profile.upazila}</dd>
        </div>
        {profile.full_address && (
          <div className="border-b border-gray-100 py-4 sm:col-span-2">
            <dt className="text-sm text-gray-500">Full address</dt>
            <dd className="font-semibold text-gray-900">{profile.full_address}</dd>
          </div>
        )}
        <div className="border-b border-gray-100 py-4 sm:col-span-2">
          <dt className="text-sm text-gray-500">Last donation</dt>
          <dd className="font-semibold text-gray-900">
            {formatDate(profile.last_donation_date)}
          </dd>
        </div>
        <div className="py-4 sm:col-span-2">
          <dt className="text-sm text-gray-500">Availability</dt>
          <dd className="font-semibold text-gray-900">
            {profile.donation_availability ? "Available" : "Not available"}
          </dd>
        </div>
      </dl>

      <div className="border-t border-gray-100 bg-gray-50 px-6 py-6 sm:px-10">
        {profile.donation_availability ? (
          <RequestBloodButton
            donorUserId={profile.user_id}
            isLoggedIn={isLoggedIn}
          />
        ) : (
          <p className="text-center text-sm text-gray-600">
            This donor is not accepting requests right now.
          </p>
        )}
        <p className="mt-4 text-center text-sm text-gray-500">
          <Link href="/leaderboard" className="font-semibold text-red-600 hover:underline">
            View leaderboard
          </Link>
        </p>
      </div>
    </section>
  );
}
