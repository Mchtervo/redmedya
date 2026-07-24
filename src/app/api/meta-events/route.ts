import { NextRequest, NextResponse } from "next/server";
import { sendMetaCapiEvent } from "@/lib/meta-capi";

/**
 * Meta Conversions API (CAPI) — sunucu taraflı olay gönderimi.
 * Tarayıcı pikseli + bu route AYNI event_id'yi kullanır; Meta çiftleri ayıklar.
 * iPhone / adblock kullanıcılarında bile sinyal kaybolmaz.
 *
 * Kurulum: Events Manager → Ayarlar → Conversions API → Token oluştur →
 * META_CAPI_ACCESS_TOKEN olarak .env'e ekle. Token yoksa route sessizce
 * "skipped" döner (hata vermez).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      eventName?: string;
      eventId?: string;
      eventSourceUrl?: string;
      value?: number;
      currency?: string;
      contentName?: string;
      contentIds?: string[];
      customer?: {
        email?: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
      };
      fbp?: string;
      fbc?: string;
    };

    if (!body.eventName || !body.eventId) {
      return NextResponse.json(
        { ok: false, error: "eventName ve eventId gerekli" },
        { status: 400 }
      );
    }

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;
    const clientUserAgent = request.headers.get("user-agent") || undefined;

    const result = await sendMetaCapiEvent(body.eventName, {
      eventId: body.eventId,
      actionSource: "website",
      eventSourceUrl: body.eventSourceUrl,
      userData: {
        email: body.customer?.email,
        phone: body.customer?.phone,
        firstName: body.customer?.firstName,
        lastName: body.customer?.lastName,
        fbp: body.fbp,
        fbc: body.fbc,
        clientIp,
        clientUserAgent,
      },
      customData: {
        value: body.value,
        currency: body.currency ?? "TRY",
        contentName: body.contentName,
        contentIds: body.contentIds,
      },
    });

    // Sessiz düşme YOK — sunucu loglarında (Hostinger "Çalışma zamanı günlükleri") görünsün
    if (result.skipped) {
      console.error(
        "[CAPI] ATLANDI: META_CAPI_ACCESS_TOKEN sunucu ortamında TANIMLI DEĞİL. " +
          "Hostinger → Ortam değişkenleri'ne ekleyip 'Değişiklikleri uygula' + 'Yeniden Dağıt' yapın."
      );
    } else if (!result.ok) {
      console.error(`[CAPI] Meta reddetti (${body.eventName}):`, result.error);
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("[CAPI] route hatası:", e);
    return NextResponse.json(
      { ok: false, error: "CAPI isteği başarısız" },
      { status: 500 }
    );
  }
}
