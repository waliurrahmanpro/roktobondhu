import Image from "next/image";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminVerificationActions } from "@/components/admin/AdminVerificationActions";
import { fetchPendingVerifications } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "NID verifications — Admin",
};

export default async function AdminVerificationsPage() {
  const pending = await fetchPendingVerifications();

  return (
    <>
      <AdminNav currentPath="/admin/verifications" />

      <h2 className="text-xl font-bold text-gray-900">NID verifications</h2>
      <p className="mt-1 text-sm text-gray-600">
        Review pending identity documents from live Supabase data.
      </p>

      {pending.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-500">
          No pending verifications.
        </p>
      ) : (
        <ul className="mt-8 space-y-8">
          {pending.map((row) => (
            <li
              key={row.user_id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {row.full_name}
                  </h3>
                  <p className="text-sm text-gray-600">{row.phone}</p>
                  <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-gray-500">Date of birth</dt>
                      <dd className="font-medium">
                        {row.date_of_birth
                          ? formatDate(row.date_of_birth)
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Age</dt>
                      <dd className="font-medium">
                        {row.age !== null ? `${row.age} years` : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Blood group</dt>
                      <dd className="font-medium">{row.blood_group}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">District</dt>
                      <dd className="font-medium">{row.district}</dd>
                    </div>
                  </dl>
                </div>
                <AdminVerificationActions userId={row.user_id} />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                    NID front
                  </p>
                  {row.nidFrontSignedUrl ? (
                    <div className="relative aspect-[3/2] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <Image
                        src={row.nidFrontSignedUrl}
                        alt={`${row.full_name} NID front`}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Image unavailable</p>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                    NID back
                  </p>
                  {row.nidBackSignedUrl ? (
                    <div className="relative aspect-[3/2] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <Image
                        src={row.nidBackSignedUrl}
                        alt={`${row.full_name} NID back`}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Image unavailable</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
