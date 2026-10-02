"use client";

import Icon from "./Icon";
import { addressLine, hasAddress, mapsDirectionsUrl, mapsEmbedUrl, mapsSearchUrl, wazeUrl } from "@/lib/maps";
import type { Address } from "@/lib/types";

export function MapEmbed({ address, className = "h-64" }: { address: Address; className?: string }) {
  if (!hasAddress(address)) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 ${className}`}>
        Preencha rua e cidade para ver o mapa
      </div>
    );
  }
  return (
    <iframe
      title={`Mapa: ${addressLine(address)}`}
      src={mapsEmbedUrl(address)}
      className={`w-full rounded-xl border border-slate-200 ${className}`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}

export function NavButtons({ address, compact = false }: { address: Address; compact?: boolean }) {
  if (!hasAddress(address)) return null;
  const base = compact
    ? "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
    : "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold";
  return (
    <div className="flex flex-wrap gap-2">
      <a href={mapsDirectionsUrl(address)} target="_blank" rel="noopener noreferrer" className={`${base} bg-brand-600 text-white hover:bg-brand-700`}>
        <Icon name="navigation" /> {compact ? "GPS" : "Abrir no GPS"}
      </a>
      <a href={wazeUrl(address)} target="_blank" rel="noopener noreferrer" className={`${base} bg-sky-500 text-white hover:bg-sky-600`}>
        <Icon name="route" /> Waze
      </a>
      {!compact && (
        <a href={mapsSearchUrl(address)} target="_blank" rel="noopener noreferrer" className={`${base} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>
          <Icon name="pin" /> Ver no mapa
        </a>
      )}
    </div>
  );
}
