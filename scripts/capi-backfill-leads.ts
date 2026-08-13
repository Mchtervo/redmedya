/**
 * Son 7 günde leads.json'a düşen ama Meta'ya gitmemiş kayıtlar için CAPI backfill.
 *
 * Her lead için Lead + Contact + WhatsAppClick:
 *   - event_time = lead.createdAt (unix)
 *   - event_id   = backfill_<event>_<leadId> (stabil, dedupe)
 * Gönderim /api/meta-events üzerinden (CAPI_BACKFILL_TOKEN gerekir).
 * 7 günden eski atlanır. Başarılı gönderimler data/capi_backfill_sent.json'a yazılır.
 *
 * Kullanım:
 *   CAPI_BACKFILL_TOKEN=... META_EVENTS_URL=https://redmediadugun.com/api/meta-events \
 *     npx tsx scripts/capi-backfill-leads.ts
 *   npx tsx scripts/capi-backfill-leads.ts --dry-run
 */
import { readFileSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { dataPath } from "../src/lib/data-dir";
import { readLeads } from "../src/lib/leads-store";
import { siteConfig } from "../src/config/site";
import {
  alreadySent,
  BACKFILL_EVENT_NAMES,
  backfillEventId,
  eventTimeUnix,
  isWithinBackfillWindow,
  markSent,
  type BackfillEventName,
  type BackfillSentFile,
} from "../src/lib/capi-backfill";

const SENT_FILE = dataPath("capi_backfill_sent.json");
const DEFAULT_SOURCE_URL = "https://redmediadugun.com/paket-olustur";
const DELAY_MS = 250;

function loadDotenv(): void {
  const files = [".env.local", ".env"];
  for (const file of files) {
    try {
      const raw = readFileSync(path.resolve(file), "utf-8");
      for (const line of raw.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const i = t.indexOf("=");
        if (i < 0) continue;
        const k = t.slice(0, i).trim();
        let v = t.slice(i + 1).trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) process.env[k] = v;
      }
    } catch {
      /* dosya yok */
    }
  }
}

async function readSent(): Promise<BackfillSentFile> {
  try {
    const parsed = JSON.parse(await readFile(SENT_FILE, "utf-8")) as BackfillSentFile;
    if (parsed && typeof parsed.sent === "object" && parsed.sent) return parsed;
  } catch {
    /* empty */
  }
  return { sent: {} };
}

async function writeSent(file: BackfillSentFile): Promise<void> {
  await mkdir(path.dirname(SENT_FILE), { recursive: true });
  await writeFile(SENT_FILE, JSON.stringify(file, null, 2), "utf-8");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type CapiJson = {
  ok?: boolean;
  skipped?: boolean;
  debug?: boolean;
  error?: string;
};

async function postEvent(opts: {
  url: string;
  token: string;
  eventName: BackfillEventName;
  eventId: string;
  eventTime: number;
  value?: number;
  contentName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  externalId?: string;
  fbp?: string;
  fbc?: string;
}): Promise<CapiJson> {
  const res = await fetch(opts.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-capi-backfill-token": opts.token,
    },
    body: JSON.stringify({
      backfill: true,
      eventName: opts.eventName,
      eventId: opts.eventId,
      eventTime: opts.eventTime,
      eventSourceUrl: DEFAULT_SOURCE_URL,
      value: opts.value,
      currency: "TRY",
      contentName: opts.contentName,
      customer: {
        firstName: opts.firstName,
        lastName: opts.lastName,
        phone: opts.phone,
        externalId: opts.externalId,
      },
      fbp: opts.fbp,
      fbc: opts.fbc,
    }),
  });
  return (await res.json().catch(() => null)) as CapiJson;
}

async function main(): Promise<void> {
  loadDotenv();
  const dryRun = process.argv.includes("--dry-run");
  const token = process.env.CAPI_BACKFILL_TOKEN?.trim() ?? "";
  const url =
    process.env.META_EVENTS_URL?.trim() ||
    `${siteConfig.url.replace(/\/$/, "")}/api/meta-events`;

  if (!dryRun && !token) {
    console.error(
      "CAPI_BACKFILL_TOKEN yok. Dry-run için --dry-run, canlı için token gerekli."
    );
    process.exit(1);
  }

  const leads = await readLeads();
  const sent = await readSent();
  const now = Date.now();
  const recent = leads.filter((l) => isWithinBackfillWindow(l.createdAt, now));
  const skippedOld = leads.length - recent.length;

  console.log(
    `[backfill] leads=${leads.length} pencere_ici=${recent.length} 7g_eski_atlanan=${skippedOld} dryRun=${dryRun} url=${url}`
  );

  let sentCount = 0;
  let skipMarked = 0;
  let failCount = 0;

  for (const lead of recent) {
    const eventTime = eventTimeUnix(lead.createdAt);
    const value = lead.cart?.total;
    const contentName =
      lead.source === "whatsapp" || lead.source === "tarihimi_kilitle"
        ? "tarihimi_kilitle"
        : lead.source || "lead_backfill";

    for (const eventName of BACKFILL_EVENT_NAMES) {
      if (alreadySent(sent, lead.id, eventName)) {
        skipMarked += 1;
        continue;
      }
      const eventId = backfillEventId(lead.id, eventName);
      if (dryRun) {
        console.log(
          `[dry-run] ${lead.id} ${eventName} event_id=${eventId} event_time=${eventTime}`
        );
        continue;
      }

      const result = await postEvent({
        url,
        token,
        eventName,
        eventId,
        eventTime,
        value,
        contentName,
        firstName: lead.customer?.firstName,
        lastName: lead.customer?.lastName,
        phone: lead.customer?.phone,
        externalId: lead.sessionId,
        fbp: lead.metaAttribution?.fbp,
        fbc: lead.metaAttribution?.fbc,
      });

      const ok = result?.ok === true && !result.skipped;
      if (ok) {
        markSent(sent, lead.id, eventName, eventId);
        await writeSent(sent);
        sentCount += 1;
        console.log(`[ok] ${lead.id} ${eventName}`);
      } else {
        failCount += 1;
        console.warn(
          `[fail] ${lead.id} ${eventName}`,
          result?.error ?? (result?.skipped ? "skipped" : "unknown")
        );
      }
      await sleep(DELAY_MS);
    }
  }

  console.log(
    `[backfill] bitti sent=${sentCount} zaten_isaretli=${skipMarked} fail=${failCount}`
  );
  if (failCount > 0) process.exit(1);
}

main().catch((e) => {
  console.error("[backfill] hata:", e instanceof Error ? e.message : e);
  process.exit(1);
});
