import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from '../config/site';

export type EventEntry = CollectionEntry<'events'>;

const TZ = 'Europe/Berlin';

/** Kalendertag (YYYY-MM-DD) des Events. YAML-Daten werden als UTC-Mitternacht gelesen. */
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Heutiger Tag in Berlin als YYYY-MM-DD (Build-Zeitpunkt). */
export function todayBerlin(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date());
}

export function formatDateShort(d: Date): string {
  const [y, m, day] = isoDay(d).split('-');
  return `${day}.${m}.${y}`;
}

export function formatDateLong(d: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** Alle Events, chronologisch aufsteigend. */
export async function getAllEvents(): Promise<EventEntry[]> {
  const all = await getCollection('events');
  return all.sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
}

/** Kommende Events (ab heute), nächstes zuerst. */
export async function getUpcomingEvents(): Promise<EventEntry[]> {
  const today = todayBerlin();
  return (await getAllEvents()).filter((e) => isoDay(e.data.date) >= today);
}

/** Vergangene Events, jüngstes zuerst. */
export async function getPastEvents(): Promise<EventEntry[]> {
  const today = todayBerlin();
  return (await getAllEvents())
    .filter((e) => isoDay(e.data.date) < today)
    .reverse();
}

export const eventUrl = (e: EventEntry) => `/events/${e.id}`;

/** Beschreibungstext des Events als Klartext (ohne Markdown-Zeichen). */
export const bodyPlain = (e: EventEntry) =>
  (e.body ?? '').replace(/[*_#>`]/g, '').replace(/\s+/g, ' ').trim();
export const absoluteUrl = (path: string) => new URL(path, SITE.url).toString();

/** Offset von Europe/Berlin an einem Tag (z. B. "+02:00") — Sommer-/Winterzeit korrekt. */
function berlinOffset(day: string): string {
  const noonUtc = new Date(`${day}T12:00:00Z`);
  const part = new Intl.DateTimeFormat('en', { timeZone: TZ, timeZoneName: 'longOffset' })
    .formatToParts(noonUtc)
    .find((p) => p.type === 'timeZoneName')?.value; // "GMT+02:00"
  const m = part?.match(/GMT([+-]\d{2}:\d{2})/);
  return m ? m[1] : '+01:00';
}

export function isoDateTime(day: string, time: string): string {
  return `${day}T${time}:00${berlinOffset(day)}`;
}

/** Preis in Euro aus dem Freitext `admission` ("Eintritt 10 €", "Eintritt frei"). */
function admissionPrice(admission?: string): string | undefined {
  if (!admission) return undefined;
  if (/frei/i.test(admission)) return '0';
  const m = admission.match(/(\d+(?:[.,]\d{1,2})?)/);
  return m ? m[1].replace(',', '.') : undefined;
}

function schemaType(categories: string[]): string {
  if (categories.includes('Comedy')) return 'ComedyEvent';
  if (categories.includes('Musik')) return 'MusicEvent';
  if (categories.includes('Tanz')) return 'DanceEvent';
  if (categories.includes('Kunst')) return 'VisualArtsEvent';
  return 'Event';
}

export const venuePlace = () => ({
  '@type': 'Place',
  name: SITE.name,
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE.address.street,
    postalCode: SITE.address.zip,
    addressLocality: `${SITE.address.city}-${SITE.address.district}`,
    addressRegion: SITE.address.region,
    addressCountry: SITE.address.country,
  },
});

/** Beschreibungstext für Meta/Schema: eigener Text, sonst ein sachlicher Standardsatz. */
export function eventDescription(e: EventEntry, bodyText: string): string {
  const base = `${e.data.title} am ${formatDateLong(e.data.date)} im KULT61, ${SITE.address.street} in ${SITE.address.zip} ${SITE.address.city}-${SITE.address.district}.`;
  const times = [
    e.data.doors && `Einlass ${e.data.doors} Uhr`,
    e.data.start && `Beginn ${e.data.start} Uhr`,
  ]
    .filter(Boolean)
    .join(', ');
  const extra = bodyText.replace(/\s+/g, ' ').trim();
  return [base, times && `${times}.`, extra].filter(Boolean).join(' ');
}

/** Meta-Description (≤ 155 Zeichen): nimmt nur Bausteine auf, die ganz hineinpassen — nie mitten im Wort abgeschnitten. */
export function eventMetaDescription(e: EventEntry, bodyText: string, max = 155): string {
  const times = [e.data.doors && `Einlass ${e.data.doors} Uhr`, e.data.start && `Beginn ${e.data.start} Uhr`]
    .filter(Boolean)
    .join(', ');
  const parts = [
    `${e.data.title} – ${formatDateLong(e.data.date)} im KULT61 in Hanau-Großauheim.`,
    e.data.status === 'cancelled' ? 'Dieses Event wurde abgesagt.' : undefined,
    times ? `${times}.` : undefined,
    e.data.ticketUrl ? 'Tickets im Vorverkauf.' : undefined,
    bodyText ? (/[.!?]$/.test(bodyText) ? bodyText : `${bodyText}.`) : undefined,
  ].filter((x): x is string => Boolean(x));
  let out = '';
  for (const part of parts) {
    const next = out ? `${out} ${part}` : part;
    if (next.length <= max) out = next;
  }
  // Notfall: Titel allein zu lang → am Wortende kürzen
  if (!out) {
    const cut = parts[0].slice(0, max - 1);
    out = `${cut.slice(0, cut.lastIndexOf(' ')).trimEnd()}…`;
  }
  return out;
}

/** schema.org/Event (Google-Eventsuche, KI-Assistenten). */
export function eventJsonLd(e: EventEntry, opts: { description: string; imageUrl?: string }) {
  const day = isoDay(e.data.date);
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType(e.data.categories),
    name: e.data.title,
    startDate: e.data.start ? isoDateTime(day, e.data.start) : e.data.doors ? isoDateTime(day, e.data.doors) : day,
    eventStatus:
      e.data.status === 'cancelled'
        ? 'https://schema.org/EventCancelled'
        : e.data.status === 'postponed'
          ? 'https://schema.org/EventPostponed'
          : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: venuePlace(),
    description: opts.description,
    url: absoluteUrl(eventUrl(e)),
    inLanguage: 'de-DE',
    organizer: { '@type': 'Organization', name: SITE.name, url: SITE.url },
  };
  if (e.data.doors) ld.doorTime = isoDateTime(day, e.data.doors);
  if (opts.imageUrl) ld.image = [opts.imageUrl];

  const price = admissionPrice(e.data.admission);
  if (e.data.ticketUrl || price !== undefined) {
    const offer: Record<string, unknown> = {
      '@type': 'Offer',
      url: e.data.ticketUrl ?? absoluteUrl(eventUrl(e)),
    };
    if (price !== undefined) {
      offer.price = price;
      offer.priceCurrency = 'EUR';
    }
    ld.offers = offer;
  }
  return ld;
}
