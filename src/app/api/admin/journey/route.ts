import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session";
import { readEvents, type TrackedEvent } from "@/lib/track/events-store";
import { readPackageDrafts } from "@/lib/package-drafts-store";
import { summarizeVisits } from "@/lib/track/visits-store";

/**
 * §12 — Admin yolculuk analitiği. Auth zorunlu.
 * ?session=xxx → tek oturumun kronolojik olayları.
 * Aksi halde: özet + oturum listesi + Yarım Kalanlar.
 */
function maxStepOf(events: TrackedEvent[]): number {
  let step = 1;
  for (const e of events) {
    if (e.event_type === "step_advanced") {
      const to = Number((e.payload as { to?: number }).to);
      if (to > step) step = to;
    }
    if (e.event_type === "whatsapp_clicked") step = 4;
  }
  return step;
}

export async function GET(request: NextRequest) {
  const jar = await cookies();
  if (!verifyAdminSessionToken(jar.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const events = await readEvents(8000);
  const visits = await summarizeVisits();
  const sessionParam = request.nextUrl.searchParams.get("session");

  // Tek oturum → kronolojik olaylar
  if (sessionParam) {
    const list = events
      .filter((e) => e.session_id === sessionParam)
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    return NextResponse.json({ session: sessionParam, events: list });
  }

  // Oturum bazlı gruplama
  const bySession = new Map<string, TrackedEvent[]>();
  for (const e of events) {
    const arr = bySession.get(e.session_id) ?? [];
    arr.push(e);
    bySession.set(e.session_id, arr);
  }

  // Oturum → KİŞİ eşlemesi (taslaktaki ad/telefon) — "kim bastı" görünsün
  const drafts = await readPackageDrafts();
  const personBySession = new Map<string, { name: string; phone: string }>();
  for (const d of drafts) {
    const name = [d.customer.firstName, d.customer.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (name || d.customer.phone?.trim()) {
      personBySession.set(d.sessionId, {
        name,
        phone: d.customer.phone?.trim() ?? "",
      });
    }
  }

  /** Oturumun sepet tutarı = tutar taşıyan SON olay (cart_updated / whatsapp_clicked / form_*) */
  const totalOf = (evs: TrackedEvent[]): number => {
    for (let i = evs.length - 1; i >= 0; i--) {
      const t = Number((evs[i].payload as { total?: number }).total);
      if (Number.isFinite(t) && t > 0) return t;
    }
    return 0;
  };

  const sessions = [...bySession.entries()].map(([id, evs]) => {
    const sorted = evs.sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
    );
    const wa = sorted.find((e) => e.event_type === "whatsapp_clicked");
    return {
      session_id: id,
      firstTs: sorted[0]?.ts ?? null,
      lastTs: sorted[sorted.length - 1]?.ts ?? null,
      maxStep: maxStepOf(sorted),
      whatsapp: Boolean(wa),
      total: totalOf(sorted),
      name: personBySession.get(id)?.name ?? "",
      phone: personBySession.get(id)?.phone ?? "",
      utm_source: sorted[0]?.utm_source ?? null,
      utm_campaign: sorted[0]?.utm_campaign ?? null,
      device: sorted[0]?.device ?? null,
      eventCount: sorted.length,
    };
  });

  // Özet
  const now = Date.now();
  const dayAgo = now - 864e5;
  const weekAgo = now - 7 * 864e5;
  const inRange = (ts: string | null, from: number) =>
    ts ? new Date(ts).getTime() >= from : false;

  const count = (t: string) => events.filter((e) => e.event_type === t).length;
  const modeOf = (t: string, key: string) => {
    const freq = new Map<string, number>();
    for (const e of events) {
      if (e.event_type !== t) continue;
      const v = String((e.payload as Record<string, unknown>)[key] ?? "");
      if (!v) continue;
      freq.set(v, (freq.get(v) ?? 0) + 1);
    }
    let best = "";
    let bestN = 0;
    for (const [k, n] of freq) {
      if (n > bestN) {
        best = k;
        bestN = n;
      }
    }
    return best || "—";
  };

  const upsellShown = count("upsell_shown");
  const lastShown = count("lastchance_shown");
  const waSessions = sessions.filter((s) => s.whatsapp);
  const pvSessions = sessions.filter((s) =>
    bySession.get(s.session_id)?.some((e) => e.event_type === "page_view")
  );
  // Ort. sepet — sepet kuran TÜM oturumlar (dönüşüm şart değil)
  const cartSessions = sessions.filter((s) => s.total > 0);
  const avgCart = cartSessions.length
    ? Math.round(cartSessions.reduce((a, s) => a + s.total, 0) / cartSessions.length)
    : 0;

  const summary = {
    /**
     * GERÇEK TRAFİK — anonim sayaçtan (çerez onayı beklemez, kişisel veri yok).
     * Panel artık yalnızca onay verenleri değil, tüm ziyaretleri gösterir.
     */
    visitorsToday: visits.today,
    visitorsWeek: visits.week,
    /** Bunlardan reklamla (UTM'li) gelenler — reklam trafiği net görünsün */
    utmToday: visits.todayUtm,
    utmWeek: visits.weekUtm,
    topVisitCampaign: visits.topCampaign,
    /** Journey detayı hâlâ RIZAYA bağlı; kıyas için onaylı oturum sayısı */
    consentedToday: sessions.filter((s) => inRange(s.firstTs, dayAgo)).length,
    consentedWeek: sessions.filter((s) => inRange(s.firstTs, weekAgo)).length,
    packagesBuilt: count("package_selected"),
    whatsappClicks: count("whatsapp_clicked"),
    conversionRate: pvSessions.length
      ? Math.round((waSessions.length / pvSessions.length) * 100)
      : 0,
    avgCart,
    topPackage: modeOf("package_selected", "package_id"),
    topPlato: modeOf("plato_selected", "plato"),
    topAddon: modeOf("addon_added", "addon_id"),
    upsellAcceptRate: upsellShown
      ? Math.round((count("upsell_accepted") / upsellShown) * 100)
      : 0,
    lastchanceRecoveryRate: lastShown
      ? Math.round((count("lastchance_accepted") / lastShown) * 100)
      : 0,
  };

  /**
   * §6 — Adım 3 mikro funnel. İnsanların 3. adımda TAM hangi alanda düştüğü.
   * step3_view → form_start → date_filled → name_filled → cta_click → whatsapp
   * WhatsApp kısayolu (Adım 2'den geçenler) ayrı sayılır.
   */
  const step3Funnel = {
    step3_view: count("step3_view"),
    form_start: count("form_start"),
    date_filled: count("date_filled"),
    name_filled: count("name_filled"),
    cta_click: count("cta_click"),
    whatsapp: count("whatsapp_clicked"),
    // WhatsApp kısayolu (form atlama) — Adım 2'den
    shortcut_open: count("wa_shortcut_open"),
    shortcut_sent: count("wa_shortcut_sent"),
    // Çıkış yakalama
    exit_shown: count("exit_capture_shown"),
    exit_whatsapp: count("exit_capture_whatsapp"),
    exit_copy: count("exit_capture_copy"),
  };

  // Yarım Kalanlar — telefon bırakıp WhatsApp'a BASMAYAN taslaklar
  const abandoners = drafts
    .filter((d) => !d.whatsappClicked && d.customer.phone?.trim())
    .map((d) => ({
      sessionId: d.sessionId,
      name: [d.customer.firstName, d.customer.lastName].filter(Boolean).join(" "),
      phone: d.customer.phone,
      weddingDate: d.customer.weddingDate,
      lineSummary: d.lineSummary,
      total: d.total,
      updatedAt: d.updatedAt,
      called: Boolean(d.called),
      lastStep: maxStepOf(bySession.get(d.sessionId) ?? []),
    }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return NextResponse.json({
    summary,
    sessions: sessions.sort(
      (a, b) =>
        new Date(b.lastTs ?? 0).getTime() - new Date(a.lastTs ?? 0).getTime()
    ),
    abandoners,
    /** Son 14 günün anonim trafiği (toplam + reklamlı) */
    visitsDaily: visits.daily,
    /** §6 Adım 3 alan bazlı funnel */
    step3Funnel,
    campaigns: [
      ...new Set(sessions.map((s) => s.utm_campaign).filter(Boolean)),
    ] as string[],
  });
}
