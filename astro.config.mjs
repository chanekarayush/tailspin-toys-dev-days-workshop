// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://chanekarayush.github.io',
  base: process.env.DEPLOY_TO_GITHUB_PAGES === 'true' ? '/tailspin-toys-dev-days-workshop' : '/',

  vite: {
    plugins: [tailwindcss()],
  },

  server: {
    host: '0.0.0.0',
  },
});
