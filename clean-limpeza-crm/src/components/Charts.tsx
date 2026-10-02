import { compactMoney, monthLabel } from "@/lib/format";

/** Gráfico de barras simples (SVG) para faturamento mensal. */
export function RevenueBars({ data }: { data: { month: string; revenue: number; sales: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <div className="flex h-56 items-end gap-2 sm:gap-3">
      {data.map((d) => {
        const h = Math.max(2, (d.revenue / max) * 100);
        return (
          <div key={d.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100 sm:text-xs">{compactMoney(d.revenue)}</span>
            <div className="relative w-full max-w-12 rounded-t-lg bg-gradient-to-t from-brand-700 to-brand-400 transition group-hover:from-brand-800" style={{ height: `${h}%` }}>
              {d.sales > 0 && <span className="absolute inset-x-0 top-1 text-center text-[10px] font-bold text-white">{d.sales}</span>}
            </div>
            <span className="text-[11px] font-medium text-slate-500">{monthLabel(d.month)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Funil horizontal com a quantidade em cada etapa. */
export function Funnel({ rows }: { rows: { label: string; value: number; color: string; hint?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium text-slate-700">{r.label}</span>
            <span className="font-bold text-slate-900">
              {r.value}
              {r.hint && <span className="ml-1 text-xs font-normal text-slate-500">{r.hint}</span>}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${r.color}`} style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Meter({ value, className = "bg-brand-600" }: { value: number; className?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  );
}
