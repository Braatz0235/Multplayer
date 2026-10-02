// Datas de agendamento são guardadas como horário local "YYYY-MM-DDTHH:mm"
// (fuso da empresa), evitando divergência entre fuso do servidor e do celular.
export const TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE || "America/Sao_Paulo";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const num = new Intl.NumberFormat("pt-BR");

export function money(value: number): string {
  return brl.format(Number.isFinite(value) ? value : 0);
}

export function compactMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (Math.abs(value) >= 10_000) return `R$ ${(value / 1000).toFixed(1).replace(".", ",")} mil`;
  return money(value);
}

export function number(value: number): string {
  return num.format(value);
}

export function percent(value: number): string {
  return `${(Number.isFinite(value) ? value * 100 : 0).toFixed(0)}%`;
}

/** "Agora" no fuso da empresa, no formato "YYYY-MM-DDTHH:mm". */
export function nowLocal(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function todayLocal(): string {
  return nowLocal().slice(0, 10);
}

/** Soma dias a uma data "YYYY-MM-DD" sem depender do fuso do processo. */
export function addDays(day: string, amount: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}

export function weekday(day: string): number {
  return new Date(`${day}T12:00:00Z`).getUTCDay();
}

const WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTHS_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export { WEEKDAYS_SHORT, MONTHS, MONTHS_LONG };

/** "02/10/2026" a partir de "2026-10-02..." */
export function dateBR(local: string | null | undefined): string {
  if (!local) return "—";
  const [y, m, d] = local.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function timeBR(local: string): string {
  return local.slice(11, 16);
}

export function dateTimeBR(local: string | null | undefined): string {
  if (!local) return "—";
  return `${dateBR(local)} às ${timeBR(local)}`;
}

export function longDate(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const text = `${WEEKDAYS[weekday(day)]}, ${d} de ${MONTHS_LONG[m - 1]} de ${y}`;
  return text[0]!.toUpperCase() + text.slice(1);
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]}/${String(y).slice(2)}`;
}

/** Formata um timestamp ISO (UTC) no fuso da empresa. */
export function isoToBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dateTimeBR(nowLocal(new Date(iso)));
}

export function relativeDay(local: string): string {
  const today = todayLocal();
  const day = local.slice(0, 10);
  if (day === today) return "Hoje";
  if (day === addDays(today, 1)) return "Amanhã";
  if (day === addDays(today, -1)) return "Ontem";
  return dateBR(day);
}

/** Diferença em minutos entre dois horários locais "YYYY-MM-DDTHH:mm". */
export function minutesBetween(a: string, b: string): number {
  return (Date.parse(`${b}:00Z`) - Date.parse(`${a}:00Z`)) / 60000;
}

export function duration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function phoneBR(value: string): string {
  const d = onlyDigits(value);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value;
}

export function documentBR(value: string): string {
  const d = onlyDigits(value);
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  return value;
}
