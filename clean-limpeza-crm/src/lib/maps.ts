import type { Address } from "./types";

export function addressLine(a: Address): string {
  const first = [a.street, a.number].filter(Boolean).join(", ");
  const parts = [first, a.complement, a.district, [a.city, a.state].filter(Boolean).join(" - "), a.cep]
    .map((p) => p?.trim())
    .filter(Boolean);
  return parts.join(", ");
}

/** Texto usado para geolocalizar no Google Maps (sem complemento, que atrapalha a busca). */
export function mapQuery(a: Address): string {
  return [[a.street, a.number].filter(Boolean).join(", "), a.district, a.city, a.state, a.cep, "Brasil"]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
}

export function hasAddress(a: Address): boolean {
  return Boolean(a.street.trim() && a.city.trim());
}

/** Mapa incorporado (iframe) — não exige chave de API. */
export function mapsEmbedUrl(a: Address): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery(a))}&z=16&output=embed`;
}

/** Abre o endereço no Google Maps (app no celular, site no computador). */
export function mapsSearchUrl(a: Address): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery(a))}`;
}

/** Inicia a navegação GPS até o endereço a partir da localização atual. */
export function mapsDirectionsUrl(a: Address): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery(a))}&travelmode=driving&dir_action=navigate`;
}

export function wazeUrl(a: Address): string {
  return `https://waze.com/ul?q=${encodeURIComponent(mapQuery(a))}&navigate=yes`;
}

/**
 * Rota otimizada com várias paradas (rota do dia do funcionário).
 * O Google Maps aceita até 9 paradas intermediárias pela URL.
 */
export function mapsRouteUrl(stops: Address[]): string | null {
  const valid = stops.filter(hasAddress).map(mapQuery);
  if (valid.length === 0) return null;
  const destination = valid[valid.length - 1];
  const waypoints = valid.slice(0, -1).slice(0, 9);
  const params = new URLSearchParams({ api: "1", destination, travelmode: "driving" });
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function pointUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function whatsappUrl(phone: string, text?: string): string | null {
  let d = phone.replace(/\D/g, "");
  if (!d) return null;
  if (d.length <= 11) d = `55${d}`;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
