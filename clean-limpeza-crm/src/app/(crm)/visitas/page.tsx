import Link from "next/link";
import NewVisitButton from "@/components/NewVisitButton";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import { Avatar, EmptyState, StageBadge } from "@/components/ui";
import { buttonClass } from "@/lib/button";
import { requireUser } from "@/lib/session";
import { loadScoped } from "@/lib/queries";
import { applyFilters, parseFilters } from "@/lib/filters";
import { STAGE_META, VISIT_TYPE_LABEL } from "@/lib/constants";
import { dateTimeBR, money, nowLocal } from "@/lib/format";
import type { Stage } from "@/lib/types";

export const metadata = { title: "Visitas" };

export default async function VisitsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const f = parseFilters(sp);
  const { db, visits, users } = await loadScoped(me);
  const clientById = new Map(db.clients.map((c) => [c.id, c]));
  const userById = new Map(users.map((u) => [u.id, u]));
  const list = applyFilters(visits, clientById, f).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  const total = list.reduce((s, v) => s + (v.sale?.total ?? 0), 0);
  const now = nowLocal();
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <PageHeader
        title="Visitas"
        subtitle={`${list.length} visitas encontradas${total ? ` · ${money(total)} em vendas` : ""}`}
        actions={
          <>
            <a href={`/api/export?${qs}`} className={buttonClass("secondary")}>
              <Icon name="download" /> Exportar Excel (CSV)
            </a>
            <NewVisitButton clients={db.clients} users={users} me={me} />
          </>
        }
      />

      <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-7">
        <input name="q" defaultValue={f.q} placeholder="Buscar cliente, código, bairro..." className="input lg:col-span-2" />
        <select name="stage" defaultValue={f.stage} className="input">
          <option value="">Todas as etapas</option>
          {(Object.keys(STAGE_META) as Stage[]).map((s) => (
            <option key={s} value={s}>
              {STAGE_META[s].short}
            </option>
          ))}
        </select>
        {me.role !== "funcionario" ? (
          <select name="user" defaultValue={f.user} className="input">
            <option value="">Todos os funcionários</option>
            {users
              .filter((u) => u.role !== "admin")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        ) : (
          <select name="type" defaultValue={f.type} className="input">
            <option value="">Todos os tipos</option>
            {Object.entries(VISIT_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        )}
        <input type="date" name="from" defaultValue={f.from} className="input" aria-label="De" />
        <input type="date" name="to" defaultValue={f.to} className="input" aria-label="Até" />
        <div className="flex gap-2">
          <button type="submit" className={`${buttonClass("primary")} flex-1`}>
            Filtrar
          </button>
          <Link href="/visitas" className={buttonClass("ghost")} title="Limpar filtros">
            <Icon name="x" />
          </Link>
        </div>
      </form>

      {list.length === 0 ? (
        <EmptyState title="Nenhuma visita encontrada" text="Ajuste os filtros ou agende uma nova visita." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Visita</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Funcionário</th>
                <th className="px-4 py-3">Etapa</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.slice(0, 500).map((v) => {
                const c = clientById.get(v.clientId);
                const u = userById.get(v.assignedTo);
                const late = v.stage === "agendada" && v.scheduledAt < now;
                return (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/visitas/${v.id}`} className="font-semibold text-brand-700 hover:underline">
                        {v.code}
                      </Link>
                      <p className="text-xs text-slate-500">{VISIT_TYPE_LABEL[v.type]}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{c?.name ?? "—"}</p>
                      <p className="text-xs text-slate-500">{[v.address.district, v.address.city].filter(Boolean).join(" - ")}</p>
                    </td>
                    <td className={`px-4 py-3 ${late ? "font-semibold text-rose-600" : "text-slate-700"}`}>
                      {dateTimeBR(v.scheduledAt)}
                      {late && <span className="block text-[11px]">atrasada</span>}
                    </td>
                    <td className="px-4 py-3">
                      {u && (
                        <span className="flex items-center gap-2">
                          <Avatar name={u.name} color={u.color} size="sm" />
                          {u.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StageBadge stage={v.stage} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {v.sale ? <span className="text-emerald-600">{money(v.sale.total)}</span> : <span className="text-slate-400">{v.estimatedValue ? money(v.estimatedValue) : "—"}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length > 500 && <p className="p-3 text-center text-xs text-slate-500">Mostrando 500 de {list.length}. Refine os filtros ou exporte.</p>}
        </div>
      )}
    </>
  );
}
