import { mailText } from '../lib/contact';
import type { APIRoute } from 'astro';
import { SITE } from '../config/site';
import { bodyPlain, eventUrl, absoluteUrl, formatDateLong, getUpcomingEvents, getPastEvents } from '../lib/events';

// Textfassung der Website für KI-Assistenten (llms.txt). Wird bei jedem Build erzeugt —
// die Event-Liste ist deshalb automatisch immer aktuell. Feste Texte hier pflegen,
// aber nur Inhalte, die auch auf der Website stehen.

export const GET: APIRoute = async () => {
  const upcoming = await getUpcomingEvents();
  const past = await getPastEvents();

  const eventLine = (e: Awaited<ReturnType<typeof getUpcomingEvents>>[number]) => {
    const times = [e.data.doors && `Einlass ${e.data.doors} Uhr`, e.data.start && `Beginn ${e.data.start} Uhr`]
      .filter(Boolean)
      .join(', ');
    const extra = [
      e.data.status === 'cancelled' && 'ABGESAGT',
      times,
      e.data.admission,
      e.data.ticketUrl && `Tickets: ${e.data.ticketUrl}`,
    ]
      .filter(Boolean)
      .join(' · ');
    const text = bodyPlain(e);
    return `- ${formatDateLong(e.data.date)}: [${e.data.title}](${absoluteUrl(eventUrl(e))})${extra ? ` – ${extra}` : ''}${text ? ` – ${text}` : ''}`;
  };

  const body = `# KULT61

> Unabhängiger Kulturraum in Hanau-Großauheim (Hessen): Konzerte, Partys & DJ-Sets, Kunstausstellungen, Workshops und Kollaborationen mit Kollektiven in einer ehemaligen KFZ-Halle. Claim: „Kunst Kultur Events“ – „Wo Underground auf Herz trifft“. Die Räume können außerdem für Feiern, Tanzkurse, Workshops und regelmäßige Events gemietet werden.

## Was ist KULT61?

KULT61 ist ein unabhängiger Kulturraum für Diversität, Kreativität und echten Austausch. Industrie trifft Kreativität: Eine ehemalige KFZ-Halle in der Nähe des Bahnhofs Großauheim ist Raum für Konzerte, Kunst, Subkultur und Begegnung. KULT61 steht für:

- Vielfalt in Kunst, Musik und Lebensentwürfen
- Offene, sichere Räume für alle Menschen
- Unterstützung junger und alternativer Kunstschaffender
- Verbindung von lokaler Szene und internationalem Einfluss

„KULT61 ist nicht Event. KULT61 ist Haltung. Bewegung. Ausdruck.“

## Programm

- Konzerte & Live-Performances (u. a. Rock, Stoner, Doom, Psychedelic)
- Partys & DJ-Sets (u. a. 80s/90s/2000s, Hip-Hop, House, elektronische Nächte)
- Karaoke, Song Slam, Stand-up-Comedy, Musik-Quiz, interaktive Events wie Murder Mystery
- Kunstausstellungen, Workshops & Austausch
- Kollektive & Kollaborationen

## Aktuelle Events (${upcoming.length})

${upcoming.length ? upcoming.map(eventLine).join('\n') : 'Derzeit sind keine kommenden Events eingetragen.'}

Den Eventkalender gibt es auch als Kalender-Feed zum Abonnieren: ${SITE.url}/events.ics

## Tickets

Vorverkaufstickets gibt es über Eventbrite: ${SITE.ticketsUrl}
Bei manchen Veranstaltungen gibt es eine Abendkasse oder freien Eintritt – Details stehen auf der jeweiligen Eventseite.

## Räumlichkeiten mieten

Veranstaltungsraum und Partylocation in einer ehemaligen KFZ-Halle in Hanau-Großauheim (Main-Kinzig-Kreis) für eigene Veranstaltungen, Geburtstage, kleinere Feiern, Tanzkurse, Workshops oder regelmäßige Events.

- Kapazität: bis zu ${SITE.capacity.standing} Personen stehend (ohne Tische und Stühle), ${SITE.capacity.seated} Personen mit Tischen und Stühlen (z. B. Geburtstage und ähnliche Veranstaltungen)
- Ausstattung: Bühne, Licht- & Soundanlage, Theke mit Kühlschränken, Sitzgelegenheiten
- Service: Die Theke läuft normalerweise über das KULT61-Team, dessen Personal zur Verfügung steht. Die Getränkeeinkäufe übernimmt das KULT61 (es muss nur bekannt sein, welche Getränke gewünscht sind). Eigene Getränke können nach Absprache mitgebracht werden. Zusammenarbeit mit Cateringfirmen.
- Vermietung: stundenweise, tageweise oder für feste Wochentermine
- Parkplätze: rund um das Gebäude ausreichend vorhanden
- Ideal für: Feiern, Tanzabende, Konzerte, kreative Workshops, Kurse u. v. m.
- Anfrage per E-Mail: ${mailText} oder telefonisch (Nummer: siehe ${SITE.url}/raum-mieten)

Mehr: ${SITE.url}/raum-mieten

## Mitmachen

Wer selbst etwas auf die Beine stellen will, ist willkommen. KULT61 bietet Raum für Ideen, ein Netzwerk mit anderen Kreativen, technisches Know-how & Support sowie Vermietungen – egal ob Musik, Kunst, Wort oder Aktion.

## Adresse & Kontakt

- KULT61, ${SITE.address.street}, ${SITE.address.zip} ${SITE.address.city}-${SITE.address.district} (${SITE.locationNote})
- Kontakt: E-Mail ${mailText}; Telefonnummer siehe ${SITE.url}/raum-mieten
- Instagram: ${SITE.instagramUrl}
- Facebook: ${SITE.facebookUrl}
- Google-Unternehmensprofil (Route, Bewertungen): ${SITE.googleProfileUrl}
- Betreiber: ${SITE.operator.name}, ${SITE.operator.street}, ${SITE.operator.zip} ${SITE.operator.city}

## Seiten

- [Startseite](${SITE.url}/): Überblick, Programm, Mitmachen, Räumlichkeiten, aktuelle Events, häufige Fragen
- [Events](${SITE.url}/events): Eventkalender mit allen kommenden Veranstaltungen
- [Vergangene Events](${SITE.url}/events/archiv): Archiv mit ${past.length} vergangenen Veranstaltungen (mit Suche)
- [Raum mieten](${SITE.url}/raum-mieten): Eventlocation mieten in Hanau-Großauheim (Kapazität, Service, Ausstattung, FAQ)
- [Impressum](${SITE.url}/impressum)
- [Datenschutz](${SITE.url}/datenschutz)
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
