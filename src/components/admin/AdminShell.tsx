"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Visão geral", icon: "home" },
  { href: "/admin/profile", label: "Perfil & Imagens", icon: "user" },
  { href: "/admin/services", label: "Serviços", icon: "scissors" },
  { href: "/admin/hours", label: "Horários", icon: "clock" },
  { href: "/admin/bookings", label: "Agendamentos", icon: "calendar" },
  { href: "/admin/account", label: "Minha conta", icon: "settings" },
];

export default function AdminShell({
  children,
  adminName,
  siteName,
  logoImage,
}: {
  children: React.ReactNode;
  adminName: string;
  siteName: string;
  logoImage: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-ink text-parchment">
      <aside className="hidden w-64 shrink-0 border-r border-gold/10 bg-ink-soft lg:flex lg:flex-col">
        <SidebarContent
          pathname={pathname}
          siteName={siteName}
          logoImage={logoImage}
          onNavigate={() => {}}
        />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative z-50 flex w-72 flex-col bg-ink-soft">
            <SidebarContent
              pathname={pathname}
              siteName={siteName}
              logoImage={logoImage}
              onNavigate={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gold/10 bg-ink-soft/60 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 text-gold lg:hidden"
              aria-label="Abrir menu"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <p className="text-sm text-parchment/60">
              Olá, <span className="font-semibold text-gold">{adminName}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden rounded-full border border-gold/30 px-4 py-1.5 text-xs font-semibold text-gold hover:bg-gold/10 sm:inline-block"
            >
              Ver site
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-ink hover:bg-gold-soft disabled:opacity-50"
            >
              {loggingOut ? "Saindo..." : "Sair"}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  siteName,
  logoImage,
  onNavigate,
}: {
  pathname: string | null;
  siteName: string;
  logoImage: string;
  onNavigate: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-gold/10 px-5 py-5">
        <img
          src={logoImage}
          alt=""
          className="h-10 w-10 rounded-full border border-gold/40 object-cover"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-gold">
            {siteName}
          </p>
          <p className="text-xs text-parchment/40">Painel administrativo</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-gold/15 text-gold"
                  : "text-parchment/70 hover:bg-ink-elevated hover:text-parchment"
              }`}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function NavIcon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10v9h12v-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6" strokeLinecap="round" />
        </svg>
      );
    case "scissors":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          <circle cx="6" cy="6" r="2" />
          <circle cx="6" cy="18" r="2" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 13a7.7 7.7 0 0 0 0-2l2-1.5-2-3.4-2.3.9a7.7 7.7 0 0 0-1.7-1L15 3.6h-3.9l-.4 2.4a7.7 7.7 0 0 0-1.7 1l-2.3-.9-2 3.4L6.6 11a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9a7.7 7.7 0 0 0 1.7 1l.4 2.4H15l.4-2.4a7.7 7.7 0 0 0 1.7-1l2.3.9 2-3.4Z"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
