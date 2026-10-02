import Link from "next/link";
import Icon from "@/components/Icon";
import NewVisitButton from "@/components/NewVisitButton";
import PageHeader from "@/components/PageHeader";
import { Avatar, StageBadge } from "@/components/ui";
import { buttonClass } from "@/lib/button";
import { requireUser } from "@/lib/session";
import { byScheduled, loadScoped } from "@/lib/queries";
import { MONTHS_LONG, WEEKDAYS_SHORT, addDays, dateBR, timeBR, todayLocal, weekday } from "@/lib/format";
import { STAGE_META } from "@/lib/constants";

export const metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const view = sp.view === "month" ? "month" : "week";
  const today = todayLocal();
  const anchor = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : today;
  const userFilter = sp.user ?? "";
  const { db, visits, users } = await loadScoped(me);
  const clientById = new Map(db.clients.map((c) => [c.id, c]));
  const userById = new Map(users.map((u) => [u.id, u]));
  const scoped = visits.filter((v) => (!userFilter || v.assignedTo === userFilter) && v.stage !== "perdida");

  let days: string[];
  let prev: string;
  let next: string;
  let title: string;
  if (view === "week") {
    const start = addDays(anchor, -((weekday(anchor) + 6) % 7)); // segunda-feira
    days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    prev = addDays(start, -7);
    next = addDays(start, 7);
    title = `${dateBR(days[0]!)} a ${dateBR(days[6]!)}`;
  } else {
    const first = `${anchor.slice(0, 7)}-01`;
    const start = addDays(first, -((weekday(first) + 6) % 7));
    days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
    const [y, m] = anchor.split("-").map(Number);
    prev = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}-01`;
    next = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`;
    title = `${MONTHS_LONG[m - 1]} de ${y}`;
  }
  const byDay = new Map<string, typeof scoped>();
  for (const v of scoped.sort(byScheduled)) {
    const k = v.scheduledAt.slice(0, 10);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(v);
  }
  const link = (p: Record<string, string>) => {
    const q = new URLSearchParams({ view, d: anchor, ...(userFilter ? { user: userFilter } : {}), ...p });
    return `/agenda?${q.toString()}`;
  };
  const weekLabels = [1, 2, 3, 4, 5, 6, 0].map((d) => WEEKDAYS_SHORT[d]);

  return (
    <>
      <PageHeader title="Agenda de visitas" subtitle="Visualize a programação da equipe por semana ou mês" actions={<NewVisitButton clients={db.clients} users={users} me={me} />} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link href={link({ d: prev })} className={buttonClass("secondary", "sm")} aria-label="Anterior">
            <Icon name="chevronLeft" />
          </Link>
          <Link href={link({ d: today })} className={buttonClass("secondary", "sm")}>
            Hoje
          </Link>
          <Link href={link({ d: next })} className={buttonClass("secondary", "sm")} aria-label="Próximo">
            <Icon name="chevronRight" />
          </Link>
          <h2 className="ml-2 text-lg font-bold capitalize text-slate-900">{title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {me.role !== "funcionario" && (
            <form className="flex gap-2">
              <input type="hidden" name="view" value={view} />
              <input type="hidden" name="d" value={anchor} />
              <select name="user" defaultValue={userFilter} className="input py-1.5" aria-label="Funcionário">
                <option value="">Toda a equipe</option>
                {users
                  .filter((u) => u.role !== "admin")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
              <button className={buttonClass("secondary", "sm")}>OK</button>
            </form>
          )}
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
            <Link href={link({ view: "week" })} className={`rounded-md px-3 py-1 text-sm font-semibold ${view === "week" ? "bg-brand-600 text-white" : "text-slate-600"}`}>
              Semana
            </Link>
            <Link href={link({ view: "month" })} className={`rounded-md px-3 py-1 text-sm font-semibold ${view === "month" ? "bg-brand-600 text-white" : "text-slate-600"}`}>
              Mês
            </Link>
          </div>
        </div>
      </div>

      {view === "week" ? (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((day, i) => {
            const items = byDay.get(day) ?? [];
            return (
              <div key={day} className={`card min-h-40 p-2 ${day === today ? "ring-2 ring-brand-400" : ""}`}>
                <p className={`mb-2 px-1 text-xs font-bold uppercase ${day === today ? "text-brand-700" : "text-slate-500"}`}>
                  {weekLabels[i]} · {dateBR(day).slice(0, 5)}
                </p>
                <div className="space-y-1.5">
                  {items.map((v) => {
                    const u = userById.get(v.assignedTo);
                    return (
                      <Link
                        key={v.id}
                        href={`/visitas/${v.id}`}
                        className="block rounded-lg border-l-4 bg-slate-50 px-2 py-1.5 hover:bg-brand-50"
                        style={{ borderColor: u?.color ?? "#335ea2" }}
                      >
                        <p className="text-xs font-bold text-slate-800">{timeBR(v.scheduledAt)}</p>
                        <p className="line-clamp-2 text-xs text-slate-700">{clientById.get(v.clientId)?.name}</p>
                        <div className="mt-1 flex items-center justify-between gap-1">
                          <StageBadge stage={v.stage} />
                          {u && <Avatar name={u.name} color={u.color} size="sm" />}
                        </div>
                      </Link>
                    );
                  })}
                  {items.length === 0 && <p className="px-1 text-xs text-slate-400">Livre</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold uppercase text-slate-500">
            {weekLabels.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const items = byDay.get(day) ?? [];
              const inMonth = day.slice(0, 7) === anchor.slice(0, 7);
              return (
                <Link
                  key={day}
                  href={link({ view: "week", d: day })}
                  className={`min-h-20 border-b border-r border-slate-100 p-1.5 hover:bg-brand-50/50 sm:min-h-28 ${inMonth ? "" : "bg-slate-50/60 text-slate-400"}`}
                >
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${day === today ? "bg-brand-600 text-white" : ""}`}>
                    {Number(day.slice(8))}
                  </span>
                  <div className="mt-1 hidden space-y-0.5 sm:block">
                    {items.slice(0, 3).map((v) => (
                      <p key={v.id} className="truncate rounded px-1 text-[11px] text-white" style={{ background: userById.get(v.assignedTo)?.color ?? "#335ea2" }}>
                        {timeBR(v.scheduledAt)} {clientById.get(v.clientId)?.name}
                      </p>
                    ))}
                    {items.length > 3 && <p className="px-1 text-[11px] font-semibold text-slate-500">+{items.length - 3} visitas</p>}
                  </div>
                  {items.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                      {items.slice(0, 4).map((v) => (
                        <span key={v.id} className={`h-1.5 w-1.5 rounded-full ${STAGE_META[v.stage].dot}`} />
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {me.role !== "funcionario" && (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
          {users
            .filter((u) => u.role === "funcionario" && u.active)
            .map((u) => (
              <span key={u.id} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded" style={{ background: u.color }} />
                {u.name}
              </span>
            ))}
        </div>
      )}
    </>
  );
}
