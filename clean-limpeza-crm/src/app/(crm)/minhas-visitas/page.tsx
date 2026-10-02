import Link from "next/link";
import Icon from "@/components/Icon";
import { NavButtons } from "@/components/Maps";
import NewVisitButton from "@/components/NewVisitButton";
import QuickStart from "@/components/QuickStart";
import { EmptyState, LinkButton, StageBadge } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { byScheduled, loadScoped } from "@/lib/queries";
import { addDays, longDate, money, nowLocal, phoneBR, timeBR, todayLocal } from "@/lib/format";
import { addressLine, mapsRouteUrl, whatsappUrl } from "@/lib/maps";
import { VISIT_TYPE_LABEL } from "@/lib/constants";

export const metadata = { title: "Minha rota do dia" };

export default async function MyVisitsPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const me = await requireUser();
  const { d } = await searchParams;
  const day = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : todayLocal();
  const { db, users } = await loadScoped(me);
  const mine = db.visits.filter((v) => v.assignedTo === me.id);
  const list = mine.filter((v) => v.scheduledAt.startsWith(day) && v.stage !== "perdida").sort(byScheduled);
  const clientById = new Map(db.clients.map((c) => [c.id, c]));
  const pending = list.filter((v) => v.stage === "agendada" || v.stage === "em_andamento");
  const route = mapsRouteUrl(pending.map((v) => v.address));
  const done = list.length - pending.length;
  const soldToday = list.reduce((s, v) => s + (v.sale?.total ?? 0), 0);
  const now = nowLocal();
  const overdue = mine.filter((v) => v.stage === "agendada" && v.scheduledAt.slice(0, 10) < todayLocal()).sort(byScheduled);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href={`/minhas-visitas?d=${addDays(day, -1)}`} className="rounded-lg p-2 text-slate-600 hover:bg-white" aria-label="Dia anterior">
          <Icon name="chevronLeft" className="h-5 w-5" />
        </Link>
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">{day === todayLocal() ? "Minha rota de hoje" : "Rota do dia"}</h1>
          <p className="text-sm text-slate-500">{longDate(day)}</p>
        </div>
        <Link href={`/minhas-visitas?d=${addDays(day, 1)}`} className="rounded-lg p-2 text-slate-600 hover:bg-white" aria-label="Próximo dia">
          <Icon name="chevronRight" className="h-5 w-5" />
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="card p-3">
          <p className="text-2xl font-bold text-brand-700">{pending.length}</p>
          <p className="text-[11px] text-slate-500">a realizar</p>
        </div>
        <div className="card p-3">
          <p className="text-2xl font-bold text-emerald-600">{done}</p>
          <p className="text-[11px] text-slate-500">concluídas</p>
        </div>
        <div className="card p-3">
          <p className="break-words text-base font-bold leading-8 text-slate-900">{money(soldToday)}</p>
          <p className="text-[11px] text-slate-500">vendido</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {route && (
          <LinkButton href={route} external icon="route" size="lg" className="flex-1">
            Abrir rota completa no GPS ({pending.length} paradas)
          </LinkButton>
        )}
        <NewVisitButton clients={db.clients} users={users} me={me} label="Nova visita" variant="secondary" scheduledAt={`${day}T09:00`} />
      </div>

      {overdue.length > 0 && day === todayLocal() && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <strong>{overdue.length} visita(s) atrasada(s)</strong> de dias anteriores:{" "}
          {overdue.slice(0, 3).map((v, i) => (
            <span key={v.id}>
              {i > 0 && ", "}
              <Link href={`/visitas/${v.id}`} className="font-semibold underline">
                {clientById.get(v.clientId)?.name}
              </Link>
            </span>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState icon="navigation" title="Nenhuma visita neste dia" text="Quando o gerenciador agendar visitas para você, elas aparecem aqui." />
      ) : (
        <ol className="space-y-4">
          {list.map((v, i) => {
            const c = clientById.get(v.clientId);
            const phone = c?.whatsapp || c?.phone || "";
            const wa = whatsappUrl(phone, `Olá! Aqui é ${me.name.split(" ")[0]} da Clean Limpeza, estou a caminho para nossa visita.`);
            const late = v.stage === "agendada" && v.scheduledAt < now;
            return (
              <li key={v.id} className={`card overflow-hidden ${v.stage === "em_andamento" ? "ring-2 ring-amber-400" : ""}`}>
                <div className="flex items-start gap-3 p-4">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${late ? "bg-rose-500" : "bg-brand-600"}`}>{i + 1}</span>
                    <span className="mt-1 text-sm font-bold text-slate-800">{timeBR(v.scheduledAt)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/visitas/${v.id}`} className="text-lg font-bold text-slate-900 hover:text-brand-700">
                        {c?.name}
                      </Link>
                      <StageBadge stage={v.stage} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {VISIT_TYPE_LABEL[v.type]} · {v.code}
                    </p>
                    <p className="mt-2 flex gap-1.5 text-sm text-slate-700">
                      <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      {addressLine(v.address) || "Sem endereço"}
                    </p>
                    {v.address.reference && <p className="ml-5 text-xs text-slate-500">Ref.: {v.address.reference}</p>}
                    {c?.contactName && (
                      <p className="mt-1 text-sm text-slate-600">
                        Falar com <strong>{c.contactName}</strong>
                        {phone && ` · ${phoneBR(phone)}`}
                      </p>
                    )}
                    {v.objective && <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900">{v.objective}</p>}
                  </div>
                </div>
                {(v.stage === "agendada" || v.stage === "em_andamento") && (
                  <div className="space-y-2 border-t border-slate-100 bg-slate-50 p-3">
                    <NavButtons address={v.address} />
                    <div className="flex gap-2">
                      {wa && (
                        <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white">
                          <Icon name="whatsapp" /> Avisar cliente
                        </a>
                      )}
                      {phone && (
                        <a href={`tel:${phone.replace(/\D/g, "")}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
                          <Icon name="phone" /> Ligar
                        </a>
                      )}
                    </div>
                    {v.stage === "agendada" ? (
                      <QuickStart visitId={v.id} />
                    ) : (
                      <LinkButton href={`/visitas/${v.id}`} variant="success" size="lg" icon="flag" className="w-full">
                        Em andamento — concluir / registrar venda
                      </LinkButton>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
