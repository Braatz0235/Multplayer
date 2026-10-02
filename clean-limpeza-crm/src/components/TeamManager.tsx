"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, ErrorBox, Field, Modal, Pill } from "./ui";
import { saveUser } from "@/lib/actions";
import { ROLE_LABEL, USER_COLORS } from "@/lib/constants";
import { money, phoneBR } from "@/lib/format";
import type { PublicUser, Role } from "@/lib/types";

type Draft = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  region: string;
  monthlyGoal: number;
  managerId: string | null;
  color: string;
  active: boolean;
  password: string;
};

export default function TeamManager({
  users,
  me,
  stats,
}: {
  users: PublicUser[];
  me: PublicUser;
  stats: Record<string, { open: number; today: number }>;
}) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const managers = users.filter((u) => u.role === "gerente" && u.active);
  const groups: { role: Role; title: string; text: string }[] = [
    { role: "admin", title: "Administradores", text: "Acesso total ao sistema e configurações" },
    { role: "gerente", title: "Gerenciadores", text: "Agendam visitas, cadastram funcionários e acompanham o desempenho" },
    { role: "funcionario", title: "Funcionários de campo", text: "Realizam as visitas, fazem check-in/out e registram vendas" },
  ];

  function open(u?: PublicUser, role: Role = "funcionario") {
    setEditing(
      u
        ? { ...u, password: "" }
        : {
            name: "",
            email: "",
            phone: "",
            role,
            region: "",
            monthlyGoal: 0,
            managerId: me.role === "gerente" ? me.id : null,
            color: USER_COLORS[users.length % USER_COLORS.length]!,
            active: true,
            password: "",
          },
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button icon="plus" onClick={() => open(undefined, "funcionario")}>
          Novo funcionário
        </Button>
        {me.role === "admin" && (
          <Button variant="secondary" icon="plus" onClick={() => open(undefined, "gerente")}>
            Novo gerenciador
          </Button>
        )}
      </div>

      <div className="space-y-8">
        {groups.map((g) => {
          const list = users.filter((u) => u.role === g.role);
          if (list.length === 0 && g.role === "admin") return null;
          return (
            <section key={g.role}>
              <h2 className="text-lg font-bold text-slate-900">{g.title}</h2>
              <p className="mb-3 text-sm text-slate-500">{g.text}</p>
              {list.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">Nenhum cadastrado.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((u) => {
                    const canEdit = me.role === "admin" || u.role === "funcionario";
                    const manager = users.find((m) => m.id === u.managerId);
                    return (
                      <div key={u.id} className={`card p-4 ${u.active ? "" : "opacity-60"}`}>
                        <div className="flex items-start gap-3">
                          <Avatar name={u.name} color={u.color} size="lg" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-bold text-slate-900">{u.name}</p>
                              {!u.active && <Pill>Inativo</Pill>}
                              {u.id === me.id && <Pill className="bg-brand-50 text-brand-700">Você</Pill>}
                            </div>
                            <p className="truncate text-sm text-slate-500">{u.email}</p>
                            <p className="text-xs text-slate-500">
                              {[u.phone && phoneBR(u.phone), u.region].filter(Boolean).join(" · ") || ROLE_LABEL[u.role]}
                            </p>
                          </div>
                        </div>
                        {u.role === "funcionario" && (
                          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-lg bg-slate-50 py-1.5">
                              <p className="text-sm font-bold text-slate-900">{stats[u.id]?.today ?? 0}</p>
                              <p className="text-[10px] text-slate-500">hoje</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 py-1.5">
                              <p className="text-sm font-bold text-slate-900">{stats[u.id]?.open ?? 0}</p>
                              <p className="text-[10px] text-slate-500">em aberto</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 py-1.5">
                              <p className="truncate px-1 text-sm font-bold text-slate-900">{u.monthlyGoal ? money(u.monthlyGoal).replace(",00", "") : "—"}</p>
                              <p className="text-[10px] text-slate-500">meta/mês</p>
                            </div>
                          </div>
                        )}
                        {manager && <p className="mt-2 text-xs text-slate-500">Gerente: {manager.name}</p>}
                        <div className="mt-3 flex gap-2">
                          {canEdit && (
                            <Button size="sm" variant="secondary" icon="edit" onClick={() => open(u)}>
                              Editar
                            </Button>
                          )}
                          {u.role === "funcionario" && (
                            <Link href={`/desempenho/${u.id}`} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                              Ver desempenho →
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {editing && <UserForm draft={editing} me={me} managers={managers} onClose={() => setEditing(null)} />}
    </>
  );
}

function UserForm({ draft: initial, me, managers, onClose }: { draft: Draft; me: PublicUser; managers: PublicUser[]; onClose: () => void }) {
  const router = useRouter();
  const [d, setD] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  return (
    <Modal
      open
      onClose={onClose}
      title={d.id ? `Editar ${d.name}` : `Novo ${d.role === "gerente" ? "gerenciador" : d.role === "admin" ? "administrador" : "funcionário"}`}
      subtitle="Dados de acesso e informações de trabalho"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            loading={pending}
            icon="check"
            onClick={() => {
              setError(null);
              start(async () => {
                const res = await saveUser(d);
                if (!res.ok) return setError(res.error);
                onClose();
                router.refresh();
              });
            }}
          >
            Salvar
          </Button>
        </>
      }
    >
      <ErrorBox message={error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome completo" className="sm:col-span-2">
          <input className="input" value={d.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="E-mail (login)">
          <input className="input" type="email" value={d.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Telefone / WhatsApp">
          <input className="input" inputMode="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Perfil de acesso">
          <select className="input" value={d.role} disabled={me.role !== "admin"} onChange={(e) => set("role", e.target.value as Role)}>
            <option value="funcionario">{ROLE_LABEL.funcionario}</option>
            <option value="gerente">{ROLE_LABEL.gerente}</option>
            <option value="admin">{ROLE_LABEL.admin}</option>
          </select>
        </Field>
        <Field label="Região / rota">
          <input className="input" value={d.region} onChange={(e) => set("region", e.target.value)} placeholder="Zona Sul, Centro..." />
        </Field>
        {d.role === "funcionario" && (
          <>
            <Field label="Meta mensal de vendas (R$)">
              <input type="number" min={0} step="100" className="input" value={d.monthlyGoal || ""} onChange={(e) => set("monthlyGoal", Number(e.target.value))} />
            </Field>
            <Field label="Gerenciador responsável">
              <select className="input" value={d.managerId ?? ""} onChange={(e) => set("managerId", e.target.value || null)}>
                <option value="">—</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
        <Field label={d.id ? "Nova senha (deixe em branco para manter)" : "Senha inicial"} hint="Mínimo de 8 caracteres">
          <input className="input" type="password" autoComplete="new-password" value={d.password} onChange={(e) => set("password", e.target.value)} />
        </Field>
        <div>
          <span className="label">Cor na agenda</span>
          <div className="flex flex-wrap gap-2 pt-1">
            {USER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("color", c)}
                className={`h-7 w-7 rounded-full ring-offset-2 ${d.color === c ? "ring-2 ring-slate-900" : ""}`}
                style={{ background: c }}
                aria-label={`Cor ${c}`}
              />
            ))}
          </div>
        </div>
        {d.id && d.id !== me.id && (
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input type="checkbox" checked={d.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Usuário ativo (desmarque para bloquear o acesso)
          </label>
        )}
      </div>
    </Modal>
  );
}
