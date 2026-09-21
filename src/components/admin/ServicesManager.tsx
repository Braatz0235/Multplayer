"use client";

import { useState } from "react";
import type { Category, Service } from "@/lib/types";
import { formatCurrencyBRL, formatDuration } from "@/lib/format";

interface ServiceDraft {
  categoryId: string;
  name: string;
  description: string;
  price: string;
  durationMinutes: string;
  active: boolean;
}

const EMPTY_DRAFT: ServiceDraft = {
  categoryId: "",
  name: "",
  description: "",
  price: "",
  durationMinutes: "30",
  active: true,
};

export default function ServicesManager({
  initialCategories,
  initialServices,
}: {
  initialCategories: Category[];
  initialServices: Service[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(EMPTY_DRAFT);
  const [savingCategory, setSavingCategory] = useState(false);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setError(null);
    setSavingCategory(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar categoria.");
        return;
      }
      setCategories((prev) => [...prev, data]);
      setNewCategoryName("");
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Excluir esta categoria?")) return;
    setError(null);
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao excluir categoria.");
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function openNewServiceForm(categoryId: string) {
    setDraft({ ...EMPTY_DRAFT, categoryId });
    setAddingToCategory(categoryId);
    setEditingServiceId(null);
  }

  function openEditServiceForm(service: Service) {
    setDraft({
      categoryId: service.categoryId,
      name: service.name,
      description: service.description,
      price: String(service.price),
      durationMinutes: String(service.durationMinutes),
      active: service.active,
    });
    setEditingServiceId(service.id);
    setAddingToCategory(null);
  }

  function cancelForm() {
    setEditingServiceId(null);
    setAddingToCategory(null);
    setDraft(EMPTY_DRAFT);
  }

  async function handleSaveService(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      categoryId: draft.categoryId,
      name: draft.name.trim(),
      description: draft.description.trim(),
      price: Number(draft.price),
      durationMinutes: Number(draft.durationMinutes),
      active: draft.active,
    };

    if (!payload.name || !payload.categoryId || Number.isNaN(payload.price)) {
      setError("Preencha nome, categoria e preço corretamente.");
      return;
    }

    try {
      if (editingServiceId) {
        const res = await fetch(`/api/admin/services/${editingServiceId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Erro ao salvar serviço.");
          return;
        }
        setServices((prev) =>
          prev.map((s) => (s.id === editingServiceId ? data : s))
        );
      } else {
        const res = await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Erro ao criar serviço.");
          return;
        }
        setServices((prev) => [...prev, data]);
      }
      cancelForm();
    } catch {
      setError("Erro de conexão.");
    }
  }

  async function handleDeleteService(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao excluir serviço.");
      return;
    }
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleToggleActive(service: Service) {
    const res = await fetch(`/api/admin/services/${service.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !service.active }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao atualizar serviço.");
      return;
    }
    setServices((prev) => prev.map((s) => (s.id === service.id ? data : s)));
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      <section className="card-frame rounded-2xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-gold">
          Nova categoria
        </h2>
        <form onSubmit={handleAddCategory} className="mt-3 flex gap-3">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Ex: Tratamentos"
            className="flex-1 rounded-xl border border-gold/20 bg-ink px-4 py-2.5 text-parchment focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            disabled={savingCategory}
            className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-soft disabled:opacity-50"
          >
            Adicionar
          </button>
        </form>
      </section>

      {categories.map((category) => {
        const categoryServices = services
          .filter((s) => s.categoryId === category.id)
          .sort((a, b) => a.order - b.order);

        return (
          <section key={category.id} className="card-frame rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-parchment">
                {category.name}
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openNewServiceForm(category.id)}
                  className="rounded-full border border-gold/30 px-4 py-1.5 text-xs font-semibold text-gold hover:bg-gold/10"
                >
                  + Serviço
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(category.id)}
                  className="rounded-full border border-red-500/30 px-4 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                >
                  Excluir categoria
                </button>
              </div>
            </div>

            <div className="mt-4 divide-y divide-gold/10">
              {categoryServices.length === 0 && (
                <p className="py-4 text-sm text-parchment/40">
                  Nenhum serviço nesta categoria.
                </p>
              )}
              {categoryServices.map((service) => (
                <div key={service.id} className="py-3">
                  {editingServiceId === service.id ? (
                    <ServiceForm
                      draft={draft}
                      setDraft={setDraft}
                      categories={categories}
                      onSubmit={handleSaveService}
                      onCancel={cancelForm}
                    />
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-parchment">
                          {service.name}{" "}
                          {!service.active && (
                            <span className="ml-1 rounded-full bg-parchment/10 px-2 py-0.5 text-xs text-parchment/50">
                              Inativo
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-parchment/50">
                          {formatCurrencyBRL(service.price)} ·{" "}
                          {formatDuration(service.durationMinutes)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(service)}
                          className="rounded-full border border-gold/20 px-3 py-1.5 text-xs text-parchment/70 hover:border-gold/50 hover:text-gold"
                        >
                          {service.active ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditServiceForm(service)}
                          className="rounded-full border border-gold/20 px-3 py-1.5 text-xs text-parchment/70 hover:border-gold/50 hover:text-gold"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(service.id)}
                          className="rounded-full border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {addingToCategory === category.id && (
                <div className="py-3">
                  <ServiceForm
                    draft={draft}
                    setDraft={setDraft}
                    categories={categories}
                    onSubmit={handleSaveService}
                    onCancel={cancelForm}
                  />
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ServiceForm({
  draft,
  setDraft,
  categories,
  onSubmit,
  onCancel,
}: {
  draft: ServiceDraft;
  setDraft: React.Dispatch<React.SetStateAction<ServiceDraft>>;
  categories: Category[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-gold/15 bg-ink p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="Nome do serviço"
          required
          className="rounded-lg border border-gold/20 bg-ink-soft px-3 py-2 text-sm text-parchment focus:border-gold focus:outline-none"
        />
        <select
          value={draft.categoryId}
          onChange={(e) =>
            setDraft((d) => ({ ...d, categoryId: e.target.value }))
          }
          required
          className="rounded-lg border border-gold/20 bg-ink-soft px-3 py-2 text-sm text-parchment focus:border-gold focus:outline-none"
        >
          <option value="" disabled>
            Categoria
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={draft.description}
        onChange={(e) =>
          setDraft((d) => ({ ...d, description: e.target.value }))
        }
        placeholder="Descrição (opcional)"
        rows={2}
        className="w-full rounded-lg border border-gold/20 bg-ink-soft px-3 py-2 text-sm text-parchment focus:border-gold focus:outline-none"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          type="number"
          min={0}
          step="0.01"
          value={draft.price}
          onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
          placeholder="Preço (R$)"
          required
          className="rounded-lg border border-gold/20 bg-ink-soft px-3 py-2 text-sm text-parchment focus:border-gold focus:outline-none"
        />
        <input
          type="number"
          min={5}
          step="5"
          value={draft.durationMinutes}
          onChange={(e) =>
            setDraft((d) => ({ ...d, durationMinutes: e.target.value }))
          }
          placeholder="Duração (min)"
          required
          className="rounded-lg border border-gold/20 bg-ink-soft px-3 py-2 text-sm text-parchment focus:border-gold focus:outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-parchment/70">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) =>
              setDraft((d) => ({ ...d, active: e.target.checked }))
            }
            className="h-4 w-4 accent-[#d4af37]"
          />
          Ativo
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink hover:bg-gold-soft"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-gold/20 px-4 py-2 text-xs text-parchment/70 hover:text-parchment"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
