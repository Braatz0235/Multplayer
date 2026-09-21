"use client";

import { useState } from "react";
import type { BusinessHours } from "@/lib/types";
import { WEEKDAY_NAMES } from "@/lib/format";

export default function HoursEditor({
  initialHours,
}: {
  initialHours: BusinessHours[];
}) {
  const [hours, setHours] = useState<BusinessHours[]>(initialHours);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function updateDay(day: number, patch: Partial<BusinessHours>) {
    setHours((prev) =>
      prev.map((h) => (h.day === day ? { ...h, ...patch } : h))
    );
  }

  async function handleSave() {
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hours),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Erro ao salvar." });
        return;
      }
      setHours(data);
      setMessage({ type: "success", text: "Horários atualizados." });
    } catch {
      setMessage({ type: "error", text: "Erro de conexão." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-frame divide-y divide-gold/10 rounded-2xl p-5 sm:p-6">
        {hours.map((h) => (
          <div
            key={h.day}
            className="flex flex-wrap items-center gap-4 py-3.5 first:pt-0 last:pb-0"
          >
            <span className="w-32 shrink-0 text-sm font-medium text-parchment">
              {WEEKDAY_NAMES[h.day]}
            </span>

            <label className="flex items-center gap-2 text-xs text-parchment/60">
              <input
                type="checkbox"
                checked={!h.closed}
                onChange={(e) =>
                  updateDay(h.day, { closed: !e.target.checked })
                }
                className="h-4 w-4 accent-[#d4af37]"
              />
              Aberto
            </label>

            {!h.closed && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={h.open}
                  onChange={(e) => updateDay(h.day, { open: e.target.value })}
                  className="rounded-lg border border-gold/20 bg-ink px-3 py-1.5 text-sm text-parchment focus:border-gold focus:outline-none [color-scheme:dark]"
                />
                <span className="text-parchment/40">até</span>
                <input
                  type="time"
                  value={h.close}
                  onChange={(e) => updateDay(h.day, { close: e.target.value })}
                  className="rounded-lg border border-gold/20 bg-ink px-3 py-1.5 text-sm text-parchment focus:border-gold focus:outline-none [color-scheme:dark]"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {message && (
        <p
          className={`rounded-lg px-4 py-2.5 text-sm ${
            message.type === "success"
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-full bg-gold px-8 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar horários"}
      </button>
    </div>
  );
}
