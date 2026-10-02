"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorBox, Field, Modal, Pill } from "./ui";
import Icon from "./Icon";
import { saveProduct } from "@/lib/actions";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";

type Draft = Omit<Product, "id"> & { id?: string };

export default function ProductManager({ products, canEdit, sold }: { products: Product[]; canEdit: boolean; sold: Record<string, { qty: number; value: number }> }) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const list = useMemo(
    () =>
      products
        .filter((p) => (!cat || p.category === cat) && (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase())))
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    [products, q, cat],
  );
  const categories = [...new Set([...PRODUCT_CATEGORIES, ...products.map((p) => p.category).filter(Boolean)])];

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className="input pl-9" placeholder="Buscar produto ou código..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-60" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        {canEdit && (
          <Button icon="plus" onClick={() => setEditing({ sku: "", name: "", category: "", unit: "unidade", price: 0, active: true })}>
            Novo produto
          </Button>
        )}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Preço</th>
              <th className="px-4 py-3 text-right">Vendido (qtd.)</th>
              <th className="px-4 py-3 text-right">Faturado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((p) => (
              <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku || "—"}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{p.name}</p>
                  {!p.active && <Pill>Inativo</Pill>}
                </td>
                <td className="px-4 py-3 text-slate-600">{p.category || "—"}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {money(p.price)}
                  <span className="block text-[11px] font-normal text-slate-500">/{p.unit}</span>
                </td>
                <td className="px-4 py-3 text-right">{sold[p.id]?.qty ?? 0}</td>
                <td className="px-4 py-3 text-right">{money(sold[p.id]?.value ?? 0)}</td>
                <td className="px-4 py-3 text-right">
                  {canEdit && (
                    <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing({ ...p })}>
                      Editar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <ProductForm draft={editing} categories={categories} onClose={() => setEditing(null)} />}
    </>
  );
}

function ProductForm({ draft, categories, onClose }: { draft: Draft; categories: string[]; onClose: () => void }) {
  const router = useRouter();
  const [d, setD] = useState(draft);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={d.id ? "Editar produto" : "Novo produto"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            icon="check"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await saveProduct(d);
                if (!res.ok) return setError(res.error);
                onClose();
                router.refresh();
              })
            }
          >
            Salvar
          </Button>
        </>
      }
    >
      <ErrorBox message={error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome" className="sm:col-span-2">
          <input className="input" value={d.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Código / SKU">
          <input className="input" value={d.sku} onChange={(e) => set("sku", e.target.value)} />
        </Field>
        <Field label="Categoria">
          <input className="input" list="product-categories" value={d.category} onChange={(e) => set("category", e.target.value)} />
          <datalist id="product-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Preço (R$)">
          <input type="number" min={0} step="0.01" className="input" value={d.price} onChange={(e) => set("price", Number(e.target.value))} />
        </Field>
        <Field label="Unidade">
          <input className="input" value={d.unit} onChange={(e) => set("unit", e.target.value)} placeholder="galão, caixa, unidade..." />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input type="checkbox" checked={d.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-brand-600" />
          Disponível para venda
        </label>
      </div>
    </Modal>
  );
}
