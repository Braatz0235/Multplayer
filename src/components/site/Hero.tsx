import type { Settings } from "@/lib/types";

const QUICK_LINKS = [
  { href: "#servicos", label: "Serviços" },
  { href: "#localizacao", label: "Localização" },
  { href: "#horarios", label: "Horários" },
];

export default function Hero({ settings }: { settings: Settings }) {
  return (
    <section id="topo" className="relative">
      <div className="relative h-56 w-full overflow-hidden sm:h-72 md:h-80">
        <img
          src={settings.coverImage}
          alt="Capa"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/40" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="-mt-16 flex flex-col items-center text-center sm:-mt-20">
          <img
            src={settings.profileImage}
            alt={settings.siteName}
            className="h-32 w-32 rounded-full border-4 border-ink object-cover shadow-[0_0_0_2px_rgba(212,175,55,0.5)] sm:h-40 sm:w-40"
          />

          <h1 className="mt-4 font-display text-3xl font-bold text-gold-gradient sm:text-4xl">
            {settings.siteName}
          </h1>
          <p className="mt-1 text-sm text-parchment/60">{settings.handle}</p>

          <p className="mt-4 max-w-xl whitespace-pre-line text-base text-parchment/85 sm:text-lg">
            {settings.bio}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-parchment/70">
            <span>
              <strong className="text-gold">{settings.rating.toFixed(1)}</strong>{" "}
              ★ ({settings.reviewsCount} avaliações)
            </span>
            <span className="hidden h-4 w-px bg-gold/30 sm:inline-block" />
            <span>
              Desde <strong className="text-gold">{settings.since}</strong>
            </span>
            <span className="hidden h-4 w-px bg-gold/30 sm:inline-block" />
            <span>
              <strong className="text-gold">
                {settings.followers.toLocaleString("pt-BR")}
              </strong>{" "}
              seguidores
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#agendar"
              className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft"
            >
              Agendar horário
            </a>
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-gold/40 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold/10"
            >
              WhatsApp
            </a>
          </div>

          <div className="mt-8 grid w-full max-w-md grid-cols-3 gap-3">
            {QUICK_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="card-frame flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-xs font-semibold uppercase tracking-wide text-parchment/80 transition hover:border-gold/50 hover:text-gold"
              >
                <QuickIcon label={link.label} />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickIcon({ label }: { label: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
  };

  if (label === "Serviços") {
    return (
      <svg {...common} className="text-gold">
        <path d="M6 6l6 6m0 0l6 6M12 12L6 18m6-6l6-6" strokeLinecap="round" />
        <circle cx="6" cy="6" r="2.2" />
        <circle cx="6" cy="18" r="2.2" />
      </svg>
    );
  }
  if (label === "Localização") {
    return (
      <svg {...common} className="text-gold">
        <path
          d="M12 21s7-6.2 7-11.2A7 7 0 1 0 5 9.8C5 14.8 12 21 12 21Z"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="9.5" r="2.3" />
      </svg>
    );
  }
  return (
    <svg {...common} className="text-gold">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
