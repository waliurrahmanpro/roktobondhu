export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "Not recorded";
  const normalized = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const date = new Date(normalized + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
