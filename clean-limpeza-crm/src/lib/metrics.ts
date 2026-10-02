import type { PublicUser, Visit } from "./types";
import { minutesBetween, nowLocal } from "./format";

export const isSold = (v: Visit) => v.stage === "venda_finalizada" || v.stage === "pos_venda";
export const isVisited = (v: Visit) =>
  v.stage === "concluida" || v.stage === "venda_finalizada" || v.stage === "pos_venda" || (v.stage === "perdida" && !!v.checkIn);

/** Dia (local) em que a venda foi fechada — usado para faturamento por período. */
export function saleDay(v: Visit): string {
  return v.sale ? nowLocal(new Date(v.sale.closedAt)).slice(0, 10) : v.scheduledAt.slice(0, 10);
}

export function inRange(day: string, from: string, to: string) {
  return day >= from && day <= to;
}

/** Atraso do check-in em minutos (negativo = adiantado). */
export function checkInDelay(v: Visit): number | null {
  if (!v.checkIn) return null;
  return minutesBetween(v.scheduledAt, nowLocal(new Date(v.checkIn.at)));
}

/** Tempo em campo (check-in → check-out) em minutos. */
export function timeOnSite(v: Visit): number | null {
  if (!v.checkIn || !v.checkOut) return null;
  return (Date.parse(v.checkOut.at) - Date.parse(v.checkIn.at)) / 60000;
}

export interface Performance {
  user: PublicUser;
  scheduled: number;
  visited: number;
  inProgress: number;
  pending: number;
  overdue: number;
  sales: number;
  lost: number;
  revenue: number;
  avgTicket: number;
  conversion: number;
  completionRate: number;
  goal: number;
  goalProgress: number;
  punctuality: number | null;
  avgTimeOnSite: number | null;
  satisfaction: number | null;
  nps: number | null;
  postSaleCount: number;
}

/**
 * Indicadores de um funcionário num período.
 * - Visitas: pela data agendada.
 * - Vendas/faturamento: pela data de fechamento.
 */
export function performanceFor(user: PublicUser, visits: Visit[], from: string, to: string, months = 1): Performance {
  const mine = visits.filter((v) => v.assignedTo === user.id);
  const period = mine.filter((v) => inRange(v.scheduledAt.slice(0, 10), from, to));
  const sold = mine.filter((v) => isSold(v) && v.sale && inRange(saleDay(v), from, to));
  const now = nowLocal();

  const visited = period.filter(isVisited);
  const revenue = sold.reduce((s, v) => s + (v.sale?.total ?? 0), 0);
  const delays = period.map(checkInDelay).filter((d): d is number => d !== null);
  const onTime = delays.filter((d) => d <= 15).length;
  const site = period.map(timeOnSite).filter((d): d is number => d !== null);
  const ratings = mine
    .filter((v) => v.postSale?.satisfaction && inRange(saleDay(v), from, to))
    .map((v) => v.postSale!.satisfaction!);
  const npsScores = mine
    .filter((v) => v.postSale?.nps != null && inRange(saleDay(v), from, to))
    .map((v) => v.postSale!.nps!);
  const decided = visited.length;
  // Visitas cujo horário já passou (canceladas sem check-in não contam).
  const due = period.filter((v) => v.scheduledAt <= now && !(v.stage === "perdida" && !v.checkIn));
  const goal = user.monthlyGoal * months;

  return {
    user,
    scheduled: period.length,
    visited: visited.length,
    inProgress: period.filter((v) => v.stage === "em_andamento").length,
    pending: period.filter((v) => v.stage === "agendada").length,
    overdue: period.filter((v) => v.stage === "agendada" && v.scheduledAt < now).length,
    sales: sold.length,
    lost: period.filter((v) => v.stage === "perdida").length,
    revenue,
    avgTicket: sold.length ? revenue / sold.length : 0,
    conversion: decided ? period.filter(isSold).length / decided : 0,
    completionRate: due.length ? Math.min(1, visited.length / due.length) : 0,
    goal,
    goalProgress: goal ? revenue / goal : 0,
    punctuality: delays.length ? onTime / delays.length : null,
    avgTimeOnSite: site.length ? site.reduce((a, b) => a + b, 0) / site.length : null,
    satisfaction: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    nps: npsScores.length ? npsFrom(npsScores) : null,
    postSaleCount: period.filter((v) => v.stage === "pos_venda").length,
  };
}

/** NPS clássico: % promotores (9-10) − % detratores (0-6). */
export function npsFrom(scores: number[]): number {
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

/** Faturamento por mês (últimos N meses), opcionalmente filtrado por funcionário. */
export function revenueByMonth(visits: Visit[], endMonth: string, count: number) {
  const months: string[] = [];
  let [y, m] = endMonth.split("-").map(Number);
  for (let i = 0; i < count; i++) {
    months.unshift(`${y}-${String(m).padStart(2, "0")}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return months.map((month) => {
    const sold = visits.filter((v) => isSold(v) && v.sale && saleDay(v).startsWith(month));
    return {
      month,
      revenue: sold.reduce((s, v) => s + (v.sale?.total ?? 0), 0),
      sales: sold.length,
      visits: visits.filter((v) => v.scheduledAt.startsWith(month) && isVisited(v)).length,
    };
  });
}

export function monthBounds(ym: string): { from: string; to: string } {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${ym}-01`, to: `${ym}-${String(last).padStart(2, "0")}` };
}
