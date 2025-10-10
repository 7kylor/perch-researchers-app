import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath, URL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/renderer/index.html'),
        'pdf-reader': path.resolve(__dirname, 'pdf-reader.html'),
      },
      output: {
        manualChunks: undefined,
      },
    },
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        format: 'es',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
  publicDir: 'public',
});
