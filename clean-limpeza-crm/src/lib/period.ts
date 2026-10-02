import { addDays, dateBR, monthLabel, todayLocal } from "./format";
import { monthBounds } from "./metrics";

export const PERIODS = [
  { key: "mes", label: "Este mês" },
  { key: "mes_anterior", label: "Mês anterior" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "90d", label: "Últimos 90 dias" },
  { key: "ano", label: "Este ano" },
] as const;

export function resolvePeriod(key: string | undefined) {
  const today = todayLocal();
  const month = today.slice(0, 7);
  switch (key) {
    case "mes_anterior": {
      const [y, m] = month.split("-").map(Number);
      const prev = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`;
      return { key, ...monthBounds(prev), months: 1, label: monthLabel(prev) };
    }
    case "30d":
      return { key, from: addDays(today, -29), to: today, months: 1, label: "últimos 30 dias" };
    case "90d":
      return { key, from: addDays(today, -89), to: today, months: 3, label: "últimos 90 dias" };
    case "ano":
      return { key, from: `${today.slice(0, 4)}-01-01`, to: today, months: Number(month.slice(5)), label: `${today.slice(0, 4)}` };
    default:
      return { key: "mes", ...monthBounds(month), months: 1, label: monthLabel(month) };
  }
}

export function periodText(p: { from: string; to: string }) {
  return `${dateBR(p.from)} a ${dateBR(p.to)}`;
}
