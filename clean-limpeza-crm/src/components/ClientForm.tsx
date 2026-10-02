"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AddressFields, { EMPTY_ADDRESS } from "./AddressFields";
import { Button, ErrorBox, Field, Modal } from "./ui";
import { saveClient } from "@/lib/actions";
import { SEGMENTS, SOURCES } from "@/lib/constants";
import type { Client, PublicUser } from "@/lib/types";

type Draft = Omit<Client, "id" | "createdAt" | "updatedAt"> & { id?: string };

const EMPTY: Draft = {
  type: "PJ",
  name: "",
  tradeName: "",
  document: "",
  contactName: "",
  contactRole: "",
  phone: "",
  whatsapp: "",
  email: "",
  segment: "",
  source: "",
  status: "lead",
  address: EMPTY_ADDRESS,
  notes: "",
  tags: [],
  ownerId: null,
};

export default function ClientForm({
  open,
  onClose,
  client,
  users,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  client?: Client | null;
  users: PublicUser[];
  onSaved?: (id: string) => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => (client ? { ...client } : { ...EMPTY }));
  const [tagText, setTagText] = useState(() => (client?.tags ?? []).join(", "));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  function submit() {
    setError(null);
    start(async () => {
      const tags = tagText.split(",").map((t) => t.trim()).filter(Boolean);
      const res = await saveClient({ ...draft, tags });
      if (!res.ok) return setError(res.error);
      onClose();
      if (onSaved && res.data) onSaved(res.data);
      else router.refresh();
    });
  }

  const sameAsPhone = draft.whatsapp === draft.phone;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={client ? "Editar cliente" : "Novo cliente"}
      subtitle="Dados cadastrais, contato e endereço para as visitas"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={pending} icon="check">
            Salvar cliente
          </Button>
        </>
      }
    >
      <ErrorBox message={error} />
      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-bold text-brand-700">Identificação</h3>
          <div className="grid gap-3 sm:grid-cols-6">
            <Field label="Tipo" className="sm:col-span-2">
              <select className="input" value={draft.type} onChange={(e) => set("type", e.target.value as Draft["type"])}>
                <option value="PJ">Pessoa jurídica</option>
                <option value="PF">Pessoa física</option>
              </select>
            </Field>
            <Field label={draft.type === "PJ" ? "Razão social / Nome" : "Nome completo"} className="sm:col-span-4">
              <input className="input" value={draft.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            {draft.type === "PJ" && (
              <Field label="Nome fantasia" className="sm:col-span-3">
                <input className="input" value={draft.tradeName} onChange={(e) => set("tradeName", e.target.value)} />
              </Field>
            )}
            <Field label={draft.type === "PJ" ? "CNPJ" : "CPF"} className={draft.type === "PJ" ? "sm:col-span-3" : "sm:col-span-6"}>
              <input className="input" value={draft.document} onChange={(e) => set("document", e.target.value)} />
            </Field>
            <Field label="Segmento" className="sm:col-span-2">
              <select className="input" value={draft.segment} onChange={(e) => set("segment", e.target.value)}>
                <option value="">Selecione</option>
                {SEGMENTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Origem do contato" className="sm:col-span-2">
              <select className="input" value={draft.source} onChange={(e) => set("source", e.target.value)}>
                <option value="">Selecione</option>
                {SOURCES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Status" className="sm:col-span-2">
              <select className="input" value={draft.status} onChange={(e) => set("status", e.target.value as Draft["status"])}>
                <option value="lead">Lead (prospect)</option>
                <option value="ativo">Cliente ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </Field>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold text-brand-700">Contato</h3>
          <div className="grid gap-3 sm:grid-cols-6">
            <Field label="Pessoa de contato" className="sm:col-span-3">
              <input className="input" value={draft.contactName} onChange={(e) => set("contactName", e.target.value)} />
            </Field>
            <Field label="Cargo" className="sm:col-span-3">
              <input className="input" value={draft.contactRole} onChange={(e) => set("contactRole", e.target.value)} placeholder="Síndico, compras, gerente..." />
            </Field>
            <Field label="Telefone" className="sm:col-span-2">
              <input
                className="input"
                inputMode="tel"
                value={draft.phone}
                onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value, whatsapp: sameAsPhone ? e.target.value : d.whatsapp }))}
              />
            </Field>
            <Field label="WhatsApp" className="sm:col-span-2">
              <input className="input" inputMode="tel" value={draft.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
            </Field>
            <Field label="E-mail" className="sm:col-span-2">
              <input className="input" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold text-brand-700">Endereço (usado no GPS das visitas)</h3>
          <AddressFields value={draft.address} onChange={(a) => set("address", a)} />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold text-brand-700">Relacionamento</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Responsável pela carteira">
              <select className="input" value={draft.ownerId ?? ""} onChange={(e) => set("ownerId", e.target.value || null)}>
                <option value="">Sem responsável</option>
                {users
                  .filter((u) => u.active)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Etiquetas" hint="Separe por vírgula. Ex.: contrato mensal, VIP">
              <input className="input" value={tagText} onChange={(e) => setTagText(e.target.value)} />
            </Field>
            <Field label="Observações" className="sm:col-span-2">
              <textarea className="input min-h-24" value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
          </div>
        </section>
      </div>
    </Modal>
  );
}
