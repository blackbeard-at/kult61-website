// Prüft den fertigen Build (dist/) darauf, dass die Kontaktdaten nirgends im Klartext stehen
// (HTML, JSON-LD, Skripte, Textdateien). Aufruf: npm run build && npm run check:contact
// Erwartet das Ergebnis „keine Treffer“; bei Treffern Exit-Code 1.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve('dist');
// Nur der Teil der Seite zählt, der wirklich ausgeliefert wird; Bilder werden übersprungen.
const TEXT = /\.(html|txt|xml|js|css|json|ics|svg|webmanifest)$/i;

const patterns = [
  ['E-Mail info@kult61.de', /info@kult61\.de/i],
  ['E-Mail-Link (mailto: mit Adresse)', /mailto:[^"'`\s$]*@/i],
  ['Telefon 0176 64601977', /0?176[\s./-]*6460[\s./-]*1977/],
  ['Telefon +49 176 …', /\+?49[\s./-]*\(?0?\)?176[\s./-]*6460[\s./-]*1977/],
  ['Telefon-Link (tel: mit Ziffern)', /tel:\+?\d/i],
  // Kalender-UIDs in events.ics (…@kult61.de) sind keine Postfächer und müssen stabil bleiben
  ['E-Mail der Domain (beliebiger Absender)', /[\w.+-]+@kult61\.de/i, /\.ics$/i],
];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (TEXT.test(e.name)) out.push(p);
  }
  return out;
}

let hits = 0;
for (const file of await walk(DIST)) {
  const content = await readFile(file, 'utf8');
  for (const [name, re, skip] of patterns) {
    if (skip && skip.test(file)) continue;
    const m = content.match(re);
    if (m) {
      hits++;
      console.log(`✗ ${name} in ${path.relative(DIST, file)}  → …${content.slice(Math.max(0, m.index - 30), m.index + m[0].length + 20).replace(/\s+/g, ' ')}…`);
    }
  }
}
console.log(hits ? `\n${hits} Treffer: Kontaktdaten stehen im Klartext im Build.` : '✓ Keine Kontaktdaten im Klartext im Build (dist/).');
process.exit(hits ? 1 : 0);
