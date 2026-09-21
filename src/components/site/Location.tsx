import type { Settings } from "@/lib/types";

export default function Location({ settings }: { settings: Settings }) {
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
    settings.mapQuery
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <section id="localizacao" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="Onde estamos" title="Localização" />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="card-frame overflow-hidden rounded-2xl">
          <iframe
            title="Mapa"
            src={mapSrc}
            className="h-72 w-full border-0 grayscale invert-[92%] contrast-[90%] sm:h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="card-frame flex flex-col justify-center gap-5 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <IconPin />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                Endereço
              </p>
              <p className="mt-1 text-parchment/90">{settings.address}</p>
            </div>
          </div>

          <div className="gold-divider" />

          <div className="flex items-start gap-4">
            <IconPhone />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                Telefone / WhatsApp
              </p>
              <p className="mt-1 text-parchment/90">{settings.phone}</p>
            </div>
          </div>

          <div className="gold-divider" />

          <div className="flex items-start gap-4">
            <IconInstagram />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                Instagram
              </p>
              <a
                href={settings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-parchment/90 underline decoration-gold/40 underline-offset-4 hover:text-gold"
              >
                {settings.handle}
              </a>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-gold-soft"
            >
              Chamar no WhatsApp
            </a>
            <a
              href={mapSrc.replace("&output=embed", "")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-gold/40 px-5 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/10"
            >
              Ver rota
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/80">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-3xl font-bold text-parchment sm:text-4xl">
        {title}
      </h2>
      <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent" />
    </div>
  );
}

function IconPin() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="mt-0.5 shrink-0 text-gold">
      <path d="M12 21s7-6.2 7-11.2A7 7 0 1 0 5 9.8C5 14.8 12 21 12 21Z" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="mt-0.5 shrink-0 text-gold">
      <path
        d="M6.5 3.5h2.7l1.3 4-2 1.3a11 11 0 0 0 5.7 5.7l1.3-2 4 1.3v2.7a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="mt-0.5 shrink-0 text-gold">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="16.7" cy="7.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
