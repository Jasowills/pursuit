import { defineConfig } from 'vite';
export default defineConfig({
  worker: { format: 'es' },
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { host: '127.0.0.1', port: 1420, strictPort: true },
  clearScreen: false,
});
