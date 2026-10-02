import Link from "next/link";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import { NewClientButton } from "@/components/ClientButtons";
import { Avatar, EmptyState, Pill } from "@/components/ui";
import { buttonClass } from "@/lib/button";
import { requireUser, toPublic } from "@/lib/session";
import { readDb } from "@/lib/db";
import { isSold } from "@/lib/metrics";
import { CLIENT_STATUS_META, SEGMENTS } from "@/lib/constants";
import { dateBR, money, phoneBR } from "@/lib/format";
import type { ClientStatus } from "@/lib/types";

export const metadata = { title: "Clientes" };

export default async function ClientsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const db = await readDb();
  const users = db.users.map(toPublic);
  const userById = new Map(users.map((u) => [u.id, u]));

  const stats = new Map<string, { visits: number; revenue: number; last: string | null }>();
  for (const v of db.visits) {
    const s = stats.get(v.clientId) ?? { visits: 0, revenue: 0, last: null };
    s.visits += 1;
    if (isSold(v) && v.sale) s.revenue += v.sale.total;
    if (v.checkIn && (!s.last || v.scheduledAt > s.last)) s.last = v.scheduledAt;
    stats.set(v.clientId, s);
  }

  const list = db.clients
    .filter((c) => (!sp.status || c.status === sp.status) && (!sp.segment || c.segment === sp.segment) && (!sp.owner || c.ownerId === sp.owner))
    .filter((c) => !q || `${c.name} ${c.tradeName} ${c.contactName} ${c.document} ${c.address.district} ${c.address.city} ${c.tags.join(" ")}`.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const counts = (s: ClientStatus) => db.clients.filter((c) => c.status === s).length;

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle={`${db.clients.length} cadastrados · ${counts("ativo")} ativos · ${counts("lead")} leads`}
        actions={<NewClientButton users={users} />}
      />

      <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input name="q" defaultValue={sp.q} placeholder="Nome, contato, CNPJ, bairro, etiqueta..." className="input lg:col-span-2" />
        <select name="status" defaultValue={sp.status} className="input">
          <option value="">Todos os status</option>
          {(Object.keys(CLIENT_STATUS_META) as ClientStatus[]).map((s) => (
            <option key={s} value={s}>
              {CLIENT_STATUS_META[s].label}
            </option>
          ))}
        </select>
        <select name="segment" defaultValue={sp.segment} className="input">
          <option value="">Todos os segmentos</option>
          {SEGMENTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <div className="flex gap-2">
          {me.role !== "funcionario" ? (
            <select name="owner" defaultValue={sp.owner} className="input">
              <option value="">Toda carteira</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          ) : (
            <select name="owner" defaultValue={sp.owner} className="input">
              <option value="">Todos</option>
              <option value={me.id}>Minha carteira</option>
            </select>
          )}
          <button className={buttonClass("primary")}>
            <Icon name="search" />
          </button>
        </div>
      </form>

      {list.length === 0 ? (
        <EmptyState icon="building" title="Nenhum cliente encontrado" text="Cadastre clientes para agendar visitas." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Local</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3 text-right">Visitas</th>
                <th className="px-4 py-3 text-right">Comprado</th>
                <th className="px-4 py-3">Última visita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((c) => {
                const s = stats.get(c.id);
                const owner = c.ownerId ? userById.get(c.ownerId) : null;
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/clientes/${c.id}`} className="font-semibold text-brand-700 hover:underline">
                        {c.name}
                      </Link>
                      <p className="text-xs text-slate-500">{c.segment || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{c.contactName || "—"}</p>
                      <p className="text-xs text-slate-500">{c.phone ? phoneBR(c.phone) : ""}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{[c.address.district, c.address.city].filter(Boolean).join(" - ") || "—"}</td>
                    <td className="px-4 py-3">
                      <Pill className={CLIENT_STATUS_META[c.status].cls}>{CLIENT_STATUS_META[c.status].label}</Pill>
                    </td>
                    <td className="px-4 py-3">
                      {owner ? (
                        <span className="flex items-center gap-2">
                          <Avatar name={owner.name} color={owner.color} size="sm" /> {owner.name.split(" ")[0]}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{s?.visits ?? 0}</td>
                    <td className="px-4 py-3 text-right font-semibold">{money(s?.revenue ?? 0)}</td>
                    <td className="px-4 py-3 text-slate-600">{dateBR(s?.last)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
