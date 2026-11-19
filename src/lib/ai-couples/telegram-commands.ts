/** Telegram komutlarının cevapları (webhook + n8n sesli komut). */
import { buildQueue } from "@/lib/ai-couples/queue";
import { buildDailyReport, capacityText, coupleDetailText, gradeListText } from "@/lib/ai-couples/report";
import { displayPhone, normalizePhone } from "@/lib/ai-couples/rules";
import { readCouples } from "@/lib/ai-couples/store";

const HELP = [
  "🤖 RED MEDIA asistan komutları",
  "/rapor — bugünün raporu",
  "/sicak · /ilik · /soguk · /karaliste — listeler",
  "/sira — şu an sıradaki aramalar ve mesajlar",
  "/bekleyen — cevap yazıp sizden dönüş bekleyen çiftler",
  "/kontenjan — aylık kalan yerler",
  "/bul Ayşe  ya da  /bul 0532… — çift detayı",
  "🎙️ Sesli mesajla da sorabilirsin: \"bugünün raporu\", \"sıcak çiftler\", \"Nur Aytekin ne durumda\"",
].join("\n");

function fold(s: string) {
  return s.toLocaleLowerCase("tr-TR").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c");
}

export async function answerCommand(input: string): Promise<string> {
  const text = input.trim();
  const [cmdRaw, ...rest] = text.split(/\s+/);
  const cmd = fold(cmdRaw.replace(/^\//, "").replace(/@.*$/, ""));
  const arg = rest.join(" ").trim();
  const couples = await readCouples();

  if (["start", "yardim", "help"].includes(cmd)) return HELP;
  if (cmd === "rapor") return (await buildDailyReport()).text;
  if (cmd === "sicak") return gradeListText(couples, "hot");
  if (cmd === "ilik") return gradeListText(couples, "warm");
  if (cmd === "soguk") return gradeListText(couples, "cold");
  if (cmd === "karaliste") return gradeListText(couples, "blacklist");
  if (cmd === "kontenjan") return capacityText();
  if (cmd === "bekleyen") {
    const waiting = couples.filter((c) => !c.contactLocked && c.messages[c.messages.length - 1]?.direction === "in");
    if (!waiting.length) return "✅ Şu an dönüş bekleyen çift yok.";
    return [
      `💬 Dönüş bekleyen çiftler (${waiting.length})`,
      ...waiting.slice(0, 25).map((c) => {
        const m = c.messages[c.messages.length - 1];
        return `• ${c.name} · ${displayPhone(c.phone)}\n   "${m.text.replace(/\s+/g, " ").slice(0, 120)}"`;
      }),
    ].join("\n");
  }
  if (cmd === "sira") {
    const q = await buildQueue(new Date(), 15);
    if (!q.length) return "⏭️ Şu an sırada iş yok (saat dışı olabilir veya bekleyen çift yok).";
    return ["⏭️ Sıradakiler", ...q.map((a) => `• ${a.type === "call" ? "📞" : "💬"} ${a.name} · ${displayPhone(a.phone)} — ${a.reason}`)].join("\n");
  }

  const query = cmd === "bul" ? arg : text.replace(/^\//, "");
  if (!query) return HELP;
  const phone = normalizePhone(query);
  const fq = fold(query);
  const hits = couples.filter((c) => (phone ? c.phone === phone : fold(c.name).includes(fq)));
  if (!hits.length) return `🔎 "${query}" bulunamadı.\n\n${HELP}`;
  if (hits.length > 1) {
    return [`🔎 ${hits.length} sonuç:`, ...hits.slice(0, 10).map((c) => `• ${c.name} · ${displayPhone(c.phone)}`)].join("\n");
  }
  return coupleDetailText(hits[0]);
}

