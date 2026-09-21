import type { Booking, BusinessHours, DB, Service } from "./types";

const TIME_ZONE = "America/Sao_Paulo";
const SLOT_INTERVAL_MINUTES = 30;

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Returns { year, month, day, weekday, hour, minute } for "now" in São Paulo time. */
export function nowInSaoPaulo(): {
  dateStr: string;
  minutes: number;
  weekday: number;
} {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);

  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const hour = map.hour === "24" ? 0 : Number(map.hour);

  return {
    dateStr: `${map.year}-${map.month}-${map.day}`,
    minutes: hour * 60 + Number(map.minute),
    weekday: weekdayMap[map.weekday],
  };
}

export function dateStrToWeekday(dateStr: string): number {
  // Parse as a local (São Paulo) calendar date, not UTC, to avoid off-by-one.
  const [y, m, d] = dateStr.split("-").map(Number);
  // Use noon UTC to sidestep DST edge cases when deriving the weekday.
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return utcNoon.getUTCDay();
}

export function isPastDate(dateStr: string): boolean {
  const { dateStr: today } = nowInSaoPaulo();
  return dateStr < today;
}

export function getAvailableSlots(
  db: DB,
  service: Service,
  dateStr: string
): string[] {
  const weekday = dateStrToWeekday(dateStr);
  const hours = db.hours.find((h: BusinessHours) => h.day === weekday);
  if (!hours || hours.closed) return [];

  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);
  const duration = service.durationMinutes;

  const activeBookings = db.bookings.filter(
    (b: Booking) => b.date === dateStr && b.status !== "cancelled"
  );

  const { dateStr: today, minutes: nowMinutes } = nowInSaoPaulo();
  const isToday = dateStr === today;

  const slots: string[] = [];
  for (
    let start = openMin;
    start + duration <= closeMin;
    start += SLOT_INTERVAL_MINUTES
  ) {
    const end = start + duration;

    if (isToday && start <= nowMinutes) continue;

    const overlaps = activeBookings.some((b) => {
      const bStart = timeToMinutes(b.time);
      const bEnd = bStart + b.serviceDuration;
      return start < bEnd && bStart < end;
    });

    if (!overlaps) slots.push(minutesToTime(start));
  }

  return slots;
}
