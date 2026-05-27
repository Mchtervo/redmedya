import { readPackageDrafts } from "@/lib/package-drafts-store";
import { readLeads } from "@/lib/leads-store";
import { readReservations } from "@/lib/reservations-store";
import { readCmsConfig } from "@/lib/cms";
import type { PackageDraftRecord } from "@/types/package-drafts";
import type { LeadRecord } from "@/types/site-settings";
import type { LeadLineDetail } from "@/types/reservations";

export type ServiceStat = {
  serviceId: string;
  label: string;
  count: number;
};

export type PackageInsights = {
  totals: {
    draftsWithCart: number;
    whatsappClicked: number;
    abandoned: number;
    leads: number;
    reservations: number;
  };
  serviceStats: ServiceStat[];
  abandonedDrafts: PackageDraftRecord[];
};

function bumpGlobal(
  map: Map<string, ServiceStat>,
  serviceId: string,
  label: string
) {
  const cur = map.get(serviceId);
  if (cur) cur.count += 1;
  else map.set(serviceId, { serviceId, label, count: 1 });
}

/** Oturum başına aynı hizmet yalnızca 1 kez sayılır */
function countServicesInSession(
  global: Map<string, ServiceStat>,
  sessionSeen: Set<string>,
  serviceId: string,
  label: string
) {
  if (!serviceId || sessionSeen.has(serviceId)) return;
  sessionSeen.add(serviceId);
  bumpGlobal(global, serviceId, label);
}

function buildCmsLookups(services: { id: string; name: string }[]) {
  const idToName = new Map<string, string>();
  const nameToId = new Map<string, string>();
  for (const s of services) {
    idToName.set(s.id, s.name);
    nameToId.set(s.name.trim().toLowerCase(), s.id);
    nameToId.set(s.id, s.id);
  }
  return { idToName, nameToId };
}

function resolveIdFromLabel(
  label: string,
  nameToId: Map<string, string>
): string | null {
  const key = label.trim().toLowerCase();
  return nameToId.get(key) ?? null;
}

function recordDraftOrLeadSession(
  global: Map<string, ServiceStat>,
  selectedIds: string[],
  lineDetails: LeadLineDetail[],
  lineSummary: string[],
  idToName: Map<string, string>,
  nameToId: Map<string, string>
) {
  const sessionSeen = new Set<string>();

  for (const id of selectedIds) {
    if (!id) continue;
    countServicesInSession(
      global,
      sessionSeen,
      id,
      idToName.get(id) ?? id
    );
  }

  if (sessionSeen.size > 0) return;

  for (const line of lineDetails) {
    const id =
      resolveIdFromLabel(line.label, nameToId) ??
      `label:${line.label.trim().toLowerCase()}`;
    countServicesInSession(global, sessionSeen, id, line.label);
  }

  for (const name of lineSummary) {
    const id =
      resolveIdFromLabel(name, nameToId) ??
      `label:${name.trim().toLowerCase()}`;
    countServicesInSession(global, sessionSeen, id, name);
  }
}

function recordLead(
  global: Map<string, ServiceStat>,
  lead: LeadRecord,
  idToName: Map<string, string>,
  nameToId: Map<string, string>
) {
  recordDraftOrLeadSession(
    global,
    lead.cart.selectedIds ?? [],
    lead.lineDetails ?? [],
    lead.cart.lineSummary ?? [],
    idToName,
    nameToId
  );
}

export async function buildPackageInsights(): Promise<PackageInsights> {
  const [drafts, leads, reservations, cms] = await Promise.all([
    readPackageDrafts(),
    readLeads(),
    readReservations(),
    readCmsConfig(),
  ]);

  const { idToName, nameToId } = buildCmsLookups(cms.services);

  const statMap = new Map<string, ServiceStat>();

  const withCart = drafts.filter((d) => d.count > 0);
  const clicked = withCart.filter((d) => d.whatsappClicked);
  const abandoned = withCart.filter((d) => !d.whatsappClicked);

  for (const d of drafts) {
    if (d.count === 0 && d.lineDetails.length === 0) continue;
    recordDraftOrLeadSession(
      statMap,
      d.selectedIds,
      d.lineDetails,
      d.lineSummary,
      idToName,
      nameToId
    );
  }

  for (const l of leads) {
    recordLead(statMap, l, idToName, nameToId);
  }

  const serviceStats = [...statMap.values()]
    .filter((s) => !s.serviceId.startsWith("label:") || s.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    totals: {
      draftsWithCart: withCart.length,
      whatsappClicked: clicked.length,
      abandoned: abandoned.length,
      leads: leads.length,
      reservations: reservations.length,
    },
    serviceStats,
    abandonedDrafts: abandoned.slice(0, 100),
  };
}
