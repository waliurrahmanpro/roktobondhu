import { BroadcastForm } from "@/components/super-admin/BroadcastForm";
import { BroadcastList } from "@/components/super-admin/BroadcastList";
import { SuperAdminNav } from "@/components/super-admin/SuperAdminNav";
import { fetchBroadcasts } from "@/lib/data/broadcasts";
import { BLOOD_GROUPS, DIVISIONS } from "@/lib/bangladesh-locations";

export default async function SuperAdminBroadcastsPage() {
  const broadcasts = await fetchBroadcasts();

  return (
    <>
      <SuperAdminNav currentPath="/super-admin/broadcasts" />

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Create New Broadcast
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Send targeted messages to users based on their location, blood
              group, or donor status.
            </p>
            <div className="mt-6">
              <BroadcastForm
                bloodGroups={BLOOD_GROUPS}
                divisions={DIVISIONS}
              />
            </div>
          </section>
        </div>

        <div>
          <BroadcastList broadcasts={broadcasts} />
        </div>
      </div>
    </>
  );
}
