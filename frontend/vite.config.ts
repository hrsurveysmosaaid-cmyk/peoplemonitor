import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to all addresses (IPv4/IPv6) to avoid localhost (::1) vs 127.0.0.1 mismatch
    host: true,
    port: 5173,
    proxy: {
      // Proxy all /api/* requests to the backend server
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy uploads (static files served by backend)
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
