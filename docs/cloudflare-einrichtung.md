# Cloudflare einrichten: kult61.de

Zwei Teile. **Teil 1** geht sofort und braucht keine Domain. **Teil 2** ist die DNS-Umstellung
von STRATO zu Cloudflare — erst nach der Kundenfreigabe.

Die Bezeichnungen im Dashboard ändern sich gelegentlich; sinngemäß findet man alles.

## Was schon geprüft ist (07.10.2026)

- Ein frischer Clone von GitHub baut mit `npm ci && npm run build` in ~12 s alle 88 Seiten
  (so baut Cloudflare). Node 22 ist über `.nvmrc` festgelegt, `wrangler.jsonc` stimmt
  (Name `kult61-website`, Assets aus `./dist`, `404-page`).
- In der lokalen Workers-Laufzeit (`wrangler dev`) getestet und in Ordnung:
  - Seiten liefern 200, `/impressum/` → `/impressum` (Schrägstrich wird entfernt)
  - alte WordPress-URLs → 301 auf `/events/<slug>` (mit **und** ohne Schrägstrich, 168 Regeln),
    `/category/*` → `/events`, `/datenschutzerklaerung` → `/datenschutz`
  - `llms.txt`, `events.ics`, `robots.txt`, Sitemap, Favicons mit richtigem Content-Type (UTF-8)
  - echte 404-Seite mit Status 404
  - Sicherheits-Header und Cache (`/_astro/*` ein Jahr, `immutable`)
- **Nicht** geprüft, weil es nur bei Cloudflare selbst geht: Blockieren von KI-Crawlern auf
  Zonen-Ebene, Zertifikat/HTTPS der echten Domain.

---

## Teil 1 — Worker mit GitHub verbinden (jetzt)

Konto: **„Mail@ariftuerkmen.de's Account“** (nicht das SHAFT-Konto) — dort liegt auch die
GitHub-App „Cloudflare Workers and Pages“ für `blackbeard-at`, und dort soll später die Zone
`kult61.de` liegen.

1. [dash.cloudflare.com](https://dash.cloudflare.com) → Konto wählen → **Workers & Pages** →
   **Create application** → **Import a repository** (mit Git verbinden).
2. GitHub-Konto `blackbeard-at`, Repository **`kult61-website`** wählen. Steht es nicht in der
   Liste: GitHub → Settings → Applications → *Cloudflare Workers and Pages* → Configure →
   Repository access → `kult61-website` hinzufügen (weiter bei *Only select repositories* bleiben).
3. Felder:

   | Feld | Wert |
   |---|---|
   | Project name | `kult61-website` (muss dem `name` in `wrangler.jsonc` entsprechen) |
   | Production branch | `main` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | leer lassen |
   | Variablen | keine nötig (Node kommt aus `.nvmrc`) |

4. **Save and Deploy.** Der erste Build dauert ca. 1–2 Minuten. Danach ist die Seite unter
   `https://kult61-website.<dein-subdomain>.workers.dev` erreichbar.
5. Prüfen (Test-URL im Browser):
   - Startseite, `/raum-mieten`, `/events`, ein Event, z. B. `/events/karaoke-night-16-10-2026`
   - alte URL, z. B. `/karaoke-night-16-10-2026/` → landet auf `/events/karaoke-night-16-10-2026`
   - eine falsche URL → 404-Seite
   - `/llms.txt`, `/events.ics`, `/sitemap-index.xml`
6. Die Test-URL kann an den Kunden zur Freigabe gehen. Die Seite verweist per Canonical auf
   `https://kult61.de`; die workers.dev-Adresse ist nirgends verlinkt.

Ab jetzt baut und veröffentlicht jeder Push auf `main` automatisch.

---

## Teil 2 — Go-Live nach Kundenfreigabe (STRATO → Cloudflare)

Hintergrund und Einträge stehen auch in `CLAUDE.md` („Domain / Mail beim Umzug“). Die Domain
liegt komplett bei STRATO (NS `shades18.rzone.de`, `docks02.rzone.de`; A `81.169.145.92`), die
Mail ebenfalls — **die Mail muss durchgehend funktionieren**.

**Vorbereitung**
- Aus der STRATO-DNS-Verwaltung alle Einträge notieren (Screenshot) und die alten
  Nameserver aufschreiben, damit man zurückschalten kann.
- Kunden vorwarnen: Für kurze Zeit können Mails verzögert ankommen (Absender wiederholen).
- Ruhige Zeit wählen (z. B. abends, nicht vor einem Event-Wochenende).

**Ablauf**
1. Cloudflare → **Add a domain** → `kult61.de` → Free-Plan. Cloudflare liest die vorhandenen
   Einträge ein; mit den notierten STRATO-Einträgen vergleichen.
2. Mail-Einträge **vor** dem Nameserver-Wechsel anlegen, alle **DNS only** (graue Wolke):
   - `MX` `@` → `smtpin.rzone.de`, Priorität 5
   - `CNAME` `autoconfig` → `autoconfigure.strato.de`
   - `TXT` `google-site-verification=…` (Search Console) — übernehmen
   - `TXT` `@`: `v=spf1 redirect=smtp.rzone.de`
   - `CNAME` `strato-dkim-0002._domainkey` → `strato-dkim-0002._domainkey.rzone.de` und
     `strato-dkim-0003._domainkey` → `strato-dkim-0003._domainkey.rzone.de`
   - `TXT` `_dmarc`: zunächst `v=DMARC1; p=none;` (erst nach bestandener Testmail strenger)
   - Den alten `A`-Eintrag (`81.169.145.92`) und ein altes `www` **nicht** übernehmen: die Seite
     hängt später am Worker.
3. Bei STRATO die Nameserver auf die zwei von Cloudflare genannten ändern. STRATO leert seine
   eigene Zone sofort; bis die Umstellung überall angekommen ist, kann es kurz eine Lücke bei
   der Mail geben (bei checkdomain waren es ~13 Minuten).
4. Warten, bis die Domain in Cloudflare **Active** ist.
5. Worker `kult61-website` → **Settings → Domains & Routes → Add → Custom domain**:
   `kult61.de` und `www.kult61.de`.
6. `www` → Root: **Rules → Redirect Rules**, `www.kult61.de/*` → `https://kult61.de/${1}`, 301.
   **SSL/TLS → Edge Certificates: Always Use HTTPS** an.
7. **Testmail** von `info@kult61.de` an ein Gmail-Konto: in Gmail „Original anzeigen“ — SPF,
   DKIM und DMARC müssen **PASS** zeigen. Auch eine Mail an `info@` senden und empfangen.
   Erst dann DMARC wieder auf `p=reject` (so war es bei STRATO).
8. **KI-Crawler:** *Security → Bots* bzw. *AI Crawl Control* prüfen — „Block AI bots“ und die
   von Cloudflare verwaltete `robots.txt` dürfen die KI-Suche nicht aussperren (unsere
   `robots.txt` erlaubt sie ausdrücklich).

**Danach**
- Search Console: Property für `https://kult61.de` prüfen, Sitemap
  `https://kult61.de/sitemap-index.xml` einreichen; Google Business Profile prüfen.
- Alte WordPress-Seite bei STRATO noch nicht löschen (erst nach einigen Wochen, wenn alles
  läuft und ein Backup gezogen ist).
- Optional: die workers.dev-Adresse unter *Domains & Routes* abschalten.

**Zurück, falls etwas schiefgeht:** Nameserver bei STRATO wieder auf die alten setzen.

---

## Noch offen (nicht Teil der Einrichtung)

- **Nächtlicher Rebuild**, damit vergangene Events ohne Zutun ins Archiv wandern. Workers Builds
  hat keinen Zeitplan; Weg: GitHub-Action mit Cron, die baut und per `wrangler deploy`
  veröffentlicht (braucht einen Cloudflare-API-Token und die Konto-ID als GitHub-Secrets).
- Impressum-Pflichtangaben und Datenschutz-Prüfung vor dem Go-Live (siehe `CLAUDE.md`).
