// Schutz der Kontaktdaten vor Spam-Bots (Adress-Sammler).
//
// E-Mail und Telefonnummer stehen nie als Klartext im ausgelieferten HTML, in JSON-LD oder in Skripten:
//  - E-Mail: sichtbar als „info [at] kult61 [dot] de“, die Teile liegen rückwärts in data-Attributen.
//  - Telefon: sichtbar als HTML-Entitäten (&#48;&#49;…), die Ziffern liegen rückwärts in einem data-Attribut.
//  - src/scripts/contact.ts setzt beim ersten Bedienen der Seite (Maus, Touch, Tastatur, Scrollen) die
//    echten mailto:/tel:-Links zusammen. Bots ohne Interaktion sehen nur die entschärfte Form.
// Ohne JavaScript bleibt alles lesbar (nur nicht anklickbar); der Fußbereich (#kontakt) ist der Anker dafür.
import { SITE, MAIL, type MailKind } from '../config/site';

const rev = (s: string) => [...s].reverse().join('');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const entities = (s: string) => [...s].map((c) => (c === ' ' ? ' ' : `&#${c.codePointAt(0)};`)).join('');

const [mailUser, mailDomain] = SITE.email.split('@');
const phoneDigits = SITE.phoneIntl.replace(/\s/g, ''); // +4917664601977

/** Lesbare, aber für einfache Sammler unlesbare Schreibweise: info [at] kult61 [dot] de */
export const mailText = `${mailUser} [at] ${mailDomain.replace('.', ' [dot] ')}`;

interface LinkOptions {
  /** Linktext; ohne Angabe wird die Adresse gezeigt (nach der Aktivierung im Klartext) */
  label?: string;
  class?: string;
}

/** `<a>` für E-Mail. kind: vorbereiteter Betreff/Text (siehe MAIL in site.ts). */
export function mailLink(kind?: MailKind, opts: LinkOptions = {}): string {
  const preset = kind ? (MAIL[kind] as { subject: string; body?: string }) : undefined;
  const attrs = [
    opts.class ? `class="${opts.class}"` : '',
    'href="#kontakt"',
    'data-obf="mail"',
    `data-u="${rev(mailUser)}"`,
    `data-d="${rev(mailDomain)}"`,
    preset ? `data-s="${esc(preset.subject)}"` : '',
    preset?.body ? `data-b="${esc(preset.body)}"` : '',
    opts.label ? '' : 'data-show',
  ].filter(Boolean);
  return `<a ${attrs.join(' ')}>${opts.label ?? mailText}</a>`;
}

/** `<a>` für die Telefonnummer; Ziffern als HTML-Entitäten, tel:-Link kommt per Skript. */
export function phoneLink(opts: LinkOptions = {}): string {
  const attrs = [
    opts.class ? `class="${opts.class}"` : '',
    'href="#kontakt"',
    'data-obf="phone"',
    `data-p="${rev(phoneDigits)}"`,
  ].filter(Boolean);
  return `<a ${attrs.join(' ')}>${opts.label ?? entities(SITE.phone)}</a>`;
}
