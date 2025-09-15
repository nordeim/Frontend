// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';

// Vite configuration optimized for React + TypeScript + PWA + path aliases
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'AI Customer Service',
        short_name: 'AI-CS',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        description: 'AI-powered customer service frontend',
      },
    }),
  ],
  server: {
    port: Number(process.env.PORT ?? 5173),
    strictPort: false,
  },
  preview: {
    port: Number(process.env.PORT ?? 5173),
  },
  define: {
    // Expose env flags at build time (Vite already exposes import.meta.env)
    __VITE_API_URL__: JSON.stringify(process.env.VITE_API_URL ?? process.env.VITE_API_URL),
  },
});
