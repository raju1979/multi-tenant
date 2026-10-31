import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // Points to the live VPS backend by default, or localhost if VITE_BACKEND_URL is set
        target: process.env.VITE_BACKEND_URL || 'http://65.75.203.202:5001',
        changeOrigin: true
      }
    }
  }
});
