// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
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

  // 'ignore' mantiene URLs con y sin trailing slash servibles
  // (CloudFront/S3 convention usa trailing slash). Migrar a 'never' en T12
  // cuando arreglemos Cloudflare rewrite rules.
  trailingSlash: 'ignore',

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },
});
