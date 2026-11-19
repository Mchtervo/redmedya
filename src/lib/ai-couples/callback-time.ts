/**
 * Çiftin söylediği geri arama zamanını anlar: "yarın 15:00", "akşam", "2 saat sonra",
 * "cumartesi öğlen", "yarım saat sonra", "öğleden sonra 3 gibi" … (İstanbul saati)
 * Anlaşılamazsa null döner → sistem kendi ayarlar (2 saat sonra).
 */

const GUN: Record<string, number> = { pazar: 0, pazartesi: 1, salı: 2, sali: 2, çarşamba: 3, carsamba: 3, perşembe: 4, persembe: 4, cuma: 5, cumartesi: 6 };
const SAYI: Record<string, number> = {
  bir: 1, iki: 2, üç: 3, uc: 3, dört: 4, dort: 4, beş: 5, bes: 5, altı: 6, alti: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10,
  "on bir": 11, "on iki": 12, "on üç": 13, "on dört": 14, "on beş": 15, "on altı": 16, "on yedi": 17, "on sekiz": 18, "on dokuz": 19, yirmi: 20,
};

/** İstanbul (UTC+3) yerel gün + saat → Date */
function at(dayOffset: number, base: Date, hour: number, minute = 0): Date {
  const ist = new Date(base.getTime() + 3 * 3600_000);
  const y = ist.getUTCFullYear(), m = ist.getUTCMonth(), d = ist.getUTCDate() + dayOffset;
  return new Date(Date.UTC(y, m, d, hour - 3, minute));
}

function istWeekday(base: Date): number {
  return new Date(base.getTime() + 3 * 3600_000).getUTCDay();
}

function wordsToNumbers(t: string): string {
  let s = ` ${t} `;
  for (const [w, n] of Object.entries(SAYI).sort((a, b) => b[0].length - a[0].length)) {
    s = s.replace(new RegExp(`(\\s)${w}(\\s)`, "g"), `$1${n}$2`);
  }
  return s.trim();
}

export function parseCallbackTime(raw: string | undefined | null, from: Date = new Date()): Date | null {
  if (!raw) return null;
  const t = wordsToNumbers(
    raw
      .toLocaleLowerCase("tr-TR")
      .replace(/(\d)[.](\d)/g, "$1:$2") // "16.30" → "16:30"
      .replace(/[.,!?]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
  if (!t) return null;

  // Göreli: "yarım saat sonra", "2 saat sonra", "15 dakika sonra", "1 saat içinde"
  if (/yarım saat/.test(t)) return new Date(from.getTime() + 30 * 60_000);
  const rel = t.match(/(\d+)\s*(dk|dakika|saat)\s*(sonra|içinde|kadar)?/);
  if (rel && (rel[3] || !/saat\s*\d/.test(t)) && !/saat\s+\d+/.test(t.replace(rel[0], ""))) {
    const n = Number(rel[1]);
    if (rel[2].startsWith("d") && n <= 600) return new Date(from.getTime() + n * 60_000);
    if (rel[2] === "saat" && rel[3] && n <= 72) return new Date(from.getTime() + n * 3600_000);
  }

  // Gün
  let day = 0;
  if (/öbür gün|ertesi gün|yarından sonra/.test(t)) day = 2;
  else if (/yarın/.test(t)) day = 1;
  else if (/hafta ?sonu/.test(t)) {
    const wd = istWeekday(from);
    day = wd === 6 ? 0 : wd === 0 ? 0 : 6 - wd;
  } else {
    const g = Object.keys(GUN).sort((a, b) => b.length - a.length).find((k) => t.includes(k));
    if (g) {
      const want = GUN[g], wd = istWeekday(from);
      day = (want - wd + 7) % 7;
      if (day === 0 && !/bugün/.test(t)) day = 7;
    }
  }

  // Saat: "15:30", "saat 3", "3 gibi", "3'te"
  let hour: number | null = null, minute = 0;
  const hm = t.match(/(\d{1,2})[:.](\d{2})/);
  const h1 = t.match(/saat\s*(\d{1,2})(?:\s*buçuk)?/) || t.match(/(\d{1,2})\s*['’]?(?:den|dan|ten|tan)\s+sonra/) || t.match(/(\d{1,2})\s*(?:gibi|['’]?(?:te|ta|de|da|e|a))\b/);
  if (hm) { hour = Number(hm[1]); minute = Number(hm[2]); }
  else if (h1) { hour = Number(h1[1]); if (/buçuk/.test(t)) minute = 30; }
  if (hour !== null) {
    if (/akşam|öğleden sonra|ikindi/.test(t) && hour < 12) hour += 12;
    else if (hour >= 1 && hour <= 8 && !/sabah/.test(t)) hour += 12; // "3'te" → 15:00; "sabah 8" sabah kalır (arama 09:30'da başlar)
    if (hour > 23 || minute > 59) hour = null;
  }
  if (hour === null) {
    if (/sabah/.test(t)) hour = 10;
    else if (/öğle(n|)( |$)|öğlen|öğle arası/.test(t)) { hour = 12; minute = 30; }
    else if (/öğleden sonra|ikindi/.test(t)) hour = 15;
    else if (/akşam/.test(t)) hour = 19;
  }

  if (hour === null && day === 0) return null; // anlaşılmadı
  const d = at(day, from, hour ?? 11, hour === null ? 0 : minute);
  // Geçmiş bir saat çıktıysa (bugün 10'da dedi, saat 14) → ertesi gün
  if (d.getTime() <= from.getTime()) return day === 0 && hour !== null ? at(1, from, hour, minute) : null;
  return d;
}
