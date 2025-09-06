import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh optimizations
      fastRefresh: true,
      // Exclude node_modules from JSX runtime transformations
      exclude: /node_modules/,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/auth': path.resolve(__dirname, './src/auth'),
      '@/modules': path.resolve(__dirname, './src/modules'),
      '@/pages': path.resolve(__dirname, './src/pages'),
    },
  },
  server: {
    port: 3000,
    open: true,
    // Enable HTTP/2 for better performance in development
    https: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    target: 'es2020',
    minify: 'terser',
    cssCodeSplit: true,
    // Optimize bundle size
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log'],
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        // Enhanced manual chunks for better code splitting
        manualChunks: {
          // Core vendor libraries
          vendor: ['react', 'react-dom'],
          
          // Router and navigation
          router: ['react-router-dom'],
          
          // Supabase and API layer
          supabase: ['@supabase/supabase-js'],
          
          // UI Framework - RadixUI components
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],
          
          // Utility libraries
          utils: ['clsx', 'class-variance-authority', 'tailwind-merge', 'zod'],
          
          // Heavy libraries for PDF generation
          pdf: ['html2canvas', 'jspdf'],
          
          // Icons library
          icons: ['lucide-react'],
          
          // Toast notifications
          toast: ['sonner'],
          
          // Performance monitoring
          monitoring: ['web-vitals'],
        },
        
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.(js|ts|tsx)$/, '') || 'chunk'
            : 'chunk';
          return `js/[name]-[hash].js`;
        },
        
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.css$/.test(name ?? '')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
      
      // External dependencies to exclude from bundle
      external: (id) => {
        // Keep all dependencies bundled for Azure Static Web Apps compatibility
        return false;
      },
    },
  },
  
  // CSS optimization
  css: {
    devSourcemap: false,
    postcss: {},
  },
  
  // Preview server optimization for production testing
  preview: {
    port: 4173,
    strictPort: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'clsx',
      'tailwind-merge',
    ],
    exclude: [
      // Exclude heavy libraries from optimization to speed up dev server
      'html2canvas',
      'jspdf',
    ],
  },
  
  // Enhanced esbuild configuration
  esbuild: {
    drop: import.meta.env.PROD ? ['console', 'debugger'] : [],
    legalComments: 'none',
  },
});