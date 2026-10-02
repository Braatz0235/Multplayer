"use client";

import Link from "next/link";
import { useEffect } from "react";
import Icon from "./Icon";
import { initials } from "@/lib/format";
import { STAGE_META } from "@/lib/constants";
import { buttonClass, type Variant } from "@/lib/button";

import type { Stage } from "@/lib/types";

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg"; icon?: string; loading?: boolean }) {
  return (
    <button type="button" {...props} disabled={props.disabled || loading} className={`${buttonClass(variant, size)} ${className}`}>
      {loading ? <Spinner /> : icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  icon,
  external,
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  icon?: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const cls = `${buttonClass(variant, size)} ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {icon && <Icon name={icon} />}
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {icon && <Icon name={icon} />}
      {children}
    </Link>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return <span className={`${className} inline-block animate-spin rounded-full border-2 border-current border-r-transparent`} />;
}

export function Field({ label, children, hint, className = "" }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl", xl: "sm:max-w-5xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${widths[size]}`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Fechar">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
      <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

export function StageBadge({ stage }: { stage: Stage }) {
  const m = STAGE_META[stage];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${m.bg} ${m.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.short}
    </span>
  );
}

export function Pill({ children, className = "bg-slate-100 text-slate-600" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>{children}</span>;
}

export function Avatar({ name, color, size = "md" }: { name: string; color?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-12 w-12 text-base" };
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${sizes[size]}`} style={{ background: color ?? "#335ea2" }} title={name}>
      {initials(name)}
    </span>
  );
}

export function EmptyState({ icon = "list", title, text, action }: { icon?: string; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p className="font-semibold text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stars({ value, onChange, size = "h-5 w-5" }: { value: number | null; onChange?: (v: number) => void; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`${onChange ? "cursor-pointer" : "cursor-default"} ${value && n <= value ? "text-amber-400" : "text-slate-300"}`}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
        >
          <svg viewBox="0 0 24 24" className={size} fill="currentColor">
            <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
