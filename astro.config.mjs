// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://yyy19901103-source.github.io',
  base: '/nani-execution-lab',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()]
  }
});