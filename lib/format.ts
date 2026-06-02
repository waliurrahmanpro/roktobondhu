export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "Not recorded";
  const date = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
