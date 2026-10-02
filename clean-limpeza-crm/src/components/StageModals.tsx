"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorBox, Field, Modal, Stars } from "./ui";
import Icon from "./Icon";
import { checkOutVisit, markLost, registerSale, savePostSale } from "@/lib/actions";
import { LOST_REASONS, PAYMENT_METHODS } from "@/lib/constants";
import { money } from "@/lib/format";
import type { Product, SaleItem, Visit } from "@/lib/types";

export type Geo = { lat: number; lng: number; accuracy: number } | null;

/** Pede a localização do aparelho (usada no check-in/check-out). */
export function getGeo(): Promise<Geo> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

function useSubmit(onDone: () => void) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  function submit(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? "Erro.");
      onDone();
      router.refresh();
    });
  }
  return { error, pending, submit };
}

const OUTCOMES = [
  "Cliente interessado — enviar proposta",
  "Pedido fechado na visita",
  "Cliente vai avaliar",
  "Retornar em outra data",
  "Sem interesse",
];

export function CheckOutModal({ visit, onClose }: { visit: Visit; onClose: () => void }) {
  const [report, setReport] = useState(visit.report);
  const [outcome, setOutcome] = useState(visit.outcome);
  const [nextSteps, setNextSteps] = useState(visit.nextSteps);
  const { error, pending, submit } = useSubmit(onClose);
  return (
    <Modal
      open
      onClose={onClose}
      title="Concluir visita"
      subtitle={`${visit.code} — registre o que aconteceu no cliente`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="success"
            icon="flag"
            loading={pending}
            onClick={() => submit(async () => checkOutVisit(visit.id, { report, outcome, nextSteps, geo: await getGeo() }))}
          >
            Concluir visita (check-out)
          </Button>
        </>
      }
    >
      <ErrorBox message={error} />
      <div className="space-y-3">
        <Field label="Resultado">
          <select className="input" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            <option value="">Selecione</option>
            {OUTCOMES.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Field>
        <Field label="Relatório da visita">
          <textarea
            className="input min-h-28"
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder="Com quem falou, necessidades levantadas, produtos apresentados, objeções..."
          />
        </Field>
        <Field label="Próximos passos">
          <textarea className="input min-h-16" value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} placeholder="Ex.: enviar orçamento até sexta" />
        </Field>
        <p className="text-xs text-slate-500">A localização do aparelho é registrada no check-out para comprovar a visita.</p>
      </div>
    </Modal>
  );
}

export function SaleModal({ visit, products, onClose }: { visit: Visit; products: Product[]; onClose: () => void }) {
  const [items, setItems] = useState<SaleItem[]>(visit.sale?.items ?? []);
  const [discount, setDiscount] = useState(visit.sale?.discount ?? 0);
  const [paymentMethod, setPaymentMethod] = useState(visit.sale?.paymentMethod ?? "PIX");
  const [paymentTerms, setPaymentTerms] = useState(visit.sale?.paymentTerms ?? "À vista");
  const [invoiceNumber, setInvoiceNumber] = useState(visit.sale?.invoiceNumber ?? "");
  const [deliveryDate, setDeliveryDate] = useState(visit.sale?.deliveryDate ?? "");
  const [pick, setPick] = useState("");
  const { error, pending, submit } = useSubmit(onClose);
  const active = products.filter((p) => p.active);
  const gross = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  function add() {
    if (pick === "__custom") {
      setItems((l) => [...l, { productId: null, name: "", quantity: 1, unitPrice: 0 }]);
    } else {
      const p = active.find((x) => x.id === pick);
      if (!p) return;
      setItems((l) => {
        const idx = l.findIndex((it) => it.productId === p.id);
        if (idx >= 0) return l.map((it, i) => (i === idx ? { ...it, quantity: it.quantity + 1 } : it));
        return [...l, { productId: p.id, name: p.name, quantity: 1, unitPrice: p.price }];
      });
    }
    setPick("");
  }
  const update = (i: number, patch: Partial<SaleItem>) => setItems((l) => l.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={visit.sale ? "Editar venda" : "Finalizar venda"}
      subtitle={`${visit.code} — itens do pedido e condições de pagamento`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="success"
            icon="cart"
            loading={pending}
            onClick={() =>
              submit(() => registerSale(visit.id, { items, discount, paymentMethod, paymentTerms, invoiceNumber, deliveryDate: deliveryDate || null }))
            }
          >
            Confirmar venda — {money(Math.max(0, gross - discount))}
          </Button>
        </>
      }
    >
      <ErrorBox message={error} />
      <div className="flex gap-2">
        <select className="input" value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">Adicionar produto do catálogo...</option>
          {active.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {money(p.price)}/{p.unit}
            </option>
          ))}
          <option value="__custom">+ Item avulso (fora do catálogo)</option>
        </select>
        <Button onClick={add} disabled={!pick} icon="plus">
          Adicionar
        </Button>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Produto</th>
              <th className="w-24 px-3 py-2">Qtd.</th>
              <th className="w-32 px-3 py-2">Preço un.</th>
              <th className="w-28 px-3 py-2 text-right">Subtotal</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  Nenhum produto adicionado.
                </td>
              </tr>
            )}
            {items.map((it, i) => (
              <tr key={i}>
                <td className="px-3 py-2">
                  {it.productId ? (
                    <span className="font-medium text-slate-800">{it.name}</span>
                  ) : (
                    <input className="input" value={it.name} placeholder="Descrição do item" onChange={(e) => update(i, { name: e.target.value })} />
                  )}
                </td>
                <td className="px-3 py-2">
                  <input type="number" min={1} step="1" className="input" value={it.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) })} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" min={0} step="0.01" className="input" value={it.unitPrice} onChange={(e) => update(i, { unitPrice: Number(e.target.value) })} />
                </td>
                <td className="px-3 py-2 text-right font-semibold">{money(it.quantity * it.unitPrice)}</td>
                <td className="px-2">
                  <button type="button" onClick={() => setItems((l) => l.filter((_, idx) => idx !== i))} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remover">
                    <Icon name="trash" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Desconto (R$)">
          <input type="number" min={0} step="0.01" className="input" value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value))} />
        </Field>
        <Field label="Forma de pagamento">
          <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Condição / prazo">
          <input className="input" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="À vista, 30/60 dias..." />
        </Field>
        <Field label="Nº do pedido / NF">
          <input className="input" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
        </Field>
        <Field label="Previsão de entrega">
          <input type="date" className="input" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
        </Field>
        <div className="rounded-xl bg-brand-50 p-3 text-right">
          <p className="text-xs text-slate-500">Bruto {money(gross)}</p>
          <p className="text-xs text-slate-500">Desconto −{money(discount)}</p>
          <p className="text-lg font-bold text-brand-700">{money(Math.max(0, gross - discount))}</p>
        </div>
      </div>
    </Modal>
  );
}

export function PostSaleModal({ visit, onClose }: { visit: Visit; onClose: () => void }) {
  const ps = visit.postSale;
  const [satisfaction, setSatisfaction] = useState<number | null>(ps?.satisfaction ?? null);
  const [nps, setNps] = useState<number | null>(ps?.nps ?? null);
  const [feedback, setFeedback] = useState(ps?.feedback ?? "");
  const [followUpDate, setFollowUpDate] = useState(ps?.followUpDate ?? "");
  const [nextAction, setNextAction] = useState(ps?.nextAction ?? "");
  const [completed, setCompleted] = useState(Boolean(ps?.completedAt));
  const { error, pending, submit } = useSubmit(onClose);

  return (
    <Modal
      open
      onClose={onClose}
      title="Pós-venda"
      subtitle={`${visit.code} — satisfação do cliente e próximo contato`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            icon="heart"
            loading={pending}
            onClick={() => submit(() => savePostSale(visit.id, { satisfaction, nps, feedback, followUpDate: followUpDate || null, nextAction, completed }))}
          >
            Salvar pós-venda
          </Button>
        </>
      }
    >
      <ErrorBox message={error} />
      <div className="space-y-4">
        <Field label="Satisfação com o atendimento e produtos">
          <Stars value={satisfaction} onChange={setSatisfaction} size="h-8 w-8" />
        </Field>
        <div>
          <span className="label">De 0 a 10, quanto recomendaria a Clean Limpeza? (NPS)</span>
          <div className="grid grid-cols-11 gap-1">
            {Array.from({ length: 11 }, (_, n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNps(n)}
                className={`rounded-md py-1.5 text-sm font-semibold ring-1 ring-inset ${
                  nps === n
                    ? n >= 9
                      ? "bg-emerald-600 text-white ring-emerald-600"
                      : n >= 7
                        ? "bg-amber-500 text-white ring-amber-500"
                        : "bg-rose-600 text-white ring-rose-600"
                    : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <Field label="Comentário do cliente">
          <textarea className="input min-h-20" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Próximo contato (recompra)">
            <input type="date" className="input" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
          </Field>
          <Field label="Ação">
            <input className="input" value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Ligar para repor estoque" />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} className="h-4 w-4 accent-brand-600" />
          Pós-venda encerrado (cliente atendido e satisfeito)
        </label>
      </div>
    </Modal>
  );
}

export function LostModal({ visit, onClose }: { visit: Visit; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const { error, pending, submit } = useSubmit(onClose);
  const text = [reason, detail.trim()].filter(Boolean).join(" — ");
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Cancelar / marcar como perdida"
      subtitle={visit.code}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Voltar
          </Button>
          <Button variant="danger" loading={pending} onClick={() => submit(() => markLost(visit.id, text))}>
            Confirmar
          </Button>
        </>
      }
    >
      <ErrorBox message={error} />
      <div className="space-y-3">
        <Field label="Motivo">
          <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Selecione</option>
            {LOST_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Detalhes (opcional)">
          <textarea className="input min-h-20" value={detail} onChange={(e) => setDetail(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
