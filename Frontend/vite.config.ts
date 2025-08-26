import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          // Add any babel plugins if needed
        ],
      },
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
    hmr: {
      overlay: false, // Disable error overlay for better UX
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Enhanced manual chunks for better code splitting
        manualChunks: (id) => {
          // Vendor libraries
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // UI libraries
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            // Router
            if (id.includes('react-router')) {
              return 'router';
            }
            // Form libraries
            if (id.includes('zod') || id.includes('sonner')) {
              return 'form-vendor';
            }
            // Utilities
            if (id.includes('clsx') || id.includes('class-variance-authority')) {
              return 'utils-vendor';
            }
            // Other vendor code
            return 'vendor';
          }
          
          // Application code chunks
          if (id.includes('/src/modules/admin')) {
            return 'admin-module';
          }
          if (id.includes('/src/modules/buyer')) {
            return 'buyer-module';
          }
          if (id.includes('/src/modules/vendor')) {
            return 'vendor-module';
          }
          if (id.includes('/src/components/ui')) {
            return 'ui-components';
          }
          if (id.includes('/src/hooks')) {
            return 'hooks';
          }
          if (id.includes('/src/lib')) {
            return 'lib';
          }
        },
        // Optimize chunk naming
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entry/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  // Optimization for development
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'react-router-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      'lucide-react',
      'clsx',
      'sonner',
    ],
    exclude: [
      // Exclude packages that don't need optimization
    ],
  },
});
