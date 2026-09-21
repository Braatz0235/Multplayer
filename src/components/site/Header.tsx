"use client";

import { useState } from "react";
import type { Settings } from "@/lib/types";

const NAV_LINKS = [
  { href: "#servicos", label: "Serviços" },
  { href: "#localizacao", label: "Localização" },
  { href: "#horarios", label: "Horários" },
];

export default function Header({ settings }: { settings: Settings }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gold/10 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#topo" className="flex items-center gap-3">
          <img
            src={settings.logoImage}
            alt={settings.siteName}
            className="h-10 w-10 rounded-full border border-gold/40 object-cover"
          />
          <span className="font-display text-lg font-semibold tracking-wide text-parchment">
            {settings.siteName}
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium tracking-wide text-parchment/80 transition hover:text-gold"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="#agendar"
            className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink transition hover:bg-gold-soft"
          >
            Agendar horário
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-gold md:hidden"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 4L16 16M16 4L4 16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5H17M3 10H17M3 15H17"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-gold/10 bg-ink px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-parchment/85 hover:bg-ink-elevated hover:text-gold"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#agendar"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-gold px-5 py-3 text-center text-sm font-semibold text-ink"
            >
              Agendar horário
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
