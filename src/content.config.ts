import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Eine Markdown-Datei pro Event unter src/content/events/<slug>.md.
// Dateiname = URL: /events/<slug>. Konvention: <titel>-<tt-mm-jjjj>.md
const time = z.string().regex(/^\d{2}:\d{2}$/, 'Uhrzeit als HH:MM, z. B. "20:00"');

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Tag der Veranstaltung (YYYY-MM-DD). Danach richtet sich automatisch das Archiv.
      date: z.coerce.date(),
      doors: time.optional(), // Einlass
      start: time.optional(), // Beginn
      categories: z.array(z.string()).default([]),
      status: z.enum(['scheduled', 'cancelled', 'postponed']).default('scheduled'),
      admission: z.string().optional(), // z. B. "Abendkasse 18 €" oder "Eintritt frei"
      ticketUrl: z.string().url().optional(), // Eventbrite-Link zum Event
      poster: image().optional(),
      posterAlt: z.string().optional(),
    }),
});

export const collections = { events };
