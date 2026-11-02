import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Update `site` once the Netlify URL or custom domain is final.
export default defineConfig({
  site: 'https://glenhutajulu.netlify.app',
  integrations: [react()],
});
