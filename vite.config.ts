import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/renderer', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist/renderer',
    sourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
});
