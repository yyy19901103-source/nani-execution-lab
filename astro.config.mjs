// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://yyy19901103-source.github.io',
  base: '/nani-execution-lab',
  vite: {
    plugins: [tailwindcss()]
  }
});