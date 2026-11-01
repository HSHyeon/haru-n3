import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// @ts-ignore Build helper runs in Node and has no client-side imports.
import { buildPwa } from './scripts/pwa-build.mjs';
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'haru-offline-build',
      apply: 'build',
      writeBundle(options) {
        buildPwa(options.dir || 'dist');
      },
    },
  ],
});
