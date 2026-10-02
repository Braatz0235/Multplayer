import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import PeriodTabs from "@/components/PeriodTabs";
import StatCard from "@/components/StatCard";
import VisitRow from "@/components/VisitRow";
import { Funnel, RevenueBars } from "@/components/Charts";
import { Avatar } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { loadScoped } from "@/lib/queries";
import { inRange, performanceFor, revenueByMonth } from "@/lib/metrics";
import { periodText, resolvePeriod } from "@/lib/period";
import { duration, money, percent, phoneBR, todayLocal } from "@/lib/format";
import { PIPELINE, ROLE_LABEL, STAGE_META, VISIT_TYPE_LABEL } from "@/lib/constants";
import type { VisitType } from "@/lib/types";

export default async function UserPerformancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  if (me.role === "funcionario" && me.id !== id) notFound();
  const period = resolvePeriod((await searchParams).p);
  const { db, users } = await loadScoped(me);
  const user = users.find((u) => u.id === id);
  if (!user) notFound();

  const p = performanceFor(user, db.visits, period.from, period.to, period.months);
  const mine = db.visits.filter((v) => v.assignedTo === id);
  const inPeriod = mine.filter((v) => inRange(v.scheduledAt.slice(0, 10), period.from, period.to));
  const clientById = new Map(db.clients.map((c) => [c.id, c]));
  const lostReasons = new Map<string, number>();
  for (const v of inPeriod.filter((v) => v.stage === "perdida")) {
    const key = v.lostReason.split(" — ")[0] || "Não informado";
    lostReasons.set(key, (lostReasons.get(key) ?? 0) + 1);
  }
  const byType = new Map<VisitType, number>();
  for (const v of inPeriod) byType.set(v.type, (byType.get(v.type) ?? 0) + 1);
  const manager = users.find((u) => u.id === user.managerId);

  return (
    <div>
      {me.role !== "funcionario" && (
        <Link href={`/desempenho?p=${period.key}`} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700">
          <Icon name="chevronLeft" /> Desempenho da equipe
        </Link>
      )}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} color={user.color} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-sm text-slate-500">
              {ROLE_LABEL[user.role]}
              {user.region && ` · ${user.region}`}
              {user.phone && ` · ${phoneBR(user.phone)}`}
              {manager && ` · Gerente: ${manager.name}`}
            </p>
            <p className="text-xs text-slate-400">Período: {periodText(period)}</p>
          </div>
        </div>
        <PeriodTabs base={`/desempenho/${user.id}`} current={period.key} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Faturamento" value={money(p.revenue)} icon="dollar" tone="emerald" hint={`${p.sales} vendas · ticket ${money(p.avgTicket)}`} />
        <StatCard
          label="Meta"
          value={p.goal ? percent(p.goalProgress) : "—"}
          icon="target"
          progress={p.goal ? p.goalProgress : undefined}
          hint={p.goal ? `${money(p.revenue)} de ${money(p.goal)}` : "Meta não definida"}
        />
        <StatCard label="Visitas realizadas" value={`${p.visited}/${p.scheduled}`} icon="flag" tone="sky" hint={`${percent(p.completionRate)} de cumprimento da agenda`} />
        <StatCard label="Conversão" value={percent(p.conversion)} icon="chart" tone="violet" hint={`${p.lost} perdidas/canceladas`} />
        <StatCard label="Pontualidade" value={p.punctuality === null ? "—" : percent(p.punctuality)} icon="clock" tone="amber" hint="check-in até 15 min do horário" />
        <StatCard label="Tempo médio no cliente" value={p.avgTimeOnSite === null ? "—" : duration(p.avgTimeOnSite)} icon="pin" tone="sky" />
        <StatCard label="Satisfação" value={p.satisfaction === null ? "—" : `${p.satisfaction.toFixed(1)} ★`} icon="star" tone="amber" hint={p.nps === null ? "sem avaliações" : `NPS ${p.nps}`} />
        <StatCard label="Pendências" value={p.overdue} icon="alert" tone="rose" hint={`${p.pending} agendadas · ${p.inProgress} em andamento`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <h2 className="mb-4 font-bold text-slate-900">Faturamento mensal</h2>
          <RevenueBars data={revenueByMonth(mine, todayLocal().slice(0, 7), 6)} />
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-bold text-slate-900">Visitas do período por etapa</h2>
          <Funnel
            rows={[...PIPELINE, "perdida" as const].map((s) => ({
              label: STAGE_META[s].short,
              value: inPeriod.filter((v) => v.stage === s).length,
              color: STAGE_META[s].dot,
            }))}
          />
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card overflow-hidden xl:col-span-2">
          <h2 className="border-b border-slate-100 px-5 py-4 font-bold text-slate-900">Visitas no período ({inPeriod.length})</h2>
          <div className="scroll-thin max-h-[520px] divide-y divide-slate-100 overflow-y-auto">
            {inPeriod
              .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
              .map((v) => (
                <VisitRow key={v.id} visit={v} client={clientById.get(v.clientId)} />
              ))}
            {inPeriod.length === 0 && <p className="p-5 text-sm text-slate-500">Nenhuma visita no período.</p>}
          </div>
        </section>
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-bold text-slate-900">Tipos de visita</h2>
            <ul className="space-y-2 text-sm">
              {[...byType.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([t, n]) => (
                  <li key={t} className="flex justify-between">
                    <span className="text-slate-700">{VISIT_TYPE_LABEL[t]}</span>
                    <strong>{n}</strong>
                  </li>
                ))}
              {byType.size === 0 && <li className="text-slate-500">—</li>}
            </ul>
          </section>
          <section className="card p-5">
            <h2 className="mb-3 font-bold text-slate-900">Motivos de perda</h2>
            <ul className="space-y-2 text-sm">
              {[...lostReasons.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([r, n]) => (
                  <li key={r} className="flex justify-between gap-2">
                    <span className="text-slate-700">{r}</span>
                    <strong>{n}</strong>
                  </li>
                ))}
              {lostReasons.size === 0 && <li className="text-slate-500">Nenhuma perda no período 🎉</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
