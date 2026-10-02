import type { Client, Visit } from "./types";

export interface VisitFilters {
  q: string;
  stage: string;
  user: string;
  from: string;
  to: string;
  type: string;
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): VisitFilters {
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  return { q: get("q"), stage: get("stage"), user: get("user"), from: get("from"), to: get("to"), type: get("type") };
}

export function applyFilters(visits: Visit[], clients: Map<string, Client>, f: VisitFilters): Visit[] {
  const q = f.q.trim().toLowerCase();
  return visits.filter((v) => {
    if (f.stage && v.stage !== f.stage) return false;
    if (f.user && v.assignedTo !== f.user) return false;
    if (f.type && v.type !== f.type) return false;
    const day = v.scheduledAt.slice(0, 10);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    if (q) {
      const c = clients.get(v.clientId);
      const hay = `${v.code} ${c?.name ?? ""} ${c?.tradeName ?? ""} ${c?.contactName ?? ""} ${v.address.district} ${v.address.city}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
