// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://opitacode.com',

  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: true,
    },
  },

  // T1 follow-up: 'ignore' mantiene URLs con y sin trailing slash servibles
  // (CloudFront/S3 convention usa trailing slash). Migrar a 'never' en T12
  // cuando arreglemos Cloudflare rewrite rules.
  trailingSlash: 'ignore',

  integrations: [
    react(),
    sitemap({
      lastmod: new Date('2026-07-01'),
      i18n: {
        defaultLocale: 'es',
        locales: {
          es: 'es',
          en: 'en',
        },
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
