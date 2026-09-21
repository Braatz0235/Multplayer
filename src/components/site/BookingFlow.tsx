"use client";

import { useEffect, useMemo, useState } from "react";
import type { Settings } from "@/lib/types";
import type { GroupedServices } from "@/lib/queries";
import { formatCurrencyBRL, formatDatePtBr, formatDuration } from "@/lib/format";
import { SectionHeading } from "./Location";

interface Props {
  groupedServices: GroupedServices[];
  settings: Settings;
}

function todayISO(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  return parts;
}

function maxDateISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

interface BookingResult {
  booking: {
    serviceName: string;
    date: string;
    time: string;
    customerName: string;
  };
  whatsappUrl: string;
}

export default function BookingFlow({ groupedServices, settings }: Props) {
  const allServices = useMemo(
    () => groupedServices.flatMap((g) => g.services),
    [groupedServices]
  );

  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    allServices[0]?.id ?? ""
  );
  const [date, setDate] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);

  const selectedService = allServices.find((s) => s.id === selectedServiceId);

  useEffect(() => {
    if (!date || !selectedServiceId) return;
    let cancelled = false;

    async function loadSlots() {
      setLoadingSlots(true);
      setSelectedTime("");
      try {
        const res = await fetch(
          `/api/availability?date=${date}&serviceId=${encodeURIComponent(
            selectedServiceId
          )}`
        );
        const data = await res.json();
        if (!cancelled) setSlots(data.slots ?? []);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }

    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [date, selectedServiceId]);

  function handlePickService(id: string) {
    setSelectedServiceId(id);
    setResult(null);
    const el = document.getElementById("agendar");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedServiceId || !date || !selectedTime) {
      setError("Selecione serviço, data e horário.");
      return;
    }
    if (name.trim().length < 2) {
      setError("Informe seu nome completo.");
      return;
    }
    if (phone.trim().length < 8) {
      setError("Informe um telefone válido com DDD.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          date,
          time: selectedTime,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível agendar. Tente novamente.");
        if (date) {
          fetch(
            `/api/availability?date=${date}&serviceId=${encodeURIComponent(
              selectedServiceId
            )}`
          )
            .then((r) => r.json())
            .then((d) => setSlots(d.slots ?? []));
        }
        return;
      }
      setResult(data);
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setResult(null);
    setDate("");
    setSelectedTime("");
    setName("");
    setPhone("");
    setNotes("");
  }

  return (
    <>
      <section id="servicos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="O que oferecemos" title="Serviços" />

        <div className="mt-10 space-y-10">
          {groupedServices.map((group) => (
            <div key={group.category.id}>
              <h3 className="mb-4 font-display text-xl font-semibold text-gold">
                {group.category.name}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.services.map((service) => (
                  <div
                    key={service.id}
                    className="card-frame flex flex-col justify-between rounded-2xl p-5 transition hover:border-gold/40"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-display text-lg font-semibold text-parchment">
                          {service.name}
                        </h4>
                        <span className="whitespace-nowrap font-display text-lg font-bold text-gold">
                          {formatCurrencyBRL(service.price)}
                        </span>
                      </div>
                      {service.description && (
                        <p className="mt-2 text-sm text-parchment/60">
                          {service.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs uppercase tracking-wide text-parchment/40">
                        {formatDuration(service.durationMinutes)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePickService(service.id)}
                      className="mt-4 rounded-full border border-gold/40 py-2 text-sm font-semibold text-gold transition hover:bg-gold hover:text-ink"
                    >
                      Agendar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="agendar" className="bg-ink-soft py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <SectionHeading eyebrow="Reserve seu horário" title="Agendamento" />

          {result ? (
            <div className="card-frame mt-8 rounded-2xl p-6 text-center sm:p-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-green-400">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold text-parchment">
                Agendamento reservado!
              </h3>
              <p className="mt-2 text-parchment/70">
                {result.booking.serviceName} em{" "}
                {formatDatePtBr(result.booking.date)} às {result.booking.time}{" "}
                para {result.booking.customerName}.
              </p>
              <p className="mt-1 text-sm text-parchment/50">
                Confirme com a barbearia pelo WhatsApp para garantir seu horário.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  href={result.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft"
                >
                  Confirmar via WhatsApp
                </a>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-gold/40 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold/10"
                >
                  Novo agendamento
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="card-frame mt-8 space-y-5 rounded-2xl p-6 sm:p-8"
            >
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gold">
                  Serviço
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full rounded-xl border border-gold/20 bg-ink px-4 py-3 text-parchment focus:border-gold focus:outline-none"
                >
                  {groupedServices.map((group) => (
                    <optgroup key={group.category.id} label={group.category.name}>
                      {group.services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {formatCurrencyBRL(s.price)} ·{" "}
                          {formatDuration(s.durationMinutes)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gold">
                  Data
                </label>
                <input
                  type="date"
                  value={date}
                  min={todayISO()}
                  max={maxDateISO()}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gold/20 bg-ink px-4 py-3 text-parchment focus:border-gold focus:outline-none [color-scheme:dark]"
                />
              </div>

              {date && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gold">
                    Horário
                  </label>
                  {loadingSlots ? (
                    <p className="text-sm text-parchment/50">
                      Carregando horários...
                    </p>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-parchment/50">
                      Nenhum horário disponível nesta data. Escolha outra data.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {slots.map((slot) => (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                            selectedTime === slot
                              ? "border-gold bg-gold text-ink"
                              : "border-gold/20 text-parchment/80 hover:border-gold/50"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gold">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Seu nome"
                    className="w-full rounded-xl border border-gold/20 bg-ink px-4 py-3 text-parchment placeholder:text-parchment/30 focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gold">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="(62) 99999-9999"
                    className="w-full rounded-xl border border-gold/20 bg-ink px-4 py-3 text-parchment placeholder:text-parchment/30 focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gold">
                  Observações (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Alguma preferência ou observação?"
                  className="w-full resize-none rounded-xl border border-gold/20 bg-ink px-4 py-3 text-parchment placeholder:text-parchment/30 focus:border-gold focus:outline-none"
                />
              </div>

              {selectedService && (
                <div className="rounded-xl border border-gold/15 bg-ink px-4 py-3 text-sm text-parchment/70">
                  Resumo: <strong className="text-gold">{selectedService.name}</strong>
                  {" · "}
                  {formatCurrencyBRL(selectedService.price)}
                  {" · "}
                  {formatDuration(selectedService.durationMinutes)}
                  {date && selectedTime
                    ? ` · ${formatDatePtBr(date)} às ${selectedTime}`
                    : ""}
                </div>
              )}

              {error && (
                <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !date || !selectedTime}
                className="w-full rounded-full bg-gold py-3.5 text-sm font-semibold text-ink transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Agendando..." : "Confirmar agendamento"}
              </button>

              <p className="text-center text-xs text-parchment/40">
                Ao confirmar, você poderá enviar os detalhes para{" "}
                {settings.siteName} pelo WhatsApp.
              </p>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
