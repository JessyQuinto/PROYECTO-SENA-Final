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
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          pdf: ['jspdf', 'html2canvas'],
          radix: ['@radix-ui/react-slot', '@radix-ui/react-dialog', '@radix-ui/react-label', '@radix-ui/react-checkbox'],
          shadcn_misc: ['class-variance-authority', 'clsx', 'tailwind-merge', 'sonner', 'lucide-react', 'zod'],
        },
      },
    },
    target: 'es2020',
    minify: 'esbuild',
    assetsDir: 'assets',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
  },
  esbuild: {
    target: 'es2020',
  },
  base: './',
});
