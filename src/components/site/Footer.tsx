import type { Settings } from "@/lib/types";

export default function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="border-t border-gold/10 bg-ink-soft">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6">
        <img
          src={settings.logoImage}
          alt={settings.siteName}
          className="h-12 w-12 rounded-full border border-gold/40 object-cover"
        />
        <p className="font-display text-lg font-semibold text-gold-gradient">
          {settings.siteName}
        </p>
        <p className="max-w-md text-sm text-parchment/60">
          {settings.tagline} · Desde {settings.since}
        </p>

        <div className="flex items-center gap-4 text-sm text-parchment/70">
          <a
            href={`https://wa.me/${settings.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gold"
          >
            WhatsApp
          </a>
          <span className="h-3 w-px bg-gold/20" />
          <a
            href={settings.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gold"
          >
            Instagram
          </a>
          <span className="h-3 w-px bg-gold/20" />
          <a href="#topo" className="hover:text-gold">
            Voltar ao topo
          </a>
        </div>

        <p className="mt-4 text-xs text-parchment/35">
          © {new Date().getFullYear()} {settings.siteName}. Todos os direitos
          reservados.
        </p>
        <a href="/admin" className="text-xs text-parchment/25 hover:text-gold/60">
          Área administrativa
        </a>
      </div>
    </footer>
  );
}
