"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";
import { Avatar } from "./ui";
import { logoutAction } from "@/lib/actions";
import { ROLE_LABEL } from "@/lib/constants";
import type { PublicUser } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles?: PublicUser["role"][];
  mobile?: boolean;
  short?: string;
}

const NAV: NavItem[] = [
  { href: "/", label: "Painel", icon: "home", mobile: true },
  { href: "/minhas-visitas", label: "Minha rota do dia", short: "Rota", icon: "navigation", roles: ["funcionario"], mobile: true },
  { href: "/funil", label: "Funil de atendimento", short: "Funil", icon: "kanban", mobile: true },
  { href: "/visitas", label: "Visitas", icon: "list" },
  { href: "/agenda", label: "Agenda", icon: "calendar", mobile: true },
  { href: "/clientes", label: "Clientes", icon: "building", mobile: true },
  { href: "/desempenho", label: "Desempenho da equipe", icon: "chart", roles: ["admin", "gerente"] },
  { href: "/equipe", label: "Equipe", icon: "users", roles: ["admin", "gerente"] },
  { href: "/produtos", label: "Produtos", icon: "box" },
  { href: "/configuracoes", label: "Configurações", icon: "settings" },
];

export default function Shell({ user, company, children }: { user: PublicUser; company: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.role));
  if (user.role === "funcionario") {
    items.splice(items.findIndex((i) => i.href === "/produtos"), 0, { href: `/desempenho/${user.id}`, label: "Meu desempenho", icon: "chart" });
  }
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-center border-b border-white/10 px-5 py-5">
        <Link href="/" onClick={() => setOpen(false)}>
          <Image src="/logo-white.png" alt={company} width={190} height={80} priority className="h-auto w-44" />
        </Link>
      </div>
      <nav className="scroll-thin flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active(item.href) ? "bg-white text-brand-700 shadow" : "text-brand-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon name={item.icon} className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} color={user.color} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-brand-200">{ROLE_LABEL[user.role]}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="rounded-lg p-2 text-brand-100 hover:bg-white/10 hover:text-white" title="Sair">
              <Icon name="logout" className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const mobileItems = items.filter((i) => i.mobile).slice(0, 4);

  return (
    <div className="flex min-h-screen">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 bg-gradient-to-b from-brand-800 to-brand-950 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-gradient-to-b from-brand-800 to-brand-950 shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-brand-700 hover:bg-brand-50" aria-label="Abrir menu">
            <Icon name="menu" className="h-6 w-6" />
          </button>
          <Image src="/logo.png" alt={company} width={120} height={50} className="h-9 w-auto" priority />
          <Avatar name={user.name} color={user.color} />
        </header>

        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>

        <nav className="no-print fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-slate-200 bg-white lg:hidden">
          {mobileItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active(item.href) ? "text-brand-600" : "text-slate-500"}`}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              <span className="truncate px-1">{item.short ?? item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
