/**
 * WhatsApp gizli kimlik (LID): bazı müşterilerin mesajı telefon numarası yerine "275363942928431@lid" gibi
 * bir kodla gelir; Evolution numarayı vermez. Burada kodu doğru çifte bağlarız:
 *  1) Daha önce eşleşmişse (DATA_DIR/ai-wa-lid.json) → o çift
 *  2) Değilse: son 7 günde WhatsApp'tan yazdığımız çiftler arasında, WhatsApp'taki görünen ad (pushName)
 *     ve son mesajımızın ne kadar yeni olduğuna göre puanla; tek ve net bir aday varsa eşleştir ve hatırla.
 *  3) Emin değilse null → çağıran sahibine Telegram'dan iletir (mesaj kaybolmaz).
 */
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { readCouples } from "@/lib/ai-couples/store";
import type { AiCouple } from "@/types/ai-couples";

const FILE = dataPath("ai-wa-lid.json");
type LidMap = Record<string, { phone: string; at: string; how: string }>;

let chain: Promise<unknown> = Promise.resolve();
function withMap<T>(fn: (m: LidMap) => Promise<{ map?: LidMap; out: T }>): Promise<T> {
  const run = chain.then(async () => {
    let m: LidMap = {};
    try {
      m = JSON.parse(await readFile(FILE, "utf-8")) as LidMap;
    } catch {
      m = {};
    }
    const r = await fn(m);
    if (r.map) {
      await mkdir(path.dirname(FILE), { recursive: true });
      const tmp = `${FILE}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(r.map, null, 1), "utf-8");
      await rename(tmp, FILE);
    }
    return r.out;
  });
  chain = run.catch(() => undefined);
  return run;
}

const fold = (t: string) =>
  t
    .normalize("NFKC")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Görünen ad ↔ kayıttaki isim benzerliği (0–6) */
function nameScore(pushName: string, name: string): number {
  const p = fold(pushName);
  const n = fold(name);
  if (!p || !n) return 0;
  const pt = p.split(" ");
  const nt = n.split(" ");
  if (p === n) return 6;
  // "S.C" / "SC" → baş harfler
  const letters = p.replace(/ /g, "");
  const initials = nt.map((w) => w[0]).join("");
  if (letters.length >= 2 && letters.length <= 3 && letters === initials) return 5;
  if (pt.some((w) => w.length >= 3 && nt[0] === w)) return 5; // ilk isim aynı
  if (pt.some((w) => w.length >= 3 && nt.includes(w))) return 4; // soyadı ya da başka isim
  if (pt.some((w) => w.length >= 4 && nt.some((x) => x.startsWith(w.slice(0, 4))))) return 2;
  return 0;
}

/** Kod → çift. fromMe: sahibinin o sohbete yazdığı mesaj (sadece bilinen eşleşme kullanılır, tahmin yapılmaz) */
export async function resolveLid(lid: string, pushName: string, fromMe: boolean): Promise<AiCouple | null> {
  const couples = await readCouples();
  const known = await withMap(async (m) => ({ out: m[lid]?.phone }));
  if (known) return couples.find((c) => c.phone === known) ?? null;
  if (fromMe) return null;

  const now = Date.now();
  const mapped = await withMap(async (m) => ({ out: new Set(Object.values(m).map((x) => x.phone)) }));
  const scored = couples
    .filter((c) => !mapped.has(c.phone) && c.sourceRef !== "test")
    .map((c) => {
      const lastOut = [...c.messages].reverse().find((m) => m.direction === "out" && m.channel === "whatsapp");
      const age = lastOut ? now - Date.parse(lastOut.at) : Infinity;
      if (age > 7 * 86400_000) return null;
      const recency = age < 3600_000 ? 3 : age < 6 * 3600_000 ? 2 : age < 86400_000 ? 1 : 0;
      return { c, s: nameScore(pushName, c.name) * 2 + recency, ns: nameScore(pushName, c.name) };
    })
    .filter((x): x is { c: AiCouple; s: number; ns: number } => !!x)
    .sort((a, b) => b.s - a.s);
  const best = scored[0];
  const second = scored[1];
  // İsim benzerliği şart (sadece zamana bakıp yanlış kişiye bağlamayalım) + ikinciden net önde
  if (!best || best.ns < 4 || (second && best.s - second.s < 3)) return null;
  await withMap(async (m) => ({ map: { ...m, [lid]: { phone: best.c.phone, at: new Date().toISOString(), how: `görünen ad "${pushName}" ↔ ${best.c.name}` } }, out: null }));
  return best.c;
}

const alerted = new Set<string>();
/** Aynı mesaj için tek uyarı */
export function shouldAlertLid(key: string): boolean {
  if (alerted.has(key)) return false;
  alerted.add(key);
  if (alerted.size > 500) alerted.clear();
  return true;
}

/** Bilinen eşleşme: kod → telefon (yoksa undefined) */
export function lidPhone(lid: string): Promise<string | undefined> {
  return withMap(async (m) => ({ out: m[lid]?.phone }));
}

/** Kesin bilinen eşleşmeyi kaydet (ör. aynı mesaj hem numara hem kodla kayıtlı) */
export function rememberLid(lid: string, phone: string, how: string): Promise<void> {
  return withMap(async (m) => (m[lid]?.phone === phone ? { out: undefined } : { map: { ...m, [lid]: { phone, at: new Date().toISOString(), how } }, out: undefined }));
}
