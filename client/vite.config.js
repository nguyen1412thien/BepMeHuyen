import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../server/public'),
    emptyOutDir: true
  },
  server: {
    port: 3000,
    host: true // Cho phép truy cập mạng cục bộ
  }
});
