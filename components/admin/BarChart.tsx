import type { LabelCount, MonthlyCount } from "@/lib/data/admin";

type BarChartProps = {
  title: string;
  data: MonthlyCount[] | LabelCount[];
  valueKey?: "count";
};

function isMonthly(data: MonthlyCount[] | LabelCount[]): data is MonthlyCount[] {
  return data.length === 0 || "month" in data[0];
}

export function BarChart({ title, data }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {data.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No data yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.map((item) => {
            const label = isMonthly(data)
              ? (item as MonthlyCount).month
              : (item as LabelCount).label;
            const width = `${Math.round((item.count / max) * 100)}%`;
            return (
              <li key={label}>
                <div className="mb-1 flex justify-between text-xs text-gray-600">
                  <span className="font-medium text-gray-800">{label}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-red-600 transition-all"
                    style={{ width }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
