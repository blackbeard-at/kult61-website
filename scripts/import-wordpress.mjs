// Einmaliger Import der Events aus dem alten WordPress (kult61.de, Uncode-Theme)
// über die öffentliche REST-API. Erzeugt pro Beitrag
//   src/content/events/<slug>.md   (Frontmatter + Beschreibung)
//   src/assets/events/<slug>.webp  (Poster, max. 1600 px)
//   public/_redirects              (alte WP-URLs → neue URLs, 301)
//
// Aufruf: npm run import:wp            (nur beim ersten Mal)
//         npm run import:wp -- --force  (überschreibt ALLE Event-Dateien — auch spätere Änderungen!)
// Die Rohdaten landen in scripts/.wp-cache/ (nicht im Repo).

import { mkdir, writeFile, readFile, access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'scripts/.wp-cache');
const EVENTS_DIR = path.join(ROOT, 'src/content/events');
const POSTER_DIR = path.join(ROOT, 'src/assets/events');
const WP = 'https://kult61.de/wp-json/wp/v2';

const CATEGORY_NAMES = {
  3: 'Event',
  5: 'Musik',
  74: 'Tanz',
  78: 'Comedy',
  4: 'Kunst',
  73: 'Kultur',
};

const exists = (p) => access(p).then(() => true, () => false);

const decodeEntities = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function fetchAllPosts() {
  const cacheFile = path.join(CACHE, 'posts.json');
  if (await exists(cacheFile)) return JSON.parse(await readFile(cacheFile, 'utf8'));
  const all = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${WP}/posts?per_page=100&page=${page}&_embed=wp:featuredmedia`);
    if (!res.ok) break;
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < 100) break;
  }
  await mkdir(CACHE, { recursive: true });
  await writeFile(cacheFile, JSON.stringify(all));
  return all;
}

// Uncode packt den Inhalt in Shortcodes ([vc_row …]) — Text und Ticket-Button herausziehen.
function parseContent(rendered) {
  const raw = decodeEntities(rendered).replace(/[”″“]/g, '"');

  const ticketMatch = raw.match(/\[vc_button[^\]]*?link="url:([^|"]+)/);
  const ticketUrl = ticketMatch ? decodeURIComponent(ticketMatch[1]) : undefined;

  const text = raw
    .replace(/\[\/?[a-z_]+[^\]]*\]/g, '')
    .replace(/<br[^>]*>/g, '\n')
    .replace(/<\/(p|div|h\d|li)>/g, '\n')
    .replace(/<[^>]+>/g, '');

  const lines = text
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  return { lines, ticketUrl };
}

function parseTime(lines, keyword) {
  for (const line of lines) {
    const m = line.match(new RegExp(`${keyword}[^\\d]{0,12}(\\d{1,2})(?:[:.](\\d{2}))?`, 'i'));
    if (m) return `${m[1].padStart(2, '0')}:${m[2] ?? '00'}`;
  }
  return undefined;
}

function parseAdmission(lines) {
  const joined = lines.join(' | ');
  if (/eintritt\s*frei/i.test(joined)) return 'Eintritt frei';
  const m = joined.match(/(Abendkasse|Eintritt)[:\s]*(\d+(?:[.,]\d{2})?)\s*(?:Euro|€)/i);
  if (m) return `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()} ${m[2]} €`;
  return undefined;
}

const yamlStr = (s) => JSON.stringify(s);

async function main() {
  // Schutz: nach dem Go-Live liegen die Events als gepflegte Dateien im Repo.
  const existing = (await exists(EVENTS_DIR)) ? (await readdir(EVENTS_DIR)).filter((f) => f.endsWith('.md')) : [];
  if (existing.length && !process.argv.includes('--force')) {
    console.error(
      `Abbruch: src/content/events enthält schon ${existing.length} Events. Der Import würde sie überschreiben.\n` +
        'Nur mit --force erneut ausführen, wenn das wirklich gewollt ist.',
    );
    process.exit(1);
  }
  const posts = await fetchAllPosts();
  await mkdir(EVENTS_DIR, { recursive: true });
  await mkdir(POSTER_DIR, { recursive: true });
  await mkdir(path.join(CACHE, 'img'), { recursive: true });

  const redirects = [];
  const report = [];

  for (const post of posts) {
    const rawTitle = decodeEntities(post.title.rendered).trim();
    const dateMatches = [...rawTitle.matchAll(/(\d{2})\.(\d{2})\.(\d{4})/g)];
    if (!dateMatches.length) {
      report.push(`!! kein Datum im Titel: ${post.slug}`);
      continue;
    }
    const [, dd, mm, yyyy] = dateMatches.at(-1);
    const isoDate = `${yyyy}-${mm}-${dd}`;

    // Titel bereinigen: Datum, "ABGESAGT"/"FÄLLT AUS"-Präfix
    let title = rawTitle
      .replace(/\s*\|?\s*\d{2}\.\d{2}\.\d{4}\s*$/, '')
      .replace(/\s+am$/i, '')
      .trim();
    let status = 'scheduled';
    if (/^(abgesagt|f[aä]llt aus)\s*!?\s*:?\s*/i.test(title)) {
      status = 'cancelled';
      title = title.replace(/^(abgesagt|f[aä]llt aus)\s*!?\s*:?\s*/i, '').trim();
    }
    title = title.replace(/\s*\|\s*$/, '').trim();

    // Slug: alter Slug bleibt, wenn er korrekt mit dem Datum endet — sonst neu erzeugen
    const dateSlug = `${dd}-${mm}-${yyyy}`;
    const slug = post.slug.endsWith(`-${dateSlug}`) ? post.slug : `${slugify(title)}-${dateSlug}`;
    redirects.push([`/${post.slug}/`, `/events/${slug}`]);

    const { lines, ticketUrl } = parseContent(post.content.rendered);
    const doors = parseTime(lines, 'Einlass');
    const start = parseTime(lines, 'Beginn');
    const admission = parseAdmission(lines);

    const titleKey = slugify(title);
    const body = lines
      .map((l) => l.replace(/^Automatic Heading Text/, '').trim())
      .filter((l) => l && !/^(Short headline|Tickets)$/i.test(l))
      .filter((l) => !/^[📍🗓🍻]/u.test(l))
      .filter((l) => !/^Einlass\b.*\|\s*Beginn/i.test(l))
      .filter((l) => !/^\d{2}\.\d{2}\.\d{4}$/.test(l))
      // Eintritt steht schon im Feld `admission`
      .filter((l) => !(admission && /^(Abendkasse|Eintritt)\b/i.test(l) && l.length < 40))
      .filter((l) => slugify(l) !== titleKey)
      .map((l) => l.replace(/^[🎸🎧]\s*/u, ''));
    const uniqueBody = [...new Set(body)];

    // Poster
    const media = post._embedded?.['wp:featuredmedia']?.[0];
    let posterRel;
    if (media?.source_url) {
      const ext = media.source_url.split('.').pop().split('?')[0];
      const cacheImg = path.join(CACHE, 'img', `${post.slug}.${ext}`);
      if (!(await exists(cacheImg))) {
        const res = await fetch(media.source_url);
        if (!res.ok) throw new Error(`Poster-Download fehlgeschlagen: ${media.source_url}`);
        await writeFile(cacheImg, Buffer.from(await res.arrayBuffer()));
      }
      const out = path.join(POSTER_DIR, `${slug}.webp`);
      await sharp(cacheImg)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(out);
      posterRel = `../../assets/events/${slug}.webp`;
    }

    const categories = post.categories.map((id) => CATEGORY_NAMES[id]).filter(Boolean);

    const fm = [
      '---',
      `title: ${yamlStr(title)}`,
      `date: ${isoDate}`,
      doors ? `doors: ${yamlStr(doors)}` : null,
      start ? `start: ${yamlStr(start)}` : null,
      `categories: [${categories.map(yamlStr).join(', ')}]`,
      `status: ${status}`,
      admission ? `admission: ${yamlStr(admission)}` : null,
      ticketUrl ? `ticketUrl: ${yamlStr(ticketUrl)}` : null,
      posterRel ? `poster: ${posterRel}` : null,
      posterRel ? `posterAlt: ${yamlStr(`Plakat: ${title}`)}` : null,
      '---',
      '',
      uniqueBody.join('\n\n'),
      '',
    ]
      .filter((l) => l !== null)
      .join('\n');

    await writeFile(path.join(EVENTS_DIR, `${slug}.md`), fm);
    report.push(
      `${isoDate}  ${status === 'cancelled' ? 'ABGESAGT ' : ''}${title}` +
        `  [${doors ?? '–'}/${start ?? '–'}]${ticketUrl ? ' 🎟' : ''}${admission ? ` (${admission})` : ''}`,
    );
  }

  // Weiterleitungen: alte WP-URLs (mit Schrägstrich) → neue Event-URLs
  const redirectLines = [
    '# Alte WordPress-URLs → neue Struktur (automatisch erzeugt von scripts/import-wordpress.mjs)',
    ...redirects.map(([from, to]) => `${from} ${to} 301`),
    '/category/event /events 301',
    '/category/event/ /events 301',
    '/category/musik /events 301',
    '/category/musik/ /events 301',
    '/datenschutzerklaerung/ /datenschutz 301',
    '/datenschutzerklaerung /datenschutz 301',
    '',
  ];
  await writeFile(path.join(ROOT, 'public/_redirects'), redirectLines.join('\n'));

  console.log(report.sort().join('\n'));
  console.log(`\n${posts.length} Beiträge verarbeitet, ${redirects.length} Weiterleitungen.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
