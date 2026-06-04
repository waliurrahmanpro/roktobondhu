import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileDisplay } from "@/components/ProfileDisplay";
import { DonorStatusLabel } from "@/components/DonorStatusLabel";
import { SuperAdminNav } from "@/components/super-admin/SuperAdminNav";
import { SuperAdminUserControls } from "@/components/super-admin/SuperAdminUserControls";
import { SuperAdminUserEditorForm } from "@/components/super-admin/SuperAdminUserEditorForm";
import { SuperAdminUserModerationPanel } from "@/components/super-admin/SuperAdminUserModerationPanel";
import { UserTimelineWithFilters } from "@/components/super-admin/UserTimelineWithFilters";
import {
  fetchSuperAdminUserDetail,
  formatNidStatus,
} from "@/lib/data/super-admin-users";
import { fetchUserNotesForAdmin } from "@/lib/data/user-notes";
import { fetchUserTimelineWithProfile } from "@/lib/data/user-timeline";
import { formatDate } from "@/lib/format";
import { formatLocationLine } from "@/lib/bangladesh-locations";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const profile = await fetchSuperAdminUserDetail(id);
  return {
    title: profile
      ? `${profile.full_name} — Super Admin`
      : "User — Super Admin",
  };
}

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

export default async function SuperAdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, notes, timeline] = await Promise.all([
    fetchSuperAdminUserDetail(id),
    fetchUserNotesForAdmin(id),
    fetchUserTimelineWithProfile(id),
  ]);
  if (!profile) {
    notFound();
  }

  return (
    <>
      <SuperAdminNav currentPath="/super-admin/users" />

      <Link
        href="/super-admin/users"
        className="text-sm font-medium text-purple-800 hover:underline"
      >
        ← All users
      </Link>

      <div className="mt-6 grid gap-8 xl:grid-cols-2">
        <div className="space-y-6">
          <ProfileDisplay profile={profile} />

          {user && (
            <SuperAdminUserEditorForm
              profile={profile}
              currentUserId={user.id}
            />
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Status overview</h2>
            <dl className="mt-4">
              <div className="border-b border-gray-100 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Donor status</dt>
                <dd className="mt-1 sm:col-span-2 sm:mt-0">
                  <DonorStatusLabel profile={profile} size="md" showDescription />
                </dd>
              </div>
              <DetailRow
                label="Verification"
                value={profile.verification_status.replace("_", " ")}
              />
              <DetailRow
                label="Donation availability"
                value={profile.donation_availability ? "ON" : "OFF"}
              />
              <DetailRow
                label="Cooldown"
                value={
                  profile.inCooldown
                    ? `Active until ${formatDate(profile.next_eligible_date)}`
                    : profile.next_eligible_date
                      ? `Eligible from ${formatDate(profile.next_eligible_date)}`
                      : "None"
                }
              />
              <DetailRow label="NID status" value={formatNidStatus(profile)} />
              <DetailRow
                label="Banned"
                value={profile.is_banned ? "Yes" : "No"}
              />
              <DetailRow
                label="Blacklisted"
                value={profile.is_blacklisted ? "Yes" : "No"}
              />
              <DetailRow
                label="Shadow banned"
                value={profile.is_shadow_banned ? "Yes" : "No"}
              />
            </dl>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">NID documents</h2>
            {(profile.nid_front_url || profile.nid_back_url) ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                    Front
                  </p>
                  {profile.nidFrontSignedUrl ? (
                    <div className="relative aspect-[3/2] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <Image
                        src={profile.nidFrontSignedUrl}
                        alt="NID front"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Unavailable</p>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                    Back
                  </p>
                  {profile.nidBackSignedUrl ? (
                    <div className="relative aspect-[3/2] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <Image
                        src={profile.nidBackSignedUrl}
                        alt="NID back"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Unavailable</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No NID documents on file.</p>
            )}
          </section>

          {user && (
            <>
              <SuperAdminUserModerationPanel
                profile={profile}
                currentUserId={user.id}
                notes={notes}
              />
              <SuperAdminUserControls
                profile={profile}
                currentUserId={user.id}
              />
            </>
          )}

          <UserTimelineWithFilters logs={timeline} currentUserId={user?.id} />

          <p className="text-xs text-gray-500">
            User ID: <span className="font-mono">{profile.user_id}</span>
            {" · "}
            {formatLocationLine({
              upazila: profile.upazila ?? undefined,
              district: profile.district,
            })}
          </p>
        </div>
      </div>
    </>
  );
}
