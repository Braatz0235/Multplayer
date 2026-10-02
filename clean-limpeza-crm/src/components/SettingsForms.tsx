"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AddressFields from "./AddressFields";
import { Button, ErrorBox, Field } from "./ui";
import { saveCompany, updateAccount } from "@/lib/actions";
import type { Company, PublicUser } from "@/lib/types";

function useSave() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();
  return {
    error,
    ok,
    pending,
    run(fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
      setError(null);
      setOk(false);
      start(async () => {
        const res = await fn();
        if (!res.ok) return setError(res.error ?? "Erro.");
        setOk(true);
        after?.();
        router.refresh();
      });
    },
  };
}

export function AccountForm({ me }: { me: PublicUser }) {
  const [name, setName] = useState(me.name);
  const [phone, setPhone] = useState(me.phone);
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const s = useSave();
  return (
    <section className="card p-5">
      <h2 className="mb-1 font-bold text-slate-900">Minha conta</h2>
      <p className="mb-4 text-sm text-slate-500">{me.email}</p>
      <ErrorBox message={s.error} />
      {s.ok && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Dados salvos.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Telefone">
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Senha atual" hint="Necessária apenas para trocar a senha">
          <input className="input" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="Nova senha">
          <input className="input" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNew(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          loading={s.pending}
          icon="check"
          onClick={() =>
            s.run(
              () => updateAccount({ name, phone, currentPassword, newPassword }),
              () => {
                setCurrent("");
                setNew("");
              },
            )
          }
        >
          Salvar
        </Button>
      </div>
    </section>
  );
}

export function CompanyForm({ company }: { company: Company }) {
  const [c, setC] = useState(company);
  const s = useSave();
  return (
    <section className="card p-5">
      <h2 className="mb-1 font-bold text-slate-900">Dados da empresa</h2>
      <p className="mb-4 text-sm text-slate-500">Exibidos no sistema e usados como ponto de partida das rotas.</p>
      <ErrorBox message={s.error} />
      {s.ok && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Dados salvos.</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nome da empresa">
          <input className="input" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
        </Field>
        <Field label="Telefone">
          <input className="input" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} />
        </Field>
        <Field label="E-mail">
          <input className="input" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} />
        </Field>
      </div>
      <div className="mt-4">
        <AddressFields value={c.address} onChange={(address) => setC({ ...c, address })} />
      </div>
      <div className="mt-4 flex justify-end">
        <Button loading={s.pending} icon="check" onClick={() => s.run(() => saveCompany(c))}>
          Salvar empresa
        </Button>
      </div>
    </section>
  );
}
