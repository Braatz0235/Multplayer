import type { BusinessHours, Settings } from "@/lib/types";
import { WEEKDAY_NAMES } from "@/lib/format";
import { nowInSaoPaulo, timeToMinutes } from "@/lib/availability";
import { SectionHeading } from "./Location";

export default function Hours({
  hours,
  settings,
}: {
  hours: BusinessHours[];
  settings: Settings;
}) {
  const { weekday, minutes } = nowInSaoPaulo();
  const todayHours = hours.find((h) => h.day === weekday);
  const isOpenNow =
    !!todayHours &&
    !todayHours.closed &&
    minutes >= timeToMinutes(todayHours.open) &&
    minutes < timeToMinutes(todayHours.close);

  const sorted = [...hours].sort((a, b) => a.day - b.day);

  return (
    <section id="horarios" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="Funcionamento" title="Horários" />

      <div className="mx-auto mt-8 max-w-lg">
        <div className="mb-6 flex justify-center">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${
              isOpenNow
                ? "bg-green-500/15 text-green-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isOpenNow ? "bg-green-400" : "bg-red-400"
              }`}
            />
            {isOpenNow ? "Aberto agora" : "Fechado agora"}
          </span>
        </div>

        <div className="card-frame divide-y divide-gold/10 overflow-hidden rounded-2xl">
          {sorted.map((h) => {
            const isToday = h.day === weekday;
            return (
              <div
                key={h.day}
                className={`flex items-center justify-between px-5 py-3.5 text-sm ${
                  isToday ? "bg-gold/5" : ""
                }`}
              >
                <span
                  className={
                    isToday
                      ? "font-semibold text-gold"
                      : "text-parchment/85"
                  }
                >
                  {WEEKDAY_NAMES[h.day]}
                </span>
                <span
                  className={
                    h.closed
                      ? "text-parchment/40"
                      : isToday
                        ? "font-semibold text-gold"
                        : "text-parchment/85"
                  }
                >
                  {h.closed ? "Fechado" : `${h.open} – ${h.close}`}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-sm text-parchment/50">
          Atendimento com hora marcada · {settings.address}
        </p>
      </div>
    </section>
  );
}
