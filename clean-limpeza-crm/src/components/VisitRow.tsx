import Link from "next/link";
import { Avatar, Pill, StageBadge } from "./ui";
import { NavButtons } from "./Maps";
import { PRIORITY_META, VISIT_TYPE_LABEL } from "@/lib/constants";
import { money, nowLocal, relativeDay, timeBR } from "@/lib/format";
import type { Client, PublicUser, Visit } from "@/lib/types";

export default function VisitRow({
  visit,
  client,
  user,
  showNav = false,
}: {
  visit: Visit;
  client?: Client;
  user?: PublicUser;
  showNav?: boolean;
}) {
  const overdue = visit.stage === "agendada" && visit.scheduledAt < nowLocal();
  return (
    <div className="flex flex-col gap-3 px-4 py-3 transition hover:bg-slate-50 sm:flex-row sm:items-center">
      <Link href={`/visitas/${visit.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className={`flex w-16 shrink-0 flex-col items-center rounded-lg py-1.5 ${overdue ? "bg-rose-50 text-rose-700" : "bg-brand-50 text-brand-700"}`}>
          <span className="text-[10px] font-semibold uppercase">{relativeDay(visit.scheduledAt)}</span>
          <span className="text-sm font-bold">{timeBR(visit.scheduledAt)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-slate-900">{client?.name ?? "Cliente removido"}</p>
            <StageBadge stage={visit.stage} />
            {visit.priority === "alta" && <Pill className={PRIORITY_META.alta.cls}>Prioridade alta</Pill>}
            {overdue && <Pill className="bg-rose-100 text-rose-700">Atrasada</Pill>}
          </div>
          <p className="truncate text-xs text-slate-500">
            {visit.code} · {VISIT_TYPE_LABEL[visit.type]}
            {visit.address.district ? ` · ${visit.address.district}` : ""}
            {visit.sale ? ` · ${money(visit.sale.total)}` : visit.estimatedValue ? ` · est. ${money(visit.estimatedValue)}` : ""}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-3 sm:justify-end">
        {showNav && visit.stage === "agendada" && <NavButtons address={visit.address} compact />}
        {user && (
          <span className="flex items-center gap-2 text-xs text-slate-600">
            <Avatar name={user.name} color={user.color} size="sm" />
            <span className="hidden md:inline">{user.name.split(" ")[0]}</span>
          </span>
        )}
      </div>
    </div>
  );
}
