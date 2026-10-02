"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, ErrorBox, Pill } from "./ui";
import Icon from "./Icon";
import { CheckOutModal, LostModal, PostSaleModal, SaleModal } from "./StageModals";
import { moveStage } from "@/lib/actions";
import { PIPELINE, PRIORITY_META, STAGE_META } from "@/lib/constants";
import { compactMoney, money, nowLocal, relativeDay, timeBR } from "@/lib/format";
import type { Client, Product, PublicUser, Stage, Visit } from "@/lib/types";

type Pending = { kind: "checkout" | "sale" | "postsale" | "lost"; visit: Visit } | null;

export default function Board({
  visits,
  clients,
  users,
  products,
  me,
}: {
  visits: Visit[];
  clients: Client[];
  users: PublicUser[];
  products: Product[];
  me: PublicUser;
}) {
  const router = useRouter();
  const [userFilter, setUserFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showLost, setShowLost] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const now = nowLocal();

  const filtered = visits.filter((v) => {
    if (userFilter && v.assignedTo !== userFilter) return false;
    if (search) {
      const c = clientById.get(v.clientId);
      const hay = `${v.code} ${c?.name ?? ""} ${c?.contactName ?? ""} ${v.address.district}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });
  const stages: Stage[] = showLost ? [...PIPELINE, "perdida"] : PIPELINE;
  const field = users.filter((u) => u.role === "funcionario" || visits.some((v) => v.assignedTo === u.id));

  function drop(stage: Stage) {
    const visit = visits.find((v) => v.id === dragId);
    setDragId(null);
    setOver(null);
    if (!visit || visit.stage === stage) return;
    const forward = PIPELINE.indexOf(stage) > PIPELINE.indexOf(visit.stage) && visit.stage !== "perdida";
    if (stage === "perdida") return setPending({ kind: "lost", visit });
    if (stage === "concluida" && forward && !visit.checkOut) return setPending({ kind: "checkout", visit });
    if (stage === "venda_finalizada" && !visit.sale) return setPending({ kind: "sale", visit });
    if (stage === "pos_venda") {
      if (!visit.sale) return setPending({ kind: "sale", visit });
      return setPending({ kind: "postsale", visit });
    }
    setError(null);
    start(async () => {
      const res = await moveStage(visit.id, stage);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className="input pl-9" placeholder="Buscar por cliente, código ou bairro..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {me.role !== "funcionario" && (
          <select className="input sm:w-56" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
            <option value="">Todos os funcionários</option>
            {field.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">
          <input type="checkbox" checked={showLost} onChange={(e) => setShowLost(e.target.checked)} className="h-4 w-4 accent-brand-600" />
          Mostrar perdidas
        </label>
      </div>
      <ErrorBox message={error} />
      <p className="mb-3 hidden text-xs text-slate-500 md:block">Arraste os cartões entre as colunas para avançar o atendimento. Clique para abrir os detalhes.</p>

      <div className={`scroll-thin -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 ${busy ? "opacity-70" : ""}`}>
        {stages.map((stage) => {
          const meta = STAGE_META[stage];
          const items = filtered
            .filter((v) => v.stage === stage)
            .sort((a, b) => (stage === "agendada" || stage === "em_andamento" ? a.scheduledAt.localeCompare(b.scheduledAt) : b.updatedAt.localeCompare(a.updatedAt)));
          const total = items.reduce((s, v) => s + (v.sale?.total ?? v.estimatedValue), 0);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(stage);
              }}
              onDragLeave={() => setOver((o) => (o === stage ? null : o))}
              onDrop={() => drop(stage)}
              className={`flex w-[280px] shrink-0 flex-col rounded-2xl border bg-slate-100/70 transition xl:w-auto xl:flex-1 ${
                over === stage ? "border-brand-400 bg-brand-50 ring-2 ring-brand-300" : "border-slate-200"
              }`}
            >
              <div className="border-b border-slate-200 px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600">{items.length}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {meta.description}
                  {total > 0 && <span className="font-semibold text-slate-700"> · {compactMoney(total)}</span>}
                </p>
              </div>
              <div className="scroll-thin flex max-h-[calc(100vh-290px)] min-h-40 flex-col gap-2 overflow-y-auto p-2">
                {items.map((v) => {
                  const c = clientById.get(v.clientId);
                  const u = userById.get(v.assignedTo);
                  const late = v.stage === "agendada" && v.scheduledAt < now;
                  return (
                    <Link
                      key={v.id}
                      href={`/visitas/${v.id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", v.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(v.id);
                      }}
                      onDragEnd={() => setDragId(null)}
                      className={`block rounded-xl border bg-white p-3 shadow-sm transition hover:border-brand-300 hover:shadow ${
                        dragId === v.id ? "opacity-40" : ""
                      } ${late ? "border-rose-200" : "border-slate-200"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{c?.name ?? "—"}</p>
                        {u && <Avatar name={u.name} color={u.color} size="sm" />}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {v.code}
                        {v.address.district ? ` · ${v.address.district}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Pill className={late ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}>
                          <Icon name="clock" className="mr-1 h-3 w-3" />
                          {relativeDay(v.scheduledAt)} {timeBR(v.scheduledAt)}
                        </Pill>
                        {v.priority === "alta" && <Pill className={PRIORITY_META.alta.cls}>Alta</Pill>}
                        {v.sale ? (
                          <Pill className="bg-emerald-100 text-emerald-700">{money(v.sale.total)}</Pill>
                        ) : v.estimatedValue > 0 ? (
                          <Pill>est. {compactMoney(v.estimatedValue)}</Pill>
                        ) : null}
                        {v.postSale?.satisfaction && <Pill className="bg-amber-100 text-amber-700">★ {v.postSale.satisfaction}</Pill>}
                      </div>
                      {v.stage === "perdida" && v.lostReason && <p className="mt-2 line-clamp-2 text-[11px] text-rose-600">{v.lostReason}</p>}
                    </Link>
                  );
                })}
                {items.length === 0 && <p className="py-6 text-center text-xs text-slate-400">Nenhuma visita</p>}
              </div>
            </div>
          );
        })}
      </div>

      {pending?.kind === "checkout" && <CheckOutModal visit={pending.visit} onClose={() => setPending(null)} />}
      {pending?.kind === "sale" && <SaleModal visit={pending.visit} products={products} onClose={() => setPending(null)} />}
      {pending?.kind === "postsale" && <PostSaleModal visit={pending.visit} onClose={() => setPending(null)} />}
      {pending?.kind === "lost" && <LostModal visit={pending.visit} onClose={() => setPending(null)} />}
    </div>
  );
}
