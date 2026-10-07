// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://kult61.de',
  // Unterseiten als impressum.html statt impressum/index.html bauen:
  // Cloudflare liefert sie dann direkt unter /impressum aus (ohne
  // Weiterleitung auf /impressum/) — passend zu Links und sitemap.xml.
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [sitemap()],
});
