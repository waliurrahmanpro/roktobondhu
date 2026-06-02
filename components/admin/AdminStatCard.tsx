type AdminStatCardProps = {
  label: string;
  value: number;
  hint?: string;
};

export function AdminStatCard({ label, value, hint }: AdminStatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="mt-1 text-sm font-medium text-gray-700">{label}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
