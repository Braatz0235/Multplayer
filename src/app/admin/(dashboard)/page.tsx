import Link from "next/link";
import { readDb } from "@/lib/db";
import { nowInSaoPaulo } from "@/lib/availability";
import { formatCurrencyBRL, formatDatePtBr } from "@/lib/format";
import StatusBadge from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const db = await readDb();
  const { dateStr: today } = nowInSaoPaulo();

  const todaysBookings = db.bookings
    .filter((b) => b.date === today && b.status !== "cancelled")
    .sort((a, b) => a.time.localeCompare(b.time));

  const upcoming = db.bookings.filter(
    (b) => b.date >= today && b.status !== "cancelled"
  );

  const monthRevenue = db.bookings
    .filter(
      (b) => b.date.slice(0, 7) === today.slice(0, 7) && b.status !== "cancelled"
    )
    .reduce((sum, b) => sum + b.servicePrice, 0);

  const pendingCount = db.bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-parchment sm:text-3xl">
          Visão geral
        </h1>
        <p className="mt-1 text-sm text-parchment/50">
          Resumo rápido da {db.settings.siteName}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hoje" value={String(todaysBookings.length)} hint="agendamentos" />
        <StatCard label="Próximos" value={String(upcoming.length)} hint="a partir de hoje" />
        <StatCard label="Pendentes" value={String(pendingCount)} hint="aguardando confirmação" />
        <StatCard
          label="Faturamento do mês"
          value={formatCurrencyBRL(monthRevenue)}
          hint="agendamentos ativos"
        />
      </div>

      <div className="card-frame rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-gold">
            Agendamentos de hoje
          </h2>
          <Link href="/admin/bookings" className="text-sm text-gold hover:underline">
            Ver todos
          </Link>
        </div>

        {todaysBookings.length === 0 ? (
          <p className="text-sm text-parchment/50">Nenhum agendamento para hoje.</p>
        ) : (
          <ul className="divide-y divide-gold/10">
            {todaysBookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-parchment">
                    {b.time} · {b.serviceName}
                  </p>
                  <p className="text-xs text-parchment/50">
                    {b.customerName} · {b.customerPhone}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink href="/admin/profile" title="Editar perfil" desc="Nome, capa, foto e informações" />
        <QuickLink href="/admin/services" title="Gerenciar serviços" desc="Categorias, preços e duração" />
        <QuickLink href="/admin/hours" title="Editar horários" desc="Dias e horários de funcionamento" />
      </div>

      <p className="text-xs text-parchment/40">
        Último agendamento registrado:{" "}
        {db.bookings.length > 0
          ? formatDatePtBr(db.bookings[db.bookings.length - 1].date)
          : "—"}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="card-frame rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-parchment/50">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-bold text-gold">{value}</p>
      <p className="mt-1 text-xs text-parchment/40">{hint}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="card-frame block rounded-2xl p-5 transition hover:border-gold/40"
    >
      <p className="font-semibold text-parchment">{title}</p>
      <p className="mt-1 text-sm text-parchment/50">{desc}</p>
    </Link>
  );
}
