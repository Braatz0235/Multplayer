import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import VisitRow from "@/components/VisitRow";
import NewVisitButton from "@/components/NewVisitButton";
import { Funnel, Meter, RevenueBars } from "@/components/Charts";
import { Avatar, EmptyState } from "@/components/ui";
import { requireUser, isManager } from "@/lib/session";
import { byScheduled, loadScoped } from "@/lib/queries";
import { isSold, monthBounds, performanceFor, revenueByMonth, saleDay } from "@/lib/metrics";
import { addDays, dateBR, isoToBR, longDate, money, nowLocal, percent, todayLocal } from "@/lib/format";
import { PIPELINE, STAGE_META } from "@/lib/constants";

export const metadata = { title: "Painel" };

export default async function DashboardPage() {
  const me = await requireUser();
  const { db, visits, users, fieldUsers } = await loadScoped(me);
  const today = todayLocal();
  const now = nowLocal();
  const month = today.slice(0, 7);
  const { from, to } = monthBounds(month);
  const clientById = new Map(db.clients.map((c) => [c.id, c]));
  const userById = new Map(users.map((u) => [u.id, u]));
  const manager = isManager(me);

  const todays = visits.filter((v) => v.scheduledAt.startsWith(today) && v.stage !== "perdida").sort(byScheduled);
  const inProgress = visits.filter((v) => v.stage === "em_andamento");
  const overdue = visits.filter((v) => v.stage === "agendada" && v.scheduledAt < now).sort(byScheduled);
  const overdueBefore = overdue.filter((v) => !v.scheduledAt.startsWith(today));
  const monthSales = visits.filter((v) => isSold(v) && v.sale && saleDay(v).startsWith(month));
  const revenue = monthSales.reduce((s, v) => s + v.sale!.total, 0);
  const monthVisited = visits.filter((v) => v.scheduledAt.startsWith(month) && (v.checkOut || isSold(v)));
  const conversion = monthVisited.length ? monthVisited.filter(isSold).length / monthVisited.length : 0;
  const goal = manager ? fieldUsers.reduce((s, u) => s + u.monthlyGoal, 0) : me.monthlyGoal;
  const followUps = visits
    .filter((v) => v.stage === "pos_venda" && v.postSale?.followUpDate && !v.postSale.completedAt && v.postSale.followUpDate <= addDays(today, 7))
    .sort((a, b) => a.postSale!.followUpDate!.localeCompare(b.postSale!.followUpDate!));
  const pipelineValue = visits
    .filter((v) => ["agendada", "em_andamento", "concluida"].includes(v.stage))
    .reduce((s, v) => s + v.estimatedValue, 0);

  const ranking = manager
    ? fieldUsers.map((u) => performanceFor(u, db.visits, from, to)).sort((a, b) => b.revenue - a.revenue)
    : [];

  const activity = visits
    .flatMap((v) => v.history.map((h) => ({ ...h, visit: v })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title={`Olá, ${me.name.split(" ")[0]}!`}
        subtitle={longDate(today)}
        actions={<NewVisitButton clients={db.clients} users={users} me={me} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Visitas hoje" value={todays.length} icon="calendar" hint={`${todays.filter((v) => v.stage === "agendada").length} ainda a iniciar`} />
        <StatCard label="Em andamento" value={inProgress.length} icon="clock" tone="amber" hint="Funcionários no cliente agora" />
        <StatCard label="Atrasadas" value={overdue.length} icon="alert" tone="rose" hint="Agendadas sem check-in" />
        <StatCard label="Vendas no mês" value={money(revenue)} icon="dollar" tone="emerald" hint={`${monthSales.length} pedidos fechados`} />
        <StatCard
          label="Ticket médio"
          value={money(monthSales.length ? revenue / monthSales.length : 0)}
          icon="cart"
          tone="violet"
          hint={`Conversão ${percent(conversion)} das visitas`}
        />
        <StatCard
          label={manager ? "Meta da equipe" : "Minha meta"}
          value={goal ? percent(revenue / goal) : "—"}
          icon="target"
          tone="sky"
          progress={goal ? revenue / goal : 0}
          hint={goal ? `${money(revenue)} de ${money(goal)}` : "Defina metas na Equipe"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Faturamento dos últimos 6 meses</h2>
            <span className="text-xs text-slate-500">número = pedidos no mês</span>
          </div>
          <RevenueBars data={revenueByMonth(visits, month, 6)} />
        </section>
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Funil de atendimento</h2>
            <Link href="/funil" className="text-xs font-semibold text-brand-600 hover:underline">
              Abrir quadro →
            </Link>
          </div>
          <Funnel
            rows={PIPELINE.map((s) => ({
              label: STAGE_META[s].short,
              value: visits.filter((v) => v.stage === s).length,
              color: STAGE_META[s].dot,
            }))}
          />
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Valor estimado em negociação: <strong className="text-slate-900">{money(pipelineValue)}</strong>
          </p>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Agenda de hoje</h2>
            <Link href="/agenda" className="text-xs font-semibold text-brand-600 hover:underline">
              Ver agenda completa →
            </Link>
          </div>
          {todays.length === 0 ? (
            <div className="p-5">
              <EmptyState icon="calendar" title="Nenhuma visita para hoje" text="Agende visitas para a equipe pelo botão acima." />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todays.map((v) => (
                <VisitRow key={v.id} visit={v} client={clientById.get(v.clientId)} user={userById.get(v.assignedTo)} showNav={!manager} />
              ))}
            </div>
          )}
          {overdueBefore.length > 0 && (
            <div className="border-t border-rose-100 bg-rose-50/40">
              <p className="px-5 pt-3 text-xs font-bold uppercase tracking-wide text-rose-700">Atrasadas de dias anteriores ({overdueBefore.length})</p>
              <div className="divide-y divide-rose-100">
                {overdueBefore.slice(0, 5).map((v) => (
                  <VisitRow key={v.id} visit={v} client={clientById.get(v.clientId)} user={userById.get(v.assignedTo)} />
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="space-y-6">
          {manager && (
            <section className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Ranking do mês</h2>
                <Link href="/desempenho" className="text-xs font-semibold text-brand-600 hover:underline">
                  Desempenho →
                </Link>
              </div>
              {ranking.length === 0 && <p className="text-sm text-slate-500">Cadastre funcionários na Equipe.</p>}
              <ol className="space-y-3">
                {ranking.map((p, i) => (
                  <li key={p.user.id}>
                    <Link href={`/desempenho/${p.user.id}`} className="flex items-center gap-3">
                      <span className={`w-5 text-center text-sm font-bold ${i === 0 ? "text-amber-500" : "text-slate-400"}`}>{i + 1}º</span>
                      <Avatar name={p.user.name} color={p.user.color} />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2 text-sm">
                          <span className="truncate font-semibold text-slate-800">{p.user.name}</span>
                          <span className="font-bold text-slate-900">{money(p.revenue)}</span>
                        </div>
                        <Meter value={p.goalProgress} />
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {p.visited} visitas · {p.sales} vendas · meta {p.goal ? percent(p.goalProgress) : "—"}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="card p-5">
            <h2 className="mb-3 font-bold text-slate-900">Pós-venda: próximos contatos</h2>
            {followUps.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum retorno previsto para os próximos 7 dias.</p>
            ) : (
              <ul className="space-y-2">
                {followUps.slice(0, 6).map((v) => (
                  <li key={v.id}>
                    <Link href={`/visitas/${v.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                      <span className="truncate font-medium text-slate-800">{clientById.get(v.clientId)?.name}</span>
                      <span className={`shrink-0 text-xs font-semibold ${v.postSale!.followUpDate! < today ? "text-rose-600" : "text-brand-600"}`}>
                        {dateBR(v.postSale!.followUpDate)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-bold text-slate-900">Atividade recente</h2>
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <Avatar name={userById.get(a.userId ?? "")?.name ?? "?"} color={userById.get(a.userId ?? "")?.color} size="sm" />
                  <div className="min-w-0">
                    <Link href={`/visitas/${a.visit.id}`} className="block truncate text-slate-800 hover:text-brand-700">
                      <strong>{clientById.get(a.visit.clientId)?.name}</strong> — {a.text}
                    </Link>
                    <p className="text-[11px] text-slate-500">{isoToBR(a.at)}</p>
                  </div>
                </li>
              ))}
              {activity.length === 0 && <li className="text-sm text-slate-500">Sem atividades ainda.</li>}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
