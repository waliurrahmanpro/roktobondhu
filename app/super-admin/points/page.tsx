import { SuperAdminNav } from "@/components/super-admin/SuperAdminNav";
import { PointsForm } from "@/components/super-admin/PointsForm";
import { formatDateTime } from "@/lib/format";
import { fetchPointTransactions } from "@/lib/data/super-admin";
import { fetchProfilesByUserIds } from "@/lib/data/profiles";

export default async function SuperAdminPointsPage() {
  const transactions = await fetchPointTransactions(100);
  const profileMap = await fetchProfilesByUserIds(
    transactions.map((t) => t.user_id)
  );

  return (
    <>
      <SuperAdminNav currentPath="/super-admin/points" />

      <div className="grid gap-8 lg:grid-cols-2">
        <PointsForm />

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Points history</h3>
          {transactions.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No adjustments yet.</p>
          ) : (
            <ul className="mt-4 max-h-[480px] space-y-3 overflow-y-auto">
              {transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="rounded-lg border border-gray-100 px-3 py-2 text-sm"
                >
                  <p className="font-medium text-gray-900">
                    {profileMap.get(tx.user_id)?.full_name ?? tx.user_id}
                  </p>
                  <p className="text-gray-600">
                    {tx.delta > 0 ? "+" : ""}
                    {tx.delta} → balance {tx.balance_after}
                  </p>
                  <p className="text-gray-500">{tx.reason}</p>
                  <p className="text-xs text-gray-400">
                    {formatDateTime(tx.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
