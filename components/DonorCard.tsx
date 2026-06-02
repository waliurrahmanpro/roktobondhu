import Image from "next/image";
import Link from "next/link";
import { telLink, whatsAppLink } from "@/lib/phone";
import type { Profile } from "@/lib/types/database";
import { DropletIcon } from "@/components/DropletIcon";
import { RequestBloodButton } from "@/components/RequestBloodButton";
import { DonorStatsBlock } from "@/components/DonorStatsBlock";
import { TrustStatusLabel } from "@/components/TrustStatusLabel";
import { VerifiedDonorBadge } from "@/components/VerifiedDonorBadge";
import { formatLocationLine } from "@/lib/bangladesh-locations";

type DonorCardProps = {
  donor: Profile;
  isLoggedIn: boolean;
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

export function DonorCard({ donor, isLoggedIn }: DonorCardProps) {
  const whatsappMessage = `Hello ${donor.full_name}, I found you on RoktoBondhu and need ${donor.blood_group} blood.`;
  const reported = donor.reported_donations ?? 0;
  const donations = donor.total_donations ?? 0;

  return (
    <article className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-red-200 hover:shadow-lg hover:shadow-red-50">
      <div className="flex items-start gap-4">
        <Link
          href={`/donor/${donor.user_id}`}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-red-100 bg-red-50"
        >
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
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/donor/${donor.user_id}`}
              className="font-semibold text-gray-900 hover:text-red-600"
            >
              {donor.full_name}
            </Link>
            <VerifiedDonorBadge verificationStatus={donor.verification_status} compact />
          </div>
          <div className="mt-2">
            <DonorStatsBlock donor={donor} />
          </div>
          <div className="mt-2">
            <TrustStatusLabel
              totalDonations={donations}
              reportedDonations={reported}
              size="sm"
            />
          </div>

          <p className="mt-3 text-sm text-gray-600">
            {formatLocationLine({
              upazila: donor.upazila,
              district: donor.district,
              division: donor.division,
            })}
          </p>
          {donor.full_address && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
              {donor.full_address}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <a
            href={whatsAppLink(donor.phone, whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-col items-center justify-center gap-1 rounded-xl bg-[#25D366] px-2 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1da851] sm:text-sm"
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp
          </a>
          <a
            href={telLink(donor.phone)}
            className="inline-flex flex-col items-center justify-center gap-1 rounded-xl bg-red-600 px-2 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 sm:text-sm"
          >
            <PhoneIcon className="h-4 w-4" />
            Call
          </a>
          <RequestBloodButton
            donorUserId={donor.user_id}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>
    </article>
  );
}
