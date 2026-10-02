import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PeriodTabs from "@/components/PeriodTabs";
import StatCard from "@/components/StatCard";
import { Meter } from "@/components/Charts";
import { Avatar, EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { loadScoped } from "@/lib/queries";
import { performanceFor, type Performance } from "@/lib/metrics";
import { periodText, resolvePeriod } from "@/lib/period";
import { duration, money, percent } from "@/lib/format";

export const metadata = { title: "Desempenho da equipe" };

export default async function PerformancePage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const me = await requireUser(["admin", "gerente"]);
  const period = resolvePeriod((await searchParams).p);
  const { db, users } = await loadScoped(me);
  const team = users.filter((u) => u.role === "funcionario" && (u.active || db.visits.some((v) => v.assignedTo === u.id)));
  const rows = team.map((u) => performanceFor(u, db.visits, period.from, period.to, period.months)).sort((a, b) => b.revenue - a.revenue);

  const sum = (k: keyof Performance) => rows.reduce((s, r) => s + (r[k] as number), 0);
  const revenue = sum("revenue");
  const sales = sum("sales");
  const visited = sum("visited");
  const goal = sum("goal");
  const soldVisits = rows.reduce((s, r) => s + Math.round(r.conversion * r.visited), 0);
  const ratings = rows.filter((r) => r.satisfaction !== null);
  const best = (k: keyof Performance) => (rows.length ? [...rows].sort((a, b) => (b[k] as number) - (a[k] as number))[0] : null);
  const topRevenue = best("revenue");
  const topConversion = rows.filter((r) => r.visited >= 3).sort((a, b) => b.conversion - a.conversion)[0];
  const topVisits = best("visited");

  return (
    <>
      <PageHeader
        title="Desempenho da equipe"
        subtitle={`Período: ${periodText(period)}`}
        actions={<PeriodTabs base="/desempenho" current={period.key} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Faturamento" value={money(revenue)} icon="dollar" tone="emerald" hint={`${sales} vendas`} />
        <StatCard label="Meta da equipe" value={goal ? percent(revenue / goal) : "—"} icon="target" progress={goal ? revenue / goal : 0} hint={goal ? `de ${money(goal)}` : "sem metas"} />
        <StatCard label="Visitas realizadas" value={visited} icon="flag" tone="sky" hint={`${sum("scheduled")} agendadas`} />
        <StatCard label="Conversão" value={percent(visited ? soldVisits / visited : 0)} icon="chart" tone="violet" hint="visitas que viraram venda" />
        <StatCard label="Ticket médio" value={money(sales ? revenue / sales : 0)} icon="cart" tone="amber" />
        <StatCard
          label="Satisfação média"
          value={ratings.length ? `${(ratings.reduce((s, r) => s + r.satisfaction!, 0) / ratings.length).toFixed(1)} ★` : "—"}
          icon="star"
          tone="rose"
          hint="avaliações de pós-venda"
        />
      </div>

      {rows.length > 0 && (
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { title: "Maior faturamento", r: topRevenue, value: topRevenue && money(topRevenue.revenue) },
            { title: "Melhor conversão", r: topConversion, value: topConversion && percent(topConversion.conversion) },
            { title: "Mais visitas realizadas", r: topVisits, value: topVisits && `${topVisits.visited} visitas` },
          ].map(
            (h) =>
              h.r && (
                <div key={h.title} className="card flex items-center gap-3 bg-gradient-to-br from-white to-brand-50 p-4">
                  <span className="text-2xl">🏆</span>
                  <Avatar name={h.r.user.name} color={h.r.user.color} size="lg" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-slate-500">{h.title}</p>
                    <p className="truncate font-bold text-slate-900">{h.r.user.name}</p>
                    <p className="text-sm font-semibold text-brand-700">{h.value}</p>
                  </div>
                </div>
              ),
          )}
        </div>
      )}

      <section className="card mt-6 overflow-x-auto">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">Ranking por funcionário</h2>
          <p className="text-xs text-slate-500">Clique em um funcionário para ver o relatório individual.</p>
        </div>
        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="users" title="Nenhum funcionário cadastrado" text="Cadastre funcionários de campo na tela Equipe." />
          </div>
        ) : (
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Funcionário</th>
                <th className="px-4 py-3 text-right">Agendadas</th>
                <th className="px-4 py-3 text-right">Realizadas</th>
                <th className="px-4 py-3 text-right">Atrasadas</th>
                <th className="px-4 py-3 text-right">Vendas</th>
                <th className="px-4 py-3 text-right">Conversão</th>
                <th className="px-4 py-3 text-right">Faturamento</th>
                <th className="px-4 py-3 text-right">Ticket médio</th>
                <th className="w-40 px-4 py-3">Meta</th>
                <th className="px-4 py-3 text-right">Pontualidade</th>
                <th className="px-4 py-3 text-right">Tempo médio</th>
                <th className="px-4 py-3 text-right">Satisf.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={r.user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-400">{i + 1}º</td>
                  <td className="px-4 py-3">
                    <Link href={`/desempenho/${r.user.id}?p=${period.key}`} className="flex items-center gap-2 font-semibold text-slate-900 hover:text-brand-700">
                      <Avatar name={r.user.name} color={r.user.color} size="sm" />
                      <span>
                        {r.user.name}
                        <span className="block text-[11px] font-normal text-slate-500">{r.user.region || "—"}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">{r.scheduled}</td>
                  <td className="px-4 py-3 text-right">{r.visited}</td>
                  <td className={`px-4 py-3 text-right ${r.overdue ? "font-semibold text-rose-600" : ""}`}>{r.overdue}</td>
                  <td className="px-4 py-3 text-right">{r.sales}</td>
                  <td className="px-4 py-3 text-right">{percent(r.conversion)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{money(r.revenue)}</td>
                  <td className="px-4 py-3 text-right">{money(r.avgTicket)}</td>
                  <td className="px-4 py-3">
                    {r.goal ? (
                      <>
                        <Meter value={r.goalProgress} className={r.goalProgress >= 1 ? "bg-emerald-500" : "bg-brand-600"} />
                        <span className="text-[11px] text-slate-500">
                          {percent(r.goalProgress)} de {money(r.goal)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">sem meta</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{r.punctuality === null ? "—" : percent(r.punctuality)}</td>
                  <td className="px-4 py-3 text-right">{r.avgTimeOnSite === null ? "—" : duration(r.avgTimeOnSite)}</td>
                  <td className="px-4 py-3 text-right">{r.satisfaction === null ? "—" : `${r.satisfaction.toFixed(1)} ★`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <p className="mt-3 text-xs text-slate-500">
        Pontualidade = check-ins feitos até 15 min após o horário agendado. Conversão = visitas realizadas que viraram venda. Faturamento considera a data de
        fechamento da venda.
      </p>
    </>
  );
}
