"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AddressFields, { EMPTY_ADDRESS } from "./AddressFields";
import ClientForm from "./ClientForm";
import { Button, ErrorBox, Field, Modal } from "./ui";
import { saveVisit } from "@/lib/actions";
import { VISIT_TYPE_LABEL } from "@/lib/constants";
import { addressLine } from "@/lib/maps";
import { nowLocal } from "@/lib/format";
import type { Address, Client, Priority, PublicUser, Visit, VisitType } from "@/lib/types";

interface Draft {
  id?: string;
  clientId: string;
  assignedTo: string;
  type: VisitType;
  priority: Priority;
  scheduledAt: string;
  durationMinutes: number;
  objective: string;
  estimatedValue: number;
  address: Address;
}

function defaultStart() {
  const now = nowLocal();
  const hour = Math.min(Number(now.slice(11, 13)) + 1, 17);
  return `${now.slice(0, 10)}T${String(hour).padStart(2, "0")}:00`;
}

export default function VisitForm({
  open,
  onClose,
  visit,
  clients,
  users,
  me,
  defaults,
}: {
  open: boolean;
  onClose: () => void;
  visit?: Visit | null;
  clients: Client[];
  users: PublicUser[];
  me: PublicUser;
  defaults?: Partial<Draft>;
}) {
  const router = useRouter();
  const fieldUsers = users.filter((u) => u.active && (u.role === "funcionario" || u.role === "gerente"));
  const [draft, setDraft] = useState<Draft>(() =>
    visit
      ? {
          id: visit.id,
          clientId: visit.clientId,
          assignedTo: visit.assignedTo,
          type: visit.type,
          priority: visit.priority,
          scheduledAt: visit.scheduledAt,
          durationMinutes: visit.durationMinutes,
          objective: visit.objective,
          estimatedValue: visit.estimatedValue,
          address: visit.address,
        }
      : {
          clientId: "",
          assignedTo: me.role === "funcionario" ? me.id : "",
          type: "prospeccao",
          priority: "media",
          scheduledAt: defaultStart(),
          durationMinutes: 60,
          objective: "",
          estimatedValue: 0,
          address: EMPTY_ADDRESS,
          ...defaults,
        },
  );
  const [customAddress, setCustomAddress] = useState(false);
  const [clientModal, setClientModal] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  // Cliente recém-cadastrado: seleciona assim que a lista atualizada chegar.
  const [pendingClient, setPendingClient] = useState<string | null>(null);
  if (pendingClient) {
    const created = clients.find((c) => c.id === pendingClient);
    if (created) {
      setPendingClient(null);
      setDraft((d) => ({ ...d, clientId: created.id, address: { ...created.address } }));
    }
  }

  const client = clients.find((c) => c.id === draft.clientId);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? clients.filter((c) => `${c.name} ${c.tradeName} ${c.contactName} ${c.address.district}`.toLowerCase().includes(q)) : clients;
    return list.slice(0, 200);
  }, [clients, search]);

  function pickClient(id: string) {
    const c = clients.find((x) => x.id === id);
    setDraft((d) => ({
      ...d,
      clientId: id,
      address: c ? { ...c.address } : d.address,
      assignedTo: d.assignedTo || (c?.ownerId && fieldUsers.some((u) => u.id === c.ownerId) ? c.ownerId : ""),
    }));
    setCustomAddress(false);
  }

  function submit() {
    setError(null);
    start(async () => {
      const res = await saveVisit(draft);
      if (!res.ok) return setError(res.error);
      onClose();
      if (!visit && res.data) router.push(`/visitas/${res.data}`);
      else router.refresh();
    });
  }

  const assignee = users.find((u) => u.id === draft.assignedTo);

  return (
    <>
      <Modal
        open={open && !clientModal}
        onClose={onClose}
        size="lg"
        title={visit ? `Editar visita ${visit.code}` : "Agendar nova visita"}
        subtitle="Defina cliente, funcionário, data e objetivo da visita"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={submit} loading={pending} icon="calendar">
              {visit ? "Salvar alterações" : "Agendar visita"}
            </Button>
          </>
        }
      >
        <ErrorBox message={error} />
        <div className="space-y-5">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <span className="label mb-0">Cliente</span>
              <button type="button" onClick={() => setClientModal(true)} className="text-xs font-semibold text-brand-600 hover:underline">
                + Cadastrar novo cliente
              </button>
            </div>
            {client && !visit ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{client.name}</p>
                  <p className="truncate text-xs text-slate-500">{addressLine(client.address) || "Sem endereço cadastrado"}</p>
                </div>
                <button type="button" className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => set("clientId", "")}>
                  Trocar
                </button>
              </div>
            ) : visit ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-800">{client?.name}</div>
            ) : (
              <div>
                <input className="input" placeholder="Buscar cliente por nome, contato ou bairro..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <div className="scroll-thin mt-2 max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                  {filtered.length === 0 && <p className="p-3 text-sm text-slate-500">Nenhum cliente encontrado.</p>}
                  {filtered.map((c) => (
                    <button key={c.id} type="button" onClick={() => pickClient(c.id)} className="block w-full px-3 py-2 text-left hover:bg-brand-50">
                      <span className="block text-sm font-medium text-slate-900">{c.name}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {[c.contactName, c.address.district, c.address.city].filter(Boolean).join(" · ")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <Field label="Funcionário responsável">
              <select
                className="input"
                value={draft.assignedTo}
                disabled={me.role === "funcionario"}
                onChange={(e) => set("assignedTo", e.target.value)}
              >
                <option value="">Selecione</option>
                {fieldUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                    {u.region ? ` — ${u.region}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo de visita">
              <select className="input" value={draft.type} onChange={(e) => set("type", e.target.value as VisitType)}>
                {Object.entries(VISIT_TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Data e horário">
              <input type="datetime-local" className="input" value={draft.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} />
            </Field>
            <Field label="Duração prevista">
              <select className="input" value={draft.durationMinutes} onChange={(e) => set("durationMinutes", Number(e.target.value))}>
                {[15, 30, 45, 60, 90, 120, 180, 240].map((m) => (
                  <option key={m} value={m}>
                    {m < 60 ? `${m} min` : `${m / 60}h`}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prioridade">
              <select className="input" value={draft.priority} onChange={(e) => set("priority", e.target.value as Priority)}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </Field>
            <Field label="Valor estimado do negócio (R$)">
              <input
                type="number"
                min={0}
                step="0.01"
                className="input"
                value={draft.estimatedValue || ""}
                onChange={(e) => set("estimatedValue", Number(e.target.value))}
              />
            </Field>
            <Field label="Objetivo / instruções para o funcionário" className="sm:col-span-2">
              <textarea
                className="input min-h-20"
                value={draft.objective}
                onChange={(e) => set("objective", e.target.value)}
                placeholder="Ex.: apresentar a linha hospitalar e levar amostras de desinfetante"
              />
            </Field>
          </section>

          {draft.clientId && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <span className="label mb-0">Local da visita</span>
                {!customAddress && (
                  <button type="button" onClick={() => setCustomAddress(true)} className="text-xs font-semibold text-brand-600 hover:underline">
                    Usar outro endereço
                  </button>
                )}
              </div>
              {customAddress || visit ? (
                <AddressFields value={draft.address} onChange={(a) => set("address", a)} />
              ) : (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{addressLine(draft.address) || "Cliente sem endereço — clique em “Usar outro endereço”."}</p>
              )}
            </section>
          )}
          {assignee && assignee.role === "gerente" && (
            <p className="text-xs text-amber-700">Atenção: a visita está atribuída a um gerenciador.</p>
          )}
        </div>
      </Modal>
      {clientModal && (
        <ClientForm
          open
          users={users}
          onClose={() => setClientModal(false)}
          onSaved={(id) => {
            setPendingClient(id);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
