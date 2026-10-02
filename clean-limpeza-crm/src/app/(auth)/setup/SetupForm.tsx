"use client";

import { useState, useTransition } from "react";
import { setupAction } from "@/lib/actions";
import { Button, ErrorBox, Field } from "@/components/ui";

export default function SetupForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (fd.get("password") !== fd.get("confirm")) {
          setError("As senhas não conferem.");
          return;
        }
        setError(null);
        start(async () => {
          const res = await setupAction({
            name: String(fd.get("name")),
            email: String(fd.get("email")),
            password: String(fd.get("password")),
            company: String(fd.get("company")),
            demo: fd.get("demo") === "on",
          });
          if (res && !res.ok) setError(res.error);
        });
      }}
      className="space-y-4"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configuração inicial</h1>
        <p className="text-sm text-slate-500">Crie a conta do administrador principal do CRM.</p>
      </div>
      <ErrorBox message={error} />
      <Field label="Empresa">
        <input name="company" defaultValue="Clean Limpeza" required className="input" />
      </Field>
      <Field label="Seu nome">
        <input name="name" required className="input" />
      </Field>
      <Field label="E-mail">
        <input name="email" type="email" required className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Senha">
          <input name="password" type="password" minLength={8} required className="input" />
        </Field>
        <Field label="Confirmar">
          <input name="confirm" type="password" minLength={8} required className="input" />
        </Field>
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm text-slate-700">
        <input name="demo" type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" />
        <span>
          <strong>Carregar dados de demonstração</strong>
          <span className="block text-xs text-slate-500">
            Cria 1 gerenciador, 3 funcionários, clientes e visitas de exemplo (senha dos usuários de teste = a mesma que você definir acima).
          </span>
        </span>
      </label>
      <Button type="submit" loading={pending} className="w-full" size="lg">
        Criar conta e entrar
      </Button>
    </form>
  );
}
