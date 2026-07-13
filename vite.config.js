import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config — static build, deployable to Vercel with no backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
