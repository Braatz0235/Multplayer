"use client";

import { useState } from "react";
import type { Settings } from "@/lib/types";
import ImageUploader from "./ImageUploader";

export default function ProfileForm({
  initialSettings,
}: {
  initialSettings: Settings;
}) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          rating: Number(settings.rating),
          reviewsCount: Number(settings.reviewsCount),
          followers: Number(settings.followers),
          following: Number(settings.following),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Erro ao salvar." });
        return;
      }
      setSettings(data);
      setMessage({ type: "success", text: "Alterações salvas com sucesso." });
    } catch {
      setMessage({ type: "error", text: "Erro de conexão." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="card-frame space-y-5 rounded-2xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-gold">
          Imagens
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <ImageUploader
            label="Foto de perfil"
            value={settings.profileImage}
            onChange={(url) => update("profileImage", url)}
            aspect="square"
          />
          <ImageUploader
            label="Logo (cabeçalho)"
            value={settings.logoImage}
            onChange={(url) => update("logoImage", url)}
            aspect="square"
          />
        </div>
        <ImageUploader
          label="Imagem de capa"
          value={settings.coverImage}
          onChange={(url) => update("coverImage", url)}
          aspect="wide"
        />
      </section>

      <section className="card-frame space-y-5 rounded-2xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-gold">
          Informações gerais
        </h2>
        <Field label="Nome da barbearia">
          <input
            value={settings.siteName}
            onChange={(e) => update("siteName", e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="@ do Instagram (exibição)">
            <input
              value={settings.handle}
              onChange={(e) => update("handle", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Desde (ano)">
            <input
              value={settings.since}
              onChange={(e) => update("since", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Frase / tagline">
          <input
            value={settings.tagline}
            onChange={(e) => update("tagline", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Biografia">
          <textarea
            value={settings.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={3}
            className={inputClass}
          />
        </Field>
      </section>

      <section className="card-frame space-y-5 rounded-2xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-gold">
          Contato & Localização
        </h2>
        <Field label="Endereço completo">
          <input
            value={settings.address}
            onChange={(e) => update("address", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Busca no mapa (nome + endereço)">
          <input
            value={settings.mapQuery}
            onChange={(e) => update("mapQuery", e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Telefone (exibição)">
            <input
              value={settings.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="WhatsApp (só números, com DDI e DDD)">
            <input
              value={settings.whatsapp}
              onChange={(e) =>
                update("whatsapp", e.target.value.replace(/\D/g, ""))
              }
              placeholder="5562999999999"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Link do Instagram">
          <input
            value={settings.instagram}
            onChange={(e) => update("instagram", e.target.value)}
            className={inputClass}
          />
        </Field>
      </section>

      <section className="card-frame space-y-5 rounded-2xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-gold">
          Estatísticas exibidas
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Avaliação (0 a 5)">
            <input
              type="number"
              step="0.1"
              min={0}
              max={5}
              value={settings.rating}
              onChange={(e) => update("rating", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Nº de avaliações">
            <input
              type="number"
              min={0}
              value={settings.reviewsCount}
              onChange={(e) =>
                update("reviewsCount", Number(e.target.value))
              }
              className={inputClass}
            />
          </Field>
          <Field label="Seguidores">
            <input
              type="number"
              min={0}
              value={settings.followers}
              onChange={(e) =>
                update("followers", Number(e.target.value))
              }
              className={inputClass}
            />
          </Field>
          <Field label="Seguindo">
            <input
              type="number"
              min={0}
              value={settings.following}
              onChange={(e) =>
                update("following", Number(e.target.value))
              }
              className={inputClass}
            />
          </Field>
        </div>
      </section>

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
        type="submit"
        disabled={saving}
        className="rounded-full bg-gold px-8 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-gold/20 bg-ink px-4 py-3 text-parchment focus:border-gold focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gold">
        {label}
      </label>
      {children}
    </div>
  );
}
