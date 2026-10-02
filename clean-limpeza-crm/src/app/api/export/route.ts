import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { loadScoped } from "@/lib/queries";
import { applyFilters, parseFilters } from "@/lib/filters";
import { STAGE_META, VISIT_TYPE_LABEL } from "@/lib/constants";
import { dateTimeBR, isoToBR, todayLocal } from "@/lib/format";
import { addressLine } from "@/lib/maps";

function cell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const num = (n: number) => n.toFixed(2).replace(".", ",");

export async function GET(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return new Response("Não autorizado", { status: 401 });
  const { db, visits, users } = await loadScoped(me);
  const clientById = new Map(db.clients.map((c) => [c.id, c]));
  const userById = new Map(users.map((u) => [u.id, u]));
  const f = parseFilters(Object.fromEntries(request.nextUrl.searchParams));
  const list = applyFilters(visits, clientById, f).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const header = [
    "Código", "Cliente", "Contato", "Telefone", "Endereço", "Tipo", "Funcionário", "Agendada para", "Etapa",
    "Check-in", "Check-out", "Resultado", "Valor estimado", "Valor da venda", "Pagamento", "Satisfação", "NPS", "Motivo da perda",
  ];
  const rows = list.map((v) => {
    const c = clientById.get(v.clientId);
    return [
      v.code, c?.name, c?.contactName, c?.phone, addressLine(v.address), VISIT_TYPE_LABEL[v.type],
      userById.get(v.assignedTo)?.name, dateTimeBR(v.scheduledAt), STAGE_META[v.stage].short,
      v.checkIn ? isoToBR(v.checkIn.at) : "", v.checkOut ? isoToBR(v.checkOut.at) : "", v.outcome,
      num(v.estimatedValue), v.sale ? num(v.sale.total) : "", v.sale?.paymentMethod ?? "",
      v.postSale?.satisfaction ?? "", v.postSale?.nps ?? "", v.lostReason,
    ];
  });
  // ";" + BOM para abrir corretamente no Excel em português.
  const csv = "﻿" + [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="visitas-${todayLocal()}.csv"`,
    },
  });
}
