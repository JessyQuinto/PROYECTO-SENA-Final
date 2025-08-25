import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh optimizations
      fastRefresh: true,
      // Exclude node_modules from JSX runtime transformations
      exclude: /node_modules/
    }),
    
    // PWA with advanced caching strategies
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,avif}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        name: 'Tesoros Chocó',
        short_name: 'Tesoros Chocó',
        description: 'Marketplace de artesanías del Chocó',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/'
      }
    })
  ].filter(Boolean),
  
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
      overlay: false
    }
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production for smaller bundle
    target: 'es2020',
    minify: 'terser',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    
    // Advanced terser configuration
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.warn'],
        passes: 2
      },
      mangle: {
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false
      }
    },
    
    rollupOptions: {
      output: {
        // Enhanced manual chunks for optimal code splitting
        manualChunks: {
          // Core vendor libraries
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          
          // Supabase and API layer
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // UI Framework components
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-slot'
          ],
          
          // Utility libraries
          'utils-vendor': ['clsx', 'class-variance-authority', 'tailwind-merge', 'zod'],
          
          // Icons and visual libraries
          'icons-vendor': ['lucide-react'],
          
          // Performance and monitoring
          'performance-vendor': ['web-vitals'],
          
          // Heavy libraries
          'pdf-vendor': ['html2canvas', 'jspdf'],
          
          // Toast notifications
          'toast-vendor': ['sonner'],
          
          // Feature-based chunks
          'admin-features': [
            './src/modules/admin/AdminDashboard',
            './src/modules/admin/UsersAdmin',
            './src/modules/admin/MetricsAdmin'
          ],
          'buyer-features': [
            './src/modules/buyer/ProductCatalog',
            './src/modules/buyer/CartPage',
            './src/modules/buyer/CheckoutPage'
          ]
        },
        
        // Optimize chunk naming for better caching
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg|webp|avif)$/.test(name ?? '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.css$/.test(name ?? '')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  
  // CSS optimization
  css: {
    devSourcemap: false,
    postcss: {}
  },
  
  // Preview server optimization
  preview: {
    port: 4173,
    strictPort: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
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
      'web-vitals'
    ],
    exclude: [
      'html2canvas',
      'jspdf'
    ]
  },
  
  // Enhanced esbuild configuration
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none'
  }
});
