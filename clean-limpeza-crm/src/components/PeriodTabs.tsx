import Link from "next/link";
import { PERIODS } from "@/lib/period";

export default function PeriodTabs({ base, current }: { base: string; current: string }) {
  return (
    <div className="scroll-thin inline-flex max-w-full overflow-x-auto rounded-lg border border-slate-300 bg-white p-0.5">
      {PERIODS.map((p) => (
        <Link
          key={p.key}
          href={`${base}?p=${p.key}`}
          className={`whitespace-nowrap rounded-md px-3 py-1 text-sm font-semibold ${current === p.key ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
