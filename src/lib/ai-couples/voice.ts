/**
 * Telegram sesli komut: ses dosyasını indir → ElevenLabs ile yazıya çevir → komuta dönüştür.
 * ElevenLabs anahtarı DATA_DIR/ai-integrations.json içinde (n8n kurulumu /api/ai/settings ile yazar).
 */
import { readIntegrations } from "@/lib/ai-couples/integrations";

export async function transcribeTelegramVoice(fileId: string): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const { elevenlabsKey } = await readIntegrations();
  if (!token || !elevenlabsKey) return null;

  const meta = (await fetch(`https://api.telegram.org/bot${token}/getFile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
    signal: AbortSignal.timeout(10000),
  })
    .then((r) => r.json())
    .catch(() => null)) as { ok?: boolean; result?: { file_path?: string; file_size?: number } } | null;
  const filePath = meta?.result?.file_path;
  if (!meta?.ok || !filePath || (meta.result?.file_size ?? 0) > 10_000_000) return null;

  const audio = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`, { signal: AbortSignal.timeout(20000) })
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .catch(() => null);
  if (!audio) return null;

  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("language_code", "tr");
  form.append("file", new Blob([audio], { type: "audio/ogg" }), "ses.ogg");
  const stt = (await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": elevenlabsKey },
    body: form,
    signal: AbortSignal.timeout(40000),
  })
    .then((r) => r.json())
    .catch(() => null)) as { text?: string } | null;
  return stt?.text?.trim() || null;
}

function fold(s: string) {
  return s.toLocaleLowerCase("tr-TR").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c");
}

/** "Bugünün raporunu ver" → "/rapor", "Nur Aytekin ne durumda" → "/bul Nur Aytekin" */
export function voiceToCommand(spoken: string): string {
  const t = fold(spoken).replace(/[.,!?]/g, " ");
  if (/rapor|ozet|bugun ne yaptik|durum nasil/.test(t)) return "/rapor";
  if (/bekleyen|cevap (yazan|veren|bekleyen)|donmemiz|donulmesi|yanit/.test(t)) return "/bekleyen";
  if (/kara ?liste|istemeyen/.test(t)) return "/karaliste";
  if (/sicak/.test(t)) return "/sicak";
  if (/ilik/.test(t)) return "/ilik";
  if (/soguk/.test(t)) return "/soguk";
  if (/kontenjan|bos yer|kac yer|kalan yer/.test(t)) return "/kontenjan";
  if (/sira|siradaki|kimi arayacak|kime yazacak/.test(t)) return "/sira";
  if (/yardim|komut/.test(t)) return "/yardim";
  // İsim/telefon araması: dolgu kelimeleri at
  const q = spoken
    .replace(/[.,!?]/g, " ")
    .replace(/\b(ne durumda|durumu ne|nasil|bul|ara|bak|bilgi|ver|getir|hakkinda|hakkında|ile ilgili|çiftin|çifti|lütfen)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `/bul ${q}`;
}
