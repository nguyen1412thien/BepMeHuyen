import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Cho phép truy cập mạng cục bộ
    proxy: {
      // Tự động chuyển tiếp mọi request /api sang Backend (không cần build)
      '/api': {
        target: 'http://localhost:5500',
        changeOrigin: true
      }
    }
  }
});
