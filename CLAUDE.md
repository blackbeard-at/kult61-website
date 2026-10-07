# KULT61-Website — Projektkontext

Astro-Nachbau von https://kult61.de (bisher WordPress/Uncode) für KULT61, einen
unabhängigen Kulturraum in Hanau-Großauheim (ehem. KFZ-Halle: Konzerte, Partys
& DJ-Sets, Kunst, Workshops, Kollektive, Räume mieten). Betreiber laut Impressum:
Kompass Veranstaltungs GmbH & Co. KG, Hainburg. Design 1:1 von der Live-Seite
übernommen (kein Figma), kein CMS.

Der Kernpunkt: **Events werden regelmäßig aktualisiert** — der Kunde schickt sie
gesammelt per Mail, Arif pflegt sie ein. Deshalb sind Events keine Blogposts,
sondern Markdown-Dateien mit festen Feldern (siehe unten).

## Stack
- Astro (statisch, kein SSR), Inter selbst gehostet (`@fontsource/inter`)
- Repo: https://github.com/blackbeard-at/kult61-website (privat, Branch `main`, erster Push
  07.10.2026; HTTPS-Remote wie bei den anderen Projekten, kein `gh` installiert)
- Deployment: Cloudflare Workers (statische Assets, `wrangler.jsonc`), baut
  automatisch bei Push auf `main` (sobald das Cloudflare-Projekt angelegt ist — noch offen)
- `trailingSlash: 'never'` + `build.format: 'file'` wie bei SHAFTCONSULT: Seiten
  liegen unter `/impressum` ohne Schrägstrich am Ende
- Dev-Server: `npm run dev`. In der Claude-Desktop-App startet `kult61-dev`
  (Port 4341) aus der `launch.json` des SHAFTCONSULT-Projekts

## Events pflegen
Eine Datei pro Event: `src/content/events/<slug>.md`, Poster in
`src/assets/events/<slug>.webp`. Dateiname = URL (`/events/<slug>`),
Konvention `<titel-kebab>-<tt-mm-jjjj>`, z. B. `karaoke-night-16-10-2026`.

```yaml
---
title: "KARAOKE Night!"          # ohne Datum im Titel
date: 2026-10-16                  # steuert Reihenfolge + Archiv automatisch
doors: "19:00"                    # optional (Einlass)
start: "20:00"                    # optional (Beginn)
categories: ["Musik", "Event"]    # Musik, Tanz, Comedy, Kultur, Kunst, Event
status: scheduled                 # scheduled | cancelled | postponed
admission: "Abendkasse 18 €"      # optional, Freitext ("Eintritt frei")
ticketUrl: "https://www.eventbrite.…"   # optional, Link zum einzelnen Event
poster: ../../assets/events/karaoke-night-16-10-2026.webp
posterAlt: "Plakat: KARAOKE Night!"
---

Beschreibungstext (Line-up, Hinweise). Einlass/Beginn/Ort stehen schon in den Feldern.
```

- **Archiv ist automatisch**: Events mit `date` vor heute (Europe/Berlin zum
  Build-Zeitpunkt) landen unter `/events/archiv`, kommende unter `/events` und
  auf der Startseite (max. 8). Damit ein Event am Folgetag verschwindet, muss
  die Seite neu gebaut werden (Push oder Rebuild in Cloudflare) — ein nächtlicher
  Rebuild ist noch **nicht** eingerichtet (siehe offene Punkte).
- Absage: `status: cancelled` (Badge „Abgesagt“, Schema.org `EventCancelled`,
  Eintrag bleibt im Kalender-Feed als `STATUS:CANCELLED`). Titel ohne „ABGESAGT:“.
- Posters: Quadrat/Hochformat, WebP, max. 1600 px lange Kante (Astro erzeugt alle
  Größen selbst).
- Zeitzone/Offset in Schema.org und `.ics` wird automatisch korrekt berechnet
  (Sommer-/Winterzeit).

### Einmaliger WordPress-Import
`npm run import:wp` hat die 81 Altposts (Sept. 2025 – Nov. 2026) samt Postern
übernommen und `public/_redirects` erzeugt (alte WP-URLs `/<slug>/` → `/events/<slug>`,
301). Das Skript bricht ab, sobald schon Events existieren (`--force` überschreibt
alles — nach dem Go-Live **nie** benutzen).

## Automatisch erzeugte Dateien (nicht von Hand pflegen)
- `/llms.txt` — Textfassung für KI-Assistenten inkl. Liste der kommenden Events
  (`src/pages/llms.txt.ts`). Feste Texte dort anpassen, aber nur Inhalte, die auch
  auf der Website stehen.
- `/events.ics` — Kalender-Feed zum Abonnieren (`src/pages/events.ics.ts`)
- `/sitemap-index.xml` (`@astrojs/sitemap`), `robots.txt` liegt in `public/`

## SEO & KI-SEO (umgesetzt)
- Eigene `<title>`/Description je Seite, Canonical, Open Graph/Twitter-Cards
  (Event-Plakat als OG-Bild), ein H1 pro Seite
- Schema.org: sitewide `LocalBusiness`+`MusicVenue` und `WebSite`; je Event
  `MusicEvent`/`ComedyEvent`/`DanceEvent`/`Event` (Start, Einlass, Status, Ort,
  Ticket-Offer); `BreadcrumbList`, `FAQPage` (Start + Räumlichkeiten), `Service`
  (Vermietung), `ItemList` (Eventlisten)
- Eigene Landingpage `/raum-mieten` („Eventlocation mieten in Hanau-Großauheim“), Header =
  Foto `KULT61_111125_001` (`src/assets/images/raum-header.jpg`, 2800 px aus dem 7500-px-
  Original auf dem Desktop `Bilder-kult/`) auf **80 % der Bildschirmhöhe** (`.page-hero.photo-hero`
  in `global.css`, nicht weichgezeichnet, Abdunklung 42–60 %). Dasselbe Muster hat `/events`
  (Foto `KULT61_Abendaufnahmen_7RV7407` = `src/assets/images/events-header.jpg`, `shade-light` +
  Abdunklung hinter dem Text). Neuer Foto-Header: Klassen `has-bg photo-hero` + `.hero-bg`-Bild,
  Ausschnitt per `style="--pos-m: …; --pos-d: …"`:
  Kapazität, Nutzungsmöglichkeiten, Service (Theke/Personal, Getränke, Catering),
  Fotogalerie, Lage, Anfrage-Block, FAQ (10 Fragen) + Schema.org `Service`/`FAQPage`.
  Eigene Getränke sind nach Absprache möglich (Kunde, 07.10.2026).
  Die Anfrage-Buttons öffnen eine Mail mit vorbereitetem Text (`MAIL_RAUM` in
  `src/config/site.ts`: Termin, Anlass, Personenzahl, Getränke, Catering — die fünf
  Punkte im Wortlaut von Arif, 07.10.2026; gilt für alle „Termin sichern“/„Anfrage per E-Mail“-Buttons).
- Kapazität steht zentral in `SITE.capacity` (160 stehend, 80–100 mit Tischen und
  Stühlen, Angaben des Kunden vom 07.10.2026) und wird von Seite, FAQ, Schema.org
  (`maximumAttendeeCapacity`) und `llms.txt` gemeinsam genutzt — nur dort ändern.
- FAQ-Texte nutzen **nur belegte Fakten** (Live-Seite, Kundenmail vom 10.04.2025,
  Event-Archiv, Angaben vom 07.10.2026). Keine erfundenen Preise, Öffnungszeiten.
- `robots.txt` erlaubt KI-Crawler ausdrücklich (GPTBot, ClaudeBot, PerplexityBot …)
- **Cloudflare beachten**: Neue Zonen blockieren KI-Crawler teils standardmäßig
  („Block AI bots“ / Managed robots.txt) — nach dem Umzug unter *Security → Bots*
  bzw. *AI Crawl Control* prüfen, sonst läuft das KI-SEO ins Leere.

## Datenschutz & Impressum
- `/datenschutz` ist **neu geschrieben** (nicht mehr der Generator-Text der WP-Seite,
  der Google Analytics, Meta-Pixel, YouTube, Maps usw. nannte, die die Seite gar nicht
  nutzte). Stand der Seite: statisch bei Cloudflare, **keine Cookies, kein Tracking,
  kein Banner**, Schrift lokal, Kontakt per `mailto:`, Tickets nur per externem
  Eventbrite-Link, E-Mail bei STRATO.
- **Ändert sich etwas, muss die Datenschutzerklärung mit**: Analytics, Karten,
  eingebettete Videos, Kontaktformular, Newsletter, Social-Media-Profile/-Links,
  Ticket-Widgets. Dann auch einen Cookie-Banner (Consent) ergänzen.
- Vor Go-Live von einer fachkundigen Stelle (Anwalt/DSB) prüfen lassen.
- Impressum: Komplementär-GmbH, Geschäftsführung, Registergericht und -nummer sind
  als „wird nachgereicht“ markiert — bei einer GmbH & Co. KG Pflichtangaben (§ 5 DDG);
  der alte WP-Impressumstext hatte sie nicht.

## Eigenheiten, die beim Weiterarbeiten wichtig sind
- **Logos als `<img>` einbinden, nicht inline.** Die SVGs aus dem Logo-Paket
  (`05_images/KULT61_Logo-Package_032025/SVG`) nutzen generische `cls-1`/`cls-2`-
  Klassen. Inline würden sich ihre Farben gegenseitig überschreiben. Neue SVGs vor
  dem Inline-Einbinden in feste `fill`-Attribute umwandeln (so wurde `favicon.svg`
  gebaut).
- Farben nach Brand-Guideline: Primär `#E00B16`, Hellgrau `#EBEBEB`; Hintergrund
  `#0F0000`. **Kleiner roter Text nutzt `--red-text` (`#F0333C`)**, weil `#E00B16`
  auf dem dunklen Grund nur 4,1:1 Kontrast erreicht (WCAG AA: 4,5:1).
- Kopfleiste: Hintergrund/Blur liegt im Pseudo-Element `.header-bar::before`.
  `backdrop-filter` direkt auf `.header-bar` macht sie zum Bezugsrahmen für das
  `position: fixed`-Mobilmenü und zerschießt es.
- `[hidden]` ist global `display: none !important` (Archiv-Filter blendet
  `display: grid`-Zeilen aus).
- **Bewegung wie auf der Live-Seite** (`src/scripts/motion.ts` + CSS ganz unten in
  `global.css`, abschaltbar per `prefers-reduced-motion`, ohne JS alles sichtbar):
  Hero-Hintergrund wandert mit 10 % der Scrollstrecke; Collage-Bilder haben
  Rellax-Parallax `translateY = 100 · speed · (0,5 − p)`, `p = (scrollY − top + vh) /
  (höhe + vh)` (`data-rellax-speed`: Über uns 1+3, Programm 1, Mitmachen 1+5 — Werte
  von der Live-Seite gemessen); Galerie-Kacheln fahren 100 px von unten ein
  (`data-reveal="up"`, 0,6 s), Event-Zeilen blenden 1 s ein (`data-reveal="fade"`),
  Hero-Text fährt gestaffelt ein (`.intro`). Parallax nur ab 900 px Breite.
  Hinweis: Im versteckten Vorschau-Tab (`visibilityState: hidden`) pausiert der
  Browser Observer und Animationen — dort bleiben Elemente zunächst unsichtbar.
- **Galerien** (`.gallery`, Startseite + `/raum-mieten`) verhalten sich wie das Owl-Carousel
  der alten Seite: kein Scrollbalken, mit der Maus ziehen (`src/scripts/drag-scroll.ts`,
  Attribut `data-drag-scroll`, Cursor grab/grabbing, kurzer Nachlauf), per Touch/Trackpad
  nativ wischen, per Pfeiltaste blättern (Container ist fokussierbar). Einrasten nur bei
  `pointer: coarse` — mit Maus würde es das Ziehen ruckeln lassen.
- **Bilder nie ohne `height: auto` mit `aspect-ratio` kombinieren**: Astros `<Image>`
  setzt `width`/`height`-Attribute (z. B. 1620×1080), die ein CSS-`aspect-ratio`
  übersteuern und das Bild verzerren. Collage/Galerie werden außerdem als echte
  Zuschnitte (1:1, 3:4) in Retina-Breite erzeugt, nicht per CSS beschnitten.
- Kopfleiste: Textlinks links (KULT61, Über uns, Mitmachen, Kontakt), rechts drei
  gleiche Buttons **Events · Raum mieten · Anfrage** (`NAV_LINKS`/`NAV_BUTTONS` in
  `src/config/site.ts`). Mobil liegen sie im Vollbild-Menü unter den Links.
- Die Seite zum Mieten heißt `Raum mieten` (`ROOMS` in `site.ts`, Datei
  `src/pages/raum-mieten.astro`). Umbenennen: `ROOMS` ändern + Datei umbenennen.
- Alle Texte der Startseite sind 1:1 von der Live-Seite; ergänzt wurden nur
  Event-Kalender-Link statt „(coming soon)“, die FAQ, die Seite `/raum-mieten`.
- **Fotos**: alle 22 Bilder in `src/assets/images/` sind die von Arif gelieferten
  2000×1334-Originale (zugeordnet per Bildvergleich, Stand 07.10.2026). Ersetzen: unter
  gleichem Dateinamen ablegen. Das Hero-Bild ist mobil höhengesteuert und wird breiter
  als der Bildschirm dargestellt — deshalb `sizes="(max-width: 959px) 320vw, 100vw"` und
  Variante bis 2000 px in `index.astro`.
- **Typografie ist auf kult61.de gemessen, nicht geschätzt** (Uncode setzt die
  Größen per JS aus der Breite ohne Scrollbar; `vw` in CSS liegt dadurch bis zu 1 %
  daneben). Basis: Inter, Fließtext **18 px / 1,75**, Ausnahme „Unsere Räumlichkeiten“-Text 15 px.
  Hero-H1 `min(12vw,165px)`/900, Hero-Untertitel `clamp(20px,2vw,35px)`/Zeilenhöhe 0,85,
  Haupttitel „KULT61“ 35/50/75 px (<570/<960/≥960), „Wofür steht…/Was geht…/Werde…“
  33,3 px → 50 px ab 960 px mit Laufweite −0,02 em, „Unsere Räumlichkeiten/Aktuelle
  Events“ `clamp(40px,4vw,60px)`, Angebots-Titel 29 px, Buttons 14 px/600/Padding 14×23
  (Kopfleiste Zeilenhöhe 14 px → 44 px hoch; „Entdecken“ 11 px; mobil < 570 px `zoom: .8`),
  Ticket-Leiste 11 px → 13 px ab 960 px, Nav-Links 14 px/800/0,25 em, Event-Zeilen 14 px/800.
  Gutter überall 36 px. Beim Ändern erst auf der Live-Seite nachmessen.
- **Mobiles Menü** (< 1200 px) wie live: Hintergrund `#141618`, Links `5,5vw`
  (20,6 px bei 375) mit 0,25 em Laufweite, kleine 12-px-Buttons (Events · Raum mieten · Anfrage),
  darunter „Let's talk“ + E-Mail. Logo mobil 98×80 px (wie Desktop), Burger-Klickfläche 92×134 px.
- **Event-Zeilen** wie live: ab 960 px Tabelle (Bild 10 %, Titel, Kategorien, „Mehr erfahren“),
  darunter gestapelt (Quadrat-Bild in voller Breite, dann Titel/Kategorien/Link, Zeile ≈ 488 px hoch).
- **Hero**: Scroll-Pfeil 77 px im Textfluss; rote Hervorhebung der Wörter ohne Innenabstand
  (Box = Wortbreite, „61“ mit 0,31 em Vorlauf, Wörter überlappen −0,15 em); Einblendung:
  erst Text, dann zieht die rote Box auf (bei live erst nach ca. 2 s, hier bewusst schneller).
- **Favicon** = das gestapelte Voll-Logo wie auf kult61.de (`public/favicon.svg` passt sich
  Hell-/Dunkelmodus an, PNG/ICO transparent mit dunklem Logo; Apple-/Android-Icons helles Logo
  auf `#0F0000`). Nicht wieder auf das reine Symbol umstellen.

## Domain / Mail beim Umzug von STRATO zu Cloudflare (noch offen)
Stand der Analyse am 07.10.2026: `kult61.de` liegt komplett bei STRATO (NS
`shades18/docks02.rzone.de`, A `81.169.145.92`), Mail ebenfalls dort.
Öffentliche DNS-Einträge: MX `5 smtpin.rzone.de`, CNAME `autoconfig` →
`autoconfigure.strato.de`, TXT `google-site-verification=…` (Search Console),
DMARC `v=DMARC1;p=reject;`. SPF/DKIM sind öffentlich **nicht** sichtbar.
Aus den Erfahrungen mit shaftconsult.de (siehe dort): beim Wechsel der
Nameserver gehen Strato-eigene Einträge verloren und Mails von `info@` werden
wegen `p=reject` abgelehnt. Deshalb vorher:
1. Alle Einträge aus der STRATO-DNS-Verwaltung 1:1 nach Cloudflare übernehmen
   (MX, autoconfig, TXT, DMARC, ggf. SRV).
2. SPF `v=spf1 redirect=smtp.rzone.de` und DKIM-CNAMEs
   (`strato-dkim-0002/0003._domainkey` → `…_domainkey.rzone.de`, DNS only)
   anlegen, DMARC bis zum bestandenen Test auf `p=none`.
3. Testmail von `info@` an Gmail: SPF/DKIM/DMARC müssen PASS zeigen.
4. www → Root per Redirect Rule (301), „Always Use HTTPS“.
5. Der alte WordPress-Webspace läuft bis zur Umstellung weiter; danach nichts
   überstürzt löschen.

## Offene Punkte (mit dem Kunden klären)
- **Skill `/neue-events`**, der gesammelte Event-Mails des Kunden (`.eml` in `inbox/`) in
  Event-Dateien verwandelt (Vorschau-Tabelle → Bestätigung → Commit/Push). Noch nicht
  gebaut. Die **Mailvorlage** für den Kunden steht in `docs/mailvorlage-events.md` (Teil 1 =
  Text für den Kunden, Teil 2 = Feldzuordnung, die der Skill umsetzen muss). Sie ist noch
  nicht an den Kunden geschickt.
- **Nächtlicher Rebuild**, damit vergangene Events ohne Zutun ins Archiv wandern
  (GitHub-Action-Cron oder Cloudflare-Hook).
- **Impressum**: Komplementär, Geschäftsführung, Registergericht/-nummer nachtragen.
- **Instagram**: In der Kundenmail vom 10.04.2025 steht `@kult_61`; auf der Live-Seite
  ist nichts verlinkt. Wenn verlinkt werden soll: `SITE.instagramUrl` setzen
  (erscheint dann als `sameAs`), Footer-Link ergänzen **und** Social-Media-Absatz in
  der Datenschutzerklärung aufnehmen.
- **Arif liefert nach (Erinnerung Mo 12.10.2026 geplant)**: Mindestdauer der
  Anmietung, Öffnungszeiten, Catering-Partner. Dann FAQ (`raum-mieten.astro`),
  „Auf einen Blick“, Schema.org und `llms.txt` ergänzen.
- **Preise und Konditionen der Vermietung dürfen NOCH NICHT auf die Website** —
  erst nach ausdrücklicher Freigabe durch Arif/Kunde. Bis dahin nirgends
  (Seite, FAQ, Schema.org, `llms.txt`) nennen.
- Weitere fehlende Fakten für mehr SEO-Substanz: Telefonnummer, Koordinaten,
  Barrierefreiheit, Presse-/Referenzfotos.
- **Google Business Profile** (lokale Suche, Karte) für „Hanauer Landstraße 61“
  anlegen/prüfen; Search Console für die neue Domain-Property verifizieren.
- Rechtliche Prüfung der Datenschutzerklärung (siehe oben).
