import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { MapEmbed, NavButtons } from "@/components/Maps";
import VisitActions, { CommentBox } from "@/components/VisitActions";
import { Avatar, Pill, StageBadge, Stars } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { canAccessVisit, loadScoped } from "@/lib/queries";
import { checkInDelay, timeOnSite } from "@/lib/metrics";
import { PIPELINE, PRIORITY_META, STAGE_META, VISIT_TYPE_LABEL, CLIENT_STATUS_META } from "@/lib/constants";
import { dateBR, dateTimeBR, duration, isoToBR, money, phoneBR } from "@/lib/format";
import { addressLine, pointUrl, whatsappUrl } from "@/lib/maps";
import type { GeoStamp } from "@/lib/types";

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser();
  const { db, users } = await loadScoped(me);
  const visit = db.visits.find((v) => v.id === id);
  if (!visit || !canAccessVisit(me, visit)) notFound();

  const client = db.clients.find((c) => c.id === visit.clientId);
  const assignee = users.find((u) => u.id === visit.assignedTo);
  const userById = new Map(users.map((u) => [u.id, u]));
  const delay = checkInDelay(visit);
  const onSite = timeOnSite(visit);
  const stepIndex = PIPELINE.indexOf(visit.stage);
  const wa = client ? whatsappUrl(client.whatsapp || client.phone) : null;

  return (
    <div>
      <Link href="/funil" className="no-print mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700">
        <Icon name="chevronLeft" /> Voltar ao funil
      </Link>

      <div className="card mb-6 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-500">{visit.code}</span>
              <StageBadge stage={visit.stage} />
              <Pill className={PRIORITY_META[visit.priority].cls}>Prioridade {PRIORITY_META[visit.priority].label.toLowerCase()}</Pill>
              <Pill>{VISIT_TYPE_LABEL[visit.type]}</Pill>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{client?.name ?? "Cliente removido"}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
              <Icon name="calendar" /> {dateTimeBR(visit.scheduledAt)} · {duration(visit.durationMinutes)}
            </p>
          </div>
          <div className="text-left lg:text-right">
            <p className="text-xs font-semibold uppercase text-slate-500">{visit.sale ? "Valor da venda" : "Valor estimado"}</p>
            <p className={`text-2xl font-bold ${visit.sale ? "text-emerald-600" : "text-slate-900"}`}>{money(visit.sale?.total ?? visit.estimatedValue)}</p>
          </div>
        </div>

        {visit.stage !== "perdida" ? (
          <ol className="mt-5 grid grid-cols-5 gap-1">
            {PIPELINE.map((s, i) => (
              <li key={s} className="text-center">
                <div className={`h-1.5 rounded-full ${i <= stepIndex ? STAGE_META[s].dot : "bg-slate-200"}`} />
                <span className={`mt-1 block text-[10px] font-semibold sm:text-xs ${i <= stepIndex ? "text-slate-800" : "text-slate-400"}`}>{STAGE_META[s].short}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <strong>Perdida / cancelada:</strong> {visit.lostReason}
          </div>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <VisitActions visit={visit} client={client} clients={db.clients} users={users} products={db.products} me={me} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="card p-5">
            <h2 className="mb-2 font-bold text-slate-900">Objetivo da visita</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{visit.objective || "Sem instruções."}</p>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-bold text-slate-900">Execução em campo</h2>
            <div className="grid gap-3 sm:grid-cols-4">
              <GeoInfo label="Check-in" stamp={visit.checkIn} />
              <GeoInfo label="Check-out" stamp={visit.checkOut} />
              <Info
                label="Pontualidade"
                value={delay === null ? "—" : delay <= 0 ? "No horário" : `${Math.round(delay)} min de atraso`}
                tone={delay !== null && delay > 15 ? "text-rose-600" : "text-slate-900"}
              />
              <Info label="Tempo no cliente" value={onSite === null ? "—" : duration(onSite)} />
            </div>
            {(visit.report || visit.outcome || visit.nextSteps) && (
              <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                {visit.outcome && (
                  <p>
                    <span className="font-semibold text-slate-900">Resultado:</span> {visit.outcome}
                  </p>
                )}
                {visit.report && (
                  <div>
                    <p className="font-semibold text-slate-900">Relatório</p>
                    <p className="whitespace-pre-wrap text-slate-700">{visit.report}</p>
                  </div>
                )}
                {visit.nextSteps && (
                  <p>
                    <span className="font-semibold text-slate-900">Próximos passos:</span> {visit.nextSteps}
                  </p>
                )}
              </div>
            )}
          </section>

          {visit.sale && (
            <section className="card p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold text-slate-900">Venda finalizada</h2>
                <span className="text-xs text-slate-500">Fechada em {isoToBR(visit.sale.closedAt)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="text-left text-xs uppercase text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="py-2">Produto</th>
                      <th className="py-2 text-right">Qtd.</th>
                      <th className="py-2 text-right">Preço un.</th>
                      <th className="py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visit.sale.items.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2 text-slate-800">{it.name}</td>
                        <td className="py-2 text-right">{it.quantity}</td>
                        <td className="py-2 text-right">{money(it.unitPrice)}</td>
                        <td className="py-2 text-right font-semibold">{money(it.quantity * it.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="text-sm">
                    {visit.sale.discount > 0 && (
                      <tr>
                        <td colSpan={3} className="pt-2 text-right text-slate-500">
                          Desconto
                        </td>
                        <td className="pt-2 text-right text-slate-500">−{money(visit.sale.discount)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={3} className="pt-2 text-right font-bold">
                        Total
                      </td>
                      <td className="pt-2 text-right text-lg font-bold text-emerald-600">{money(visit.sale.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <Info label="Pagamento" value={visit.sale.paymentMethod} />
                <Info label="Condição" value={visit.sale.paymentTerms || "—"} />
                <Info label="Pedido / NF" value={visit.sale.invoiceNumber || "—"} />
                <Info label="Entrega prevista" value={dateBR(visit.sale.deliveryDate)} />
              </div>
            </section>
          )}

          {visit.postSale && (
            <section className="card p-5">
              <h2 className="mb-3 font-bold text-slate-900">Pós-venda</h2>
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <p className="label">Satisfação</p>
                  <Stars value={visit.postSale.satisfaction} />
                </div>
                <Info label="NPS" value={visit.postSale.nps === null ? "—" : `${visit.postSale.nps}/10`} />
                <Info label="Próximo contato" value={dateBR(visit.postSale.followUpDate)} />
                <Info label="Status" value={visit.postSale.completedAt ? "Encerrado" : "Em acompanhamento"} />
              </div>
              {visit.postSale.feedback && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm italic text-slate-700">“{visit.postSale.feedback}”</p>}
              {visit.postSale.nextAction && (
                <p className="mt-2 text-sm text-slate-700">
                  <strong>Ação:</strong> {visit.postSale.nextAction}
                </p>
              )}
            </section>
          )}

          <section className="card p-5">
            <h2 className="mb-4 font-bold text-slate-900">Histórico e comentários</h2>
            <CommentBox visitId={visit.id} />
            <ol className="mt-5 space-y-4 border-l-2 border-slate-100 pl-5">
              {[...visit.history].reverse().map((h) => {
                const u = userById.get(h.userId ?? "");
                return (
                  <li key={h.id} className="relative">
                    <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${h.kind === "comentario" ? "bg-slate-400" : "bg-brand-600"}`} />
                    <p className={`text-sm ${h.kind === "comentario" ? "rounded-lg bg-slate-50 px-3 py-2 text-slate-700" : "font-medium text-slate-800"}`}>{h.text}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {u?.name ?? "Sistema"} · {isoToBR(h.at)}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card overflow-hidden">
            <MapEmbed address={visit.address} className="h-56 rounded-none border-0" />
            <div className="space-y-3 p-4">
              <p className="flex gap-2 text-sm text-slate-700">
                <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>
                  {addressLine(visit.address) || "Sem endereço"}
                  {visit.address.reference && <span className="block text-xs text-slate-500">Ref.: {visit.address.reference}</span>}
                </span>
              </p>
              <NavButtons address={visit.address} />
            </div>
          </section>

          {client && (
            <section className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Cliente</h2>
                <Link href={`/clientes/${client.id}`} className="text-xs font-semibold text-brand-600 hover:underline">
                  Ver ficha →
                </Link>
              </div>
              <Pill className={CLIENT_STATUS_META[client.status].cls}>{CLIENT_STATUS_META[client.status].label}</Pill>
              <dl className="mt-3 space-y-2 text-sm">
                {client.contactName && (
                  <div>
                    <dt className="text-xs text-slate-500">Contato</dt>
                    <dd className="font-medium text-slate-800">
                      {client.contactName}
                      {client.contactRole && <span className="font-normal text-slate-500"> · {client.contactRole}</span>}
                    </dd>
                  </div>
                )}
                {client.segment && (
                  <div>
                    <dt className="text-xs text-slate-500">Segmento</dt>
                    <dd className="text-slate-800">{client.segment}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
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
                {client.email && (
                  <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Icon name="mail" /> E-mail
                  </a>
                )}
              </div>
            </section>
          )}

          <section className="card p-5">
            <h2 className="mb-3 font-bold text-slate-900">Responsável</h2>
            {assignee ? (
              <div className="flex items-center gap-3">
                <Avatar name={assignee.name} color={assignee.color} size="lg" />
                <div>
                  <p className="font-semibold text-slate-900">{assignee.name}</p>
                  <p className="text-xs text-slate-500">{assignee.region || "Sem região"}</p>
                  {assignee.phone && <p className="text-xs text-slate-500">{phoneBR(assignee.phone)}</p>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">—</p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Agendada por {userById.get(visit.createdBy)?.name ?? "—"} em {isoToBR(visit.createdAt)}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value, tone = "text-slate-900" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase text-slate-500">{label}</p>
      <p className={`text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function GeoInfo({ label, stamp }: { label: string; stamp: GeoStamp | null }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{stamp ? isoToBR(stamp.at).split(" às ")[1] : "—"}</p>
      {stamp?.lat != null && stamp.lng != null && (
        <a href={pointUrl(stamp.lat, stamp.lng)} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-brand-600 hover:underline">
          Ver local no mapa {stamp.accuracy ? `(±${stamp.accuracy}m)` : ""}
        </a>
      )}
    </div>
  );
}
