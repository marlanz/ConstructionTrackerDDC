/**
 * Shared Vietnamese date formatting helper using Intl.DateTimeFormat('vi-VN', ...).
 */
export function formatDate(
  dateInput: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }
): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", options).format(date);
}

/**
 * Full Vietnamese date format with weekday (e.g. "Thứ Hai, 17 Tháng 8, 2026").
 */
export function formatDateWithWeekday(
  dateInput: Date | string | number | null | undefined
): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  
  const formatted = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  // Capitalize first letter of weekday and month if needed
  return formatted
    .split(" ")
    .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}
