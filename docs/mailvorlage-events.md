# Mailvorlage: neue Events für kult61.de

So läuft es:

1. Der Kunde bekommt **Teil 1** einmal zugeschickt und speichert ihn als Entwurf/Textbaustein.
2. Wenn neue Events in Eventbrite stehen, füllt er pro Event einen Block aus, hängt die Plakate an
   und schickt alles **gesammelt in einer Mail** an Arif.
3. Arif legt die Mail als `.eml` in `inbox/` und startet `/neue-events` (Skill noch nicht gebaut).
   Teil 2 beschreibt, wie der Skill die Felder liest — Vorlage und Skill müssen zusammenpassen.

---

## Teil 1 — Text für den Kunden (zum Kopieren)

**Betreff:** Neue Events für die Website

```
Hallo Arif,

hier sind die neuen Events für die Website.

────────────────────────────
EVENT 1

Titel:
Datum:
Einlass:
Beginn:
Eintritt:
Eventbrite-Link:
Infos zum Abend:
Plakat: im Anhang

────────────────────────────
EVENT 2

Titel:
Datum:
Einlass:
Beginn:
Eintritt:
Eventbrite-Link:
Infos zum Abend:
Plakat: im Anhang

(weitere Events einfach nach dem gleichen Muster darunter)

────────────────────────────
ABSAGEN ODER ÄNDERUNGEN (nur falls etwas dabei ist)

Event (Titel und Datum):
Was ist neu: (z. B. fällt aus / verschoben auf 23.10. / neue Uhrzeit 21:00)

────────────────────────────

Viele Grüße
```

**Zum Ausfüllen — kurz erklärt (kann unter die Vorlage in die Mail):**

- **Titel:** so, wie er auf dem Plakat steht.
- **Datum:** z. B. 16.10.2026.
- **Einlass / Beginn:** z. B. 19:00 und 20:00. Ist nur eine Uhrzeit bekannt, bitte bei *Beginn* eintragen.
  Unbekannte Felder einfach leer lassen.
- **Eintritt:** z. B. „Eintritt frei“ oder „Abendkasse 18 €“. Der Vorverkaufspreis steht bei Eventbrite
  und muss nicht noch einmal genannt werden.
- **Eventbrite-Link:** der Link zu genau diesem einen Event (nicht zur Übersicht).
- **Infos zum Abend:** wer spielt/auflegt, Besonderheiten, 1 bis 5 Sätze.
- **Plakat:** pro Event ein Bild (JPG oder PNG) an die Mail hängen. Der Dateiname ist egal.

**Beispiel für einen ausgefüllten Block (erfunden, nur zur Veranschaulichung):**

```
EVENT 1

Titel: Musterband live
Datum: 20.11.2026
Einlass: 19:00
Beginn: 20:00
Eintritt: Abendkasse 15 €
Eventbrite-Link: https://www.eventbrite.de/e/…
Infos zum Abend: Die Musterband spielt Rock und Blues. Danach legt DJ Beispiel auf.
Plakat: im Anhang
```

---

## Teil 2 — So liest `/neue-events` die Mail

Pflicht sind **Titel** und **Datum**; alles andere ist optional. Der Skill muss auch mit freier
Formulierung zurechtkommen (der Kunde hält sich nicht immer an die Vorlage) und fragt nach, wenn
Titel oder Datum fehlen oder nicht eindeutig sind.

| Feld in der Mail | Feld in der Event-Datei | Hinweise |
|---|---|---|
| Titel | `title` | ohne Datum, ohne „ABGESAGT:“ (das wird `status`) |
| Datum | `date` | als `JJJJ-MM-TT` |
| Einlass | `doors` | `"HH:MM"` |
| Beginn | `start` | `"HH:MM"` |
| Eintritt | `admission` | Freitext |
| Eventbrite-Link | `ticketUrl` | Tracking-Parameter (`?aff=…`) entfernen |
| Infos zum Abend | Text unter dem Frontmatter | Einlass/Beginn/Ort nicht doppelt nennen |
| Plakat (Anhang) | `poster`, `posterAlt` | WebP, max. 1600 px lange Kante, `posterAlt: "Plakat: <Titel>"` |
| — (nicht abgefragt) | `categories` | der Skill leitet sie aus Titel und Infos ab (Musik, Tanz, Comedy, Kultur, Kunst, Event) und zeigt sie in der Vorschau zur Korrektur |
| — | `status` | `scheduled`, außer bei Absage/Verschiebung |

Weitere Regeln:

- **Dateiname/URL:** `<titel-kebab>-<tt-mm-jjjj>`, z. B. `karaoke-night-16-10-2026`.
- **Plakate zuordnen:** Dateinamen der Anhänge sind unzuverlässig. Der Skill liest Titel und Datum
  vom Plakat selbst und ordnet sie dem passenden Event zu; bei Zweifel fragt er.
- **Gibt es das Event schon?** (gleiches Datum und ähnlicher Titel) → als Änderung vorschlagen,
  nicht doppelt anlegen.
- **Absage:** `status: cancelled` (Titel ohne „ABGESAGT:“). **Verschiebung:** neues `date`, bei
  Bedarf `status: postponed` mit Hinweis im Text. Der Eintrag bleibt auf der Seite und im Kalender-Feed.
- **Vorschau vor dem Schreiben:** Tabelle mit Titel, Datum, Uhrzeiten, Eintritt, Kategorien, Link,
  Plakat → erst nach Bestätigung Dateien anlegen, Build prüfen, committen und pushen.
- `inbox/` ist in `.gitignore` — Kundenmails kommen nie ins Repository.
