"use client";

import { useEffect, useState } from "react";
import { Field, Spinner } from "./ui";
import { MapEmbed } from "./Maps";
import { UF } from "@/lib/constants";
import type { Address } from "@/lib/types";

export const EMPTY_ADDRESS: Address = { cep: "", street: "", number: "", complement: "", district: "", city: "", state: "", reference: "" };

function maskCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export default function AddressFields({
  value,
  onChange,
  showMap = true,
}: {
  value: Address;
  onChange: (a: Address) => void;
  showMap?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  // Atualiza o mapa só depois que o usuário para de digitar.
  const [mapAddress, setMapAddress] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setMapAddress(value), 900);
    return () => clearTimeout(t);
  }, [value]);
  const set = (k: keyof Address, v: string) => onChange({ ...value, [k]: v });

  async function lookup(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoading(true);
    setCepError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError("CEP não encontrado.");
      } else {
        onChange({
          ...value,
          cep: maskCep(digits),
          street: data.logradouro || value.street,
          district: data.bairro || value.district,
          city: data.localidade || value.city,
          state: data.uf || value.state,
        });
      }
    } catch {
      setCepError("Não foi possível consultar o CEP. Preencha manualmente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <Field label="CEP" className="sm:col-span-2" hint={cepError ?? "Preenche o endereço automaticamente"}>
        <div className="relative">
          <input
            className="input"
            inputMode="numeric"
            value={value.cep}
            placeholder="00000-000"
            onChange={(e) => {
              const v = maskCep(e.target.value);
              set("cep", v);
              if (v.replace(/\D/g, "").length === 8) lookup(v);
            }}
          />
          {loading && <Spinner className="absolute right-3 top-2.5 h-4 w-4 text-brand-600" />}
        </div>
      </Field>
      <Field label="Rua / Avenida" className="sm:col-span-4">
        <input className="input" value={value.street} onChange={(e) => set("street", e.target.value)} />
      </Field>
      <Field label="Número" className="sm:col-span-1">
        <input className="input" value={value.number} onChange={(e) => set("number", e.target.value)} />
      </Field>
      <Field label="Complemento" className="sm:col-span-2">
        <input className="input" value={value.complement} onChange={(e) => set("complement", e.target.value)} placeholder="Sala, bloco..." />
      </Field>
      <Field label="Bairro" className="sm:col-span-3">
        <input className="input" value={value.district} onChange={(e) => set("district", e.target.value)} />
      </Field>
      <Field label="Cidade" className="sm:col-span-4">
        <input className="input" value={value.city} onChange={(e) => set("city", e.target.value)} />
      </Field>
      <Field label="UF" className="sm:col-span-2">
        <select className="input" value={value.state} onChange={(e) => set("state", e.target.value)}>
          <option value="">—</option>
          {UF.map((uf) => (
            <option key={uf}>{uf}</option>
          ))}
        </select>
      </Field>
      <Field label="Ponto de referência" className="sm:col-span-6">
        <input className="input" value={value.reference} onChange={(e) => set("reference", e.target.value)} placeholder="Portaria lateral, próximo ao mercado..." />
      </Field>
      {showMap && (
        <div className="sm:col-span-6">
          <MapEmbed address={mapAddress} className="h-52" />
        </div>
      )}
    </div>
  );
}
