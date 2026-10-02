import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { MapEmbed, NavButtons } from "@/components/Maps";
import NewVisitButton from "@/components/NewVisitButton";
import { EditClientButtons } from "@/components/ClientButtons";
import StatCard from "@/components/StatCard";
import VisitRow from "@/components/VisitRow";
import { EmptyState, Pill } from "@/components/ui";
import { requireUser, isManager, toPublic } from "@/lib/session";
import { readDb } from "@/lib/db";
import { canAccessVisit } from "@/lib/queries";
import { isSold, saleDay } from "@/lib/metrics";
import { CLIENT_STATUS_META } from "@/lib/constants";
import { dateBR, documentBR, money, phoneBR } from "@/lib/format";
import { addressLine, whatsappUrl } from "@/lib/maps";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser();
  const db = await readDb();
  const client = db.clients.find((c) => c.id === id);
  if (!client) notFound();
  const users = db.users.map(toPublic);
  const userById = new Map(users.map((u) => [u.id, u]));
  const allVisits = db.visits.filter((v) => v.clientId === id);
  const visits = allVisits.filter((v) => canAccessVisit(me, v)).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  const sales = allVisits.filter((v) => isSold(v) && v.sale);
  const revenue = sales.reduce((s, v) => s + v.sale!.total, 0);
  const lastSale = sales.map(saleDay).sort().pop() ?? null;
  const ratings = allVisits.filter((v) => v.postSale?.satisfaction).map((v) => v.postSale!.satisfaction!);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  // Produtos mais comprados pelo cliente.
  const productTotals = new Map<string, { qty: number; value: number }>();
  for (const v of sales) {
    for (const it of v.sale!.items) {
      const p = productTotals.get(it.name) ?? { qty: 0, value: 0 };
      p.qty += it.quantity;
      p.value += it.quantity * it.unitPrice;
      productTotals.set(it.name, p);
    }
  }
  const topProducts = [...productTotals.entries()].sort((a, b) => b[1].value - a[1].value).slice(0, 6);
  const wa = whatsappUrl(client.whatsapp || client.phone);
  const owner = client.ownerId ? userById.get(client.ownerId) : null;

  return (
    <div>
      <Link href="/clientes" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700">
        <Icon name="chevronLeft" /> Clientes
      </Link>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            <Pill className={CLIENT_STATUS_META[client.status].cls}>{CLIENT_STATUS_META[client.status].label}</Pill>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {[client.tradeName !== client.name ? client.tradeName : "", client.segment, client.document ? documentBR(client.document) : ""].filter(Boolean).join(" · ")}
          </p>
          {client.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {client.tags.map((t) => (
                <Pill key={t} className="bg-brand-50 text-brand-700">
                  #{t}
                </Pill>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <NewVisitButton clients={db.clients} users={users} me={me} clientId={client.id} />
          <EditClientButtons client={client} users={users} canDelete={isManager(me)} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total comprado" value={money(revenue)} icon="dollar" tone="emerald" hint={`${sales.length} pedidos`} />
        <StatCard label="Ticket médio" value={money(sales.length ? revenue / sales.length : 0)} icon="cart" tone="violet" />
        <StatCard label="Última compra" value={dateBR(lastSale)} icon="calendar" tone="sky" hint={`${allVisits.length} visitas no total`} />
        <StatCard label="Satisfação" value={avgRating ? `${avgRating.toFixed(1)} ★` : "—"} icon="star" tone="amber" hint={`${ratings.length} avaliações`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="card overflow-hidden">
            <h2 className="border-b border-slate-100 px-5 py-4 font-bold text-slate-900">Histórico de visitas</h2>
            {visits.length === 0 ? (
              <div className="p-5">
                <EmptyState icon="calendar" title="Nenhuma visita ainda" text="Agende a primeira visita para este cliente." />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visits.map((v) => (
                  <VisitRow key={v.id} visit={v} client={client} user={userById.get(v.assignedTo)} />
                ))}
              </div>
            )}
          </section>
          {topProducts.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-3 font-bold text-slate-900">Produtos mais comprados</h2>
              <ul className="divide-y divide-slate-100 text-sm">
                {topProducts.map(([name, p]) => (
                  <li key={name} className="flex justify-between gap-3 py-2">
                    <span className="text-slate-800">{name}</span>
                    <span className="shrink-0 text-slate-500">
                      {p.qty} un. · <strong className="text-slate-900">{money(p.value)}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {client.notes && (
            <section className="card p-5">
              <h2 className="mb-2 font-bold text-slate-900">Observações</h2>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{client.notes}</p>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="card overflow-hidden">
            <MapEmbed address={client.address} className="h-56 rounded-none border-0" />
            <div className="space-y-3 p-4">
              <p className="flex gap-2 text-sm text-slate-700">
                <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>
                  {addressLine(client.address) || "Sem endereço"}
                  {client.address.reference && <span className="block text-xs text-slate-500">Ref.: {client.address.reference}</span>}
                </span>
              </p>
              <NavButtons address={client.address} />
            </div>
          </section>
          <section className="card space-y-3 p-5 text-sm">
            <h2 className="font-bold text-slate-900">Contato</h2>
            <p>
              <span className="block text-xs text-slate-500">Pessoa de contato</span>
              <span className="font-medium text-slate-800">
                {client.contactName || "—"}
                {client.contactRole && <span className="font-normal text-slate-500"> · {client.contactRole}</span>}
              </span>
            </p>
            {client.email && (
              <p>
                <span className="block text-xs text-slate-500">E-mail</span>
                <a href={`mailto:${client.email}`} className="text-brand-700 hover:underline">
                  {client.email}
                </a>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {client.phone && (
                <a href={`tel:${client.phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Icon name="phone" /> {phoneBR(client.phone)}
                </a>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600">
                  <Icon name="whatsapp" /> WhatsApp
                </a>
              )}
            </div>
            <p>
              <span className="block text-xs text-slate-500">Origem</span>
              {client.source || "—"}
            </p>
            <p>
              <span className="block text-xs text-slate-500">Responsável pela carteira</span>
              {owner?.name ?? "—"}
            </p>
            <p className="text-xs text-slate-400">Cliente desde {dateBR(client.createdAt)}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
