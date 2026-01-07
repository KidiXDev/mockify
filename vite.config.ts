import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import manifest from './manifest';

export default defineConfig({
  plugins: [react(), crx({ manifest }), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    cors: {
      origin: [/chrome-extension:\/\//]
    }
  },
  build: {
    rollupOptions: {
      input: {
        popup: 'index.html',
        options: 'options.html'
      }
    }
  }
});
