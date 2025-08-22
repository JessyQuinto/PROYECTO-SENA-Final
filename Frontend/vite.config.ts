import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          pdf: ['jspdf', 'html2canvas'],
          radix: ['@radix-ui/react-slot', '@radix-ui/react-dialog', '@radix-ui/react-label', '@radix-ui/react-checkbox'],
          utils: ['class-variance-authority', 'clsx', 'tailwind-merge', 'zod'],
          ui: ['sonner', 'lucide-react'],
        },
      },
    },
    target: 'es2020',
    minify: 'esbuild',
    assetsDir: 'assets',
    modulePreload: {
      polyfill: false
    },
    // Optimizaciones para Azure Static Web Apps
    sourcemap: false,
    reportCompressedSize: false,
    cssCodeSplit: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
  },
  esbuild: {
    target: 'es2020',
  },
  base: './',
});
