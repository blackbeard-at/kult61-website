// Zentrale Stammdaten — werden von Layout, Schema.org, llms.txt, Impressum,
// Datenschutz und Kalender-Feed gemeinsam genutzt. Nur hier ändern.

export const SITE = {
  name: 'KULT61',
  url: 'https://kult61.de',
  tagline: 'Wo Underground auf Herz trifft',
  subline: 'Raum für Kunst, Musik & Begegnung',
  claim: 'Kunst Kultur Events',
  description:
    'KULT61 ist ein unabhängiger Kulturraum in Hanau-Großauheim: Konzerte, Partys & DJ-Sets, Kunst, Workshops und Raum für Kollektive – in einer ehemaligen KFZ-Halle. Aktuelle Events, Tickets und Räume mieten.',
  email: 'info@kult61.de',
  // Telefon (Angabe von Arif, 08.10.2026). E-Mail und Telefon NIE direkt ins HTML schreiben,
  // sondern über src/lib/contact.ts bzw. die Komponenten Mail.astro / Phone.astro ausgeben.
  phone: '0176 64601977',
  phoneIntl: '+49 176 64601977',
  // Sammelseite aller Vorverkaufstickets (Eventbrite)
  ticketsUrl: 'https://www.eventbrite.de/o/121269897363',
  address: {
    street: 'Hanauer Landstraße 61',
    zip: '63457',
    city: 'Hanau',
    district: 'Großauheim',
    region: 'Hessen',
    country: 'DE',
  },
  locationNote: 'Ehem. KFZ-Halle, Nähe Bahnhof Großauheim',
  // Kapazität laut Kunde (Stand 07.10.2026)
  capacity: {
    standing: 160, // stehend, ohne Tische und Stühle
    seated: '80–100', // mit Tischen und Stühlen (Geburtstage u. ä.)
  },
  // Betreiber laut Impressum
  operator: {
    name: 'Kompass Veranstaltungs GmbH & Co. KG',
    street: 'Grundstr. 46',
    zip: '63512',
    city: 'Hainburg',
    country: 'Deutschland',
    vatId: 'DE452006535',
  },
  // Wird als sameAs / Footer-Link ausgegeben, sobald gesetzt (siehe CLAUDE.md, offene Punkte)
  instagramUrl: '' as string,
} as const;

// Seite zum Mieten der Räume (Label + URL zentral, damit eine Umbenennung nur hier passiert;
// zusätzlich Datei src/pages/raum-mieten.astro umbenennen).
export const ROOMS = { label: 'Raum mieten', path: '/raum-mieten' } as const;

// Kopfleiste: Textlinks links …
export const NAV_LINKS = [
  { label: 'KULT61', href: '/#kult61' },
  { label: 'Über uns', href: '/#ueber-uns' },
  { label: 'Mitmachen', href: '/#mitmachen' },
  { label: 'Kontakt', href: '/#kontakt' },
] as const;

// … und rechts die Buttons (Anfrage wird in Header.astro ergänzt)
export const NAV_BUTTONS = [
  { label: 'Events', href: '/events' },
  { label: ROOMS.label, href: ROOMS.path },
] as const;


// Raumanfrage mit vorbereitetem Mailtext: Interessenten liefern gleich alle Angaben mit,
// die für ein Angebot nötig sind. (Nur Vorlagentext — keine personenbezogenen Daten in der URL.)
const RAUM_BODY = [
  'Hallo KULT61-Team,',
  '',
  'ich möchte gern die Räumlichkeiten anfragen. Bitte zu jedem Punkt kurz etwas ergänzen:',
  '',
  '* Wunschtermin oder Zeitraum',
  '* Anlass der Veranstaltung',
  '* Anzahl der Personen – stehend oder mit Tischen und Stühlen',
  '* Getränkewünsche – oder ob du eigene Getränke mitbringen möchtest',
  '* Catering gewünscht oder nicht',
  '',
  'Name und Telefonnummer:',
].join('\n');

// Mail-Vorlagen als reine Daten. Die Adresse wird bewusst NICHT hier zusammengebaut: Sie kommt erst im
// Browser dazu (src/scripts/contact.ts), damit sie nie als Klartext im HTML steht.
export const MAIL = {
  anfrage: { subject: 'Anfrage' },
  raum: { subject: 'Raumanfrage', body: RAUM_BODY },
} as const;
export type MailKind = keyof typeof MAIL;
