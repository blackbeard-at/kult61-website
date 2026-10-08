import { SITE } from '../config/site';

const abs = (path: string) => new URL(path, SITE.url).toString();

/** BreadcrumbList für Unterseiten: [["Events", "/events"], ["Titel", "/events/x"]] */
export function breadcrumb(items: [name: string, path: string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [['Startseite', '/'] as [string, string], ...items].map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: abs(path),
    })),
  };
}

export interface FaqItem {
  q: string;
  /** Antwort als HTML (für die Seite) */
  a: string;
}

// Kontaktdaten gehören nicht in die strukturierten Daten (Spam-Schutz): Telefon-Links werden ersetzt,
// die E-Mail steht ohnehin nur als „info [at] kult61 [dot] de“ im Text.
const stripHtml = (s: string) =>
  s
    .replace(/<a [^>]*data-obf="phone"[^>]*>.*?<\/a>/g, 'Telefonnummer siehe Website')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: stripHtml(i.a) },
    })),
  };
}
