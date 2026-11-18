"use client";

import { useEffect } from "react";
import { siteConfig } from "@/config/site";

type ToolResult = { content: { type: "text"; text: string }[] };
type ModelContext = {
  registerTool: (tool: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    execute: (input: Record<string, unknown>) => Promise<ToolResult>;
  }) => unknown;
};

const text = (t: string): ToolResult => ({ content: [{ type: "text", text: t }] });

/**
 * WebMCP: tarayıcı içindeki yapay zekâ ajanlarına sitenin yapabildiklerini
 * araç olarak tanıtır (navigator.modelContext). Destek yoksa hiçbir şey yapmaz.
 * Araçlar hiçbir şey GÖNDERMEZ; sadece bilgi ve link döndürür.
 */
export function WebMcpTools() {
  useEffect(() => {
    const mc = (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
    if (!mc?.registerTool) return;
    try {
      mc.registerTool({
        name: "redmedya_paketleri",
        description:
          "REDMEDYA (Ankara düğün fotoğrafçısı ve düğün videosu) paketlerini, fiyatlarını, ek hizmetlerini, hizmet bölgesini ve iletişim bilgilerini Markdown olarak döndürür.",
        inputSchema: { type: "object", properties: {} },
        execute: async () => {
          const res = await fetch("/llms.txt");
          return text(await res.text());
        },
      });
      mc.registerTool({
        name: "redmedya_teklif_linki",
        description:
          "Düğün tarihi, paket ve not ile REDMEDYA'ya gönderilecek hazır WhatsApp teklif mesajının linkini ve paket oluşturucu linkini üretir. Mesajı kendisi göndermez; kullanıcı linke tıklayıp gönderir.",
        inputSchema: {
          type: "object",
          properties: {
            tarih: { type: "string", description: "Düğün tarihi (YYYY-AA-GG)" },
            paket: { type: "integer", enum: [1, 2, 3], description: "Paket numarası" },
            not: { type: "string", description: "Etkinlikler veya özel istekler" },
          },
        },
        execute: async (input) => {
          const parts = ["Merhaba REDMEDYA ekibi, web sitenizden ulaşıyorum."];
          if (input.tarih) parts.push(`Düğün tarihimiz: ${String(input.tarih)}.`);
          if (input.paket) parts.push(`Paket ${String(input.paket)} ile ilgileniyoruz.`);
          if (input.not) parts.push(String(input.not));
          parts.push("Bilgi ve teklif almak istiyorum.");
          const wa = `https://wa.me/${siteConfig.defaultWhatsApp}?text=${encodeURIComponent(parts.join(" "))}`;
          const builder = `${siteConfig.url}/paket-olustur${input.paket ? `?p=${String(input.paket)}` : ""}`;
          return text(`WhatsApp teklif linki: ${wa}\nPaket oluşturucu (canlı fiyat): ${builder}`);
        },
      });
    } catch {
      // Ajan desteği deneysel; hata siteyi etkilemesin.
    }
  }, []);
  return null;
}
