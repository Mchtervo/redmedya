const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

export function formatWeddingDateDisplay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const year = Number(m[1]);
  return `${day} ${MONTHS_TR[month]} ${year}`;
}

export function formatWeddingSchedule(
  weddingDate?: string,
  weddingTime?: string
): string {
  const date = weddingDate ? formatWeddingDateDisplay(weddingDate) : "";
  const time = weddingTime?.trim();
  if (date && time) return `${date} · ${time}`;
  return date || time || "";
}
