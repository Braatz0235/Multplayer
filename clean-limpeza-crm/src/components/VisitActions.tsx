"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorBox } from "./ui";
import Icon from "./Icon";
import VisitForm from "./VisitForm";
import { CheckOutModal, getGeo, LostModal, PostSaleModal, SaleModal } from "./StageModals";
import { addComment, checkInVisit, deleteVisit, moveStage } from "@/lib/actions";
import { dateTimeBR } from "@/lib/format";
import { addressLine, whatsappUrl } from "@/lib/maps";
import type { Client, Product, PublicUser, Visit } from "@/lib/types";

type ModalKind = "edit" | "checkout" | "sale" | "postsale" | "lost" | "followup" | null;

export default function VisitActions({
  visit,
  client,
  clients,
  users,
  products,
  me,
}: {
  visit: Visit;
  client: Client | undefined;
  clients: Client[];
  users: PublicUser[];
  products: Product[];
  me: PublicUser;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const manager = me.role !== "funcionario";

  function act(fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? "Erro.");
      after?.();
      router.refresh();
    });
  }

  const confirmMsg = client
    ? `Olá ${client.contactName || client.name}! Aqui é da Clean Limpeza. Confirmando nossa visita em ${dateTimeBR(visit.scheduledAt)} no endereço ${addressLine(visit.address)}. Podemos confirmar?`
    : "";
  const wa = client ? whatsappUrl(client.whatsapp || client.phone, confirmMsg) : null;

  return (
    <div className="no-print">
      <ErrorBox message={error} />
      <div className="flex flex-wrap gap-2">
        {visit.stage === "agendada" && (
          <>
            <Button size="lg" icon="play" loading={pending} onClick={() => act(async () => checkInVisit(visit.id, await getGeo()))}>
              Iniciar visita (check-in)
            </Button>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
                <Icon name="whatsapp" /> Confirmar com o cliente
              </a>
            )}
            <Button variant="secondary" icon="edit" onClick={() => setModal("edit")}>
              Reagendar / editar
            </Button>
            <Button variant="ghost" icon="x" onClick={() => setModal("lost")}>
              Cancelar visita
            </Button>
          </>
        )}
        {visit.stage === "em_andamento" && (
          <>
            <Button size="lg" variant="success" icon="flag" onClick={() => setModal("checkout")}>
              Concluir visita (check-out)
            </Button>
            <Button size="lg" icon="cart" onClick={() => setModal("sale")}>
              Registrar venda
            </Button>
            <Button variant="ghost" icon="x" onClick={() => setModal("lost")}>
              Marcar como perdida
            </Button>
          </>
        )}
        {visit.stage === "concluida" && (
          <>
            <Button size="lg" variant="success" icon="cart" onClick={() => setModal("sale")}>
              Finalizar venda
            </Button>
            <Button variant="secondary" icon="calendar" onClick={() => setModal("followup")}>
              Agendar retorno
            </Button>
            <Button variant="ghost" icon="x" onClick={() => setModal("lost")}>
              Marcar como perdida
            </Button>
          </>
        )}
        {visit.stage === "venda_finalizada" && (
          <>
            <Button size="lg" icon="heart" onClick={() => setModal("postsale")}>
              Iniciar pós-venda
            </Button>
            <Button variant="secondary" icon="edit" onClick={() => setModal("sale")}>
              Editar venda
            </Button>
          </>
        )}
        {visit.stage === "pos_venda" && (
          <>
            <Button size="lg" icon="heart" onClick={() => setModal("postsale")}>
              Atualizar pós-venda
            </Button>
            <Button variant="secondary" icon="calendar" onClick={() => setModal("followup")}>
              Agendar visita de recompra
            </Button>
            <Button variant="secondary" icon="edit" onClick={() => setModal("sale")}>
              Editar venda
            </Button>
          </>
        )}
        {visit.stage === "perdida" && (
          <Button icon="calendar" loading={pending} onClick={() => act(() => moveStage(visit.id, "agendada"))}>
            Reabrir como agendada
          </Button>
        )}
        <Button variant="ghost" icon="printer" onClick={() => window.print()}>
          Imprimir
        </Button>
        {manager && (
          <Button
            variant="ghost"
            icon="trash"
            className="text-rose-600 hover:bg-rose-50"
            onClick={() => {
              if (confirm(`Excluir definitivamente a visita ${visit.code}?`)) act(() => deleteVisit(visit.id), () => router.push("/visitas"));
            }}
          >
            Excluir
          </Button>
        )}
      </div>

      {modal === "edit" && <VisitForm open visit={visit} clients={clients} users={users} me={me} onClose={() => setModal(null)} />}
      {modal === "followup" && (
        <VisitForm
          open
          clients={clients}
          users={users}
          me={me}
          onClose={() => setModal(null)}
          defaults={{
            clientId: visit.clientId,
            address: { ...visit.address },
            assignedTo: me.role === "funcionario" ? me.id : visit.assignedTo,
            type: visit.stage === "pos_venda" ? "pos_venda" : "negociacao",
          }}
        />
      )}
      {modal === "checkout" && <CheckOutModal visit={visit} onClose={() => setModal(null)} />}
      {modal === "sale" && <SaleModal visit={visit} products={products} onClose={() => setModal(null)} />}
      {modal === "postsale" && <PostSaleModal visit={visit} onClose={() => setModal(null)} />}
      {modal === "lost" && <LostModal visit={visit} onClose={() => setModal(null)} />}
    </div>
  );
}

export function CommentBox({ visitId }: { visitId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="no-print"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await addComment(visitId, text);
          if (!res.ok) return setError(res.error);
          setText("");
          router.refresh();
        });
      }}
    >
      <ErrorBox message={error} />
      <div className="flex gap-2">
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Adicionar observação ou comentário interno..." />
        <Button type="submit" loading={pending} icon="message" disabled={!text.trim()}>
          Enviar
        </Button>
      </div>
    </form>
  );
}
