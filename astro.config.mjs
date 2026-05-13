// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://yyy19901103-source.github.io',
  base: '/nani-execution-lab',
  integrations: [sitemap(), react()],
  vite: {
    plugins: [tailwindcss()]
  }
});