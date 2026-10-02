"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/lib/actions";
import { Button, ErrorBox, Field } from "@/components/ui";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const res = await loginAction({ email: String(fd.get("email")), password: String(fd.get("password")) });
          if (res && !res.ok) setError(res.error);
        });
      }}
      className="space-y-4"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h1>
        <p className="text-sm text-slate-500">Entre com seu e-mail e senha para acessar o CRM.</p>
      </div>
      <ErrorBox message={error} />
      <Field label="E-mail">
        <input name="email" type="email" autoComplete="email" required className="input" placeholder="voce@cleanlimpeza.com.br" />
      </Field>
      <Field label="Senha">
        <input name="password" type="password" autoComplete="current-password" required className="input" />
      </Field>
      <Button type="submit" loading={pending} className="w-full" size="lg">
        Entrar
      </Button>
      <p className="text-center text-xs text-slate-500">Esqueceu a senha? Peça ao administrador para redefini-la.</p>
    </form>
  );
}
