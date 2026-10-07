import type { APIRoute } from 'astro';
import { SITE } from '../config/site';
import { bodyPlain, eventUrl, absoluteUrl, getUpcomingEvents, isoDay } from '../lib/events';

// Kalender-Feed (iCalendar) aller kommenden Events — zum Abonnieren in Apple Kalender, Google Kalender, Outlook.
// Wird bei jedem Build aus den Event-Dateien erzeugt.

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Zeilen auf max. 75 Oktette falten (RFC 5545), ohne UTF-8-Zeichen zu zerteilen. */
function fold(line: string): string {
  const enc = new TextEncoder();
  let out = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > 74) {
      out += '\r\n ';
      bytes = 1;
    }
    out += ch;
    bytes += n;
  }
  return out;
}

const compact = (day: string) => day.replaceAll('-', '');
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Berlin',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

export const GET: APIRoute = async () => {
  const events = await getUpcomingEvents();
  const location = `${SITE.name}, ${SITE.address.street}, ${SITE.address.zip} ${SITE.address.city}-${SITE.address.district}`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KULT61//Eventkalender//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:KULT61 Events',
    'X-WR-TIMEZONE:Europe/Berlin',
    'X-WR-CALDESC:Konzerte, Partys und mehr im KULT61 in Hanau-Großauheim',
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
    ...VTIMEZONE,
  ];

  for (const e of events) {
    const day = compact(isoDay(e.data.date));
    const time = e.data.start ?? e.data.doors;
    const desc = [
      e.data.doors && `Einlass ${e.data.doors} Uhr`,
      e.data.start && `Beginn ${e.data.start} Uhr`,
      e.data.admission,
      bodyPlain(e),
      e.data.ticketUrl && `Tickets: ${e.data.ticketUrl}`,
      absoluteUrl(eventUrl(e)),
    ]
      .filter(Boolean)
      .join('\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}@kult61.de`,
      `DTSTAMP:${stamp()}`,
      time ? `DTSTART;TZID=Europe/Berlin:${day}T${time.replace(':', '')}00` : `DTSTART;VALUE=DATE:${day}`,
      `SUMMARY:${esc(e.data.title)}`,
      `LOCATION:${esc(location)}`,
      `DESCRIPTION:${esc(desc)}`,
      `URL:${absoluteUrl(eventUrl(e))}`,
      `STATUS:${e.data.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
      ...(e.data.categories.length ? [`CATEGORIES:${e.data.categories.map(esc).join(',')}`] : []),
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');

  return new Response(lines.map(fold).join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
