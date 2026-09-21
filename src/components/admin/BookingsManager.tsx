"use client";

import { useMemo, useState } from "react";
import type { Booking, BookingStatus } from "@/lib/types";
import { formatCurrencyBRL, formatDatePtBr } from "@/lib/format";
import StatusBadge from "./StatusBadge";

const STATUS_OPTIONS: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "completed", label: "Concluído" },
  { value: "cancelled", label: "Cancelado" },
];

export default function BookingsManager({
  initialBookings,
  whatsapp,
}: {
  initialBookings: Booking[];
  whatsapp: string;
}) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (dateFilter && b.date !== dateFilter) return false;
      return true;
    });
  }, [bookings, statusFilter, dateFilter]);

  async function updateStatus(id: string, status: BookingStatus) {
    setError(null);
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao atualizar agendamento.");
      return;
    }
    setBookings((prev) => prev.map((b) => (b.id === id ? data : b)));
  }

  async function deleteBooking(id: string) {
    if (!confirm("Excluir este agendamento permanentemente?")) return;
    const res = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao excluir agendamento.");
      return;
    }
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as BookingStatus | "all")
          }
          className="rounded-xl border border-gold/20 bg-ink px-4 py-2.5 text-sm text-parchment focus:border-gold focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-xl border border-gold/20 bg-ink px-4 py-2.5 text-sm text-parchment focus:border-gold focus:outline-none [color-scheme:dark]"
        />
        {dateFilter && (
          <button
            type="button"
            onClick={() => setDateFilter("")}
            className="text-xs text-parchment/50 hover:text-gold"
          >
            Limpar data
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="card-frame rounded-2xl p-6 text-center text-sm text-parchment/50">
          Nenhum agendamento encontrado.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="card-frame rounded-2xl p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-parchment">
                    {formatDatePtBr(b.date)} às {b.time} · {b.serviceName}
                  </p>
                  <p className="mt-1 text-sm text-parchment/60">
                    {b.customerName} · {b.customerPhone}
                  </p>
                  <p className="mt-1 text-xs text-parchment/40">
                    {formatCurrencyBRL(b.servicePrice)}
                    {b.notes ? ` · Obs: ${b.notes}` : ""}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {b.status !== "confirmed" && b.status !== "completed" && (
                  <ActionButton
                    onClick={() => updateStatus(b.id, "confirmed")}
                    label="Confirmar"
                  />
                )}
                {b.status !== "completed" && (
                  <ActionButton
                    onClick={() => updateStatus(b.id, "completed")}
                    label="Concluir"
                  />
                )}
                {b.status !== "cancelled" && (
                  <ActionButton
                    onClick={() => updateStatus(b.id, "cancelled")}
                    label="Cancelar"
                    danger
                  />
                )}
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Olá ${b.customerName}, sobre seu agendamento de ${b.serviceName} em ${formatDatePtBr(b.date)} às ${b.time}...`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-gold/20 px-3 py-1.5 text-xs text-parchment/70 hover:border-gold/50 hover:text-gold"
                >
                  WhatsApp cliente
                </a>
                <button
                  type="button"
                  onClick={() => deleteBooking(b.id)}
                  className="rounded-full border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  onClick,
  label,
  danger,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
        danger
          ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
          : "border-gold/30 text-gold hover:bg-gold/10"
      }`}
    >
      {label}
    </button>
  );
}
