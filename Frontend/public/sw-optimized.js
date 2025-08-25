// Enhanced Service Worker for Tesoros Chocó
// File: Frontend/public/sw-optimized.js

const CACHE_NAME = 'tesoros-choco-v1.2';
const OFFLINE_CACHE = 'tesoros-choco-offline-v1';
const RUNTIME_CACHE = 'tesoros-choco-runtime-v1';

// Cache strategies
const CACHE_STRATEGIES = {
  STATIC_ASSETS: 'cache-first',
  API_DATA: 'network-first',
  IMAGES: 'cache-first',
  HTML: 'network-first',
};

// URLs to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add critical CSS and JS files
  // These will be populated by the build process
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/categories',
  '/api/products',
];

// Maximum cache sizes
const MAX_CACHE_SIZE = {
  images: 50, // Maximum number of images to cache
  api: 100,   // Maximum number of API responses to cache
  pages: 20,  // Maximum number of pages to cache
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Initialize other caches
      caches.open(OFFLINE_CACHE),
      caches.open(RUNTIME_CACHE),
    ]).then(() => {
      console.log('[SW] Service worker installed');
      // Force activation of new service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== OFFLINE_CACHE && 
                cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim(),
    ]).then(() => {
      console.log('[SW] Service worker activated');
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except for images)
  if (url.origin !== location.origin && !isImageRequest(request)) {
    return;
  }

  // Route to appropriate caching strategy
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
  } else if (isImageRequest(request)) {
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE, true));
  } else if (isApiRequest(request)) {
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
  } else if (isNavigationRequest(request)) {
    event.respondWith(networkFirstStrategy(request, OFFLINE_CACHE, '/index.html'));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'cart-sync') {
    event.waitUntil(syncCart());
  } else if (event.tag === 'favorites-sync') {
    event.waitUntil(syncFavorites());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'general',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If not, open new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Helper functions

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|woff2?|ttf|eot|ico|svg)$/);
}

function isImageRequest(request) {
  return request.destination === 'image' || 
         request.url.match(/\.(jpg|jpeg|png|gif|webp|avif)$/);
}

function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('supabase.co');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Cache-first strategy (for static assets and images)
async function cacheFirstStrategy(request, cacheName, isImage = false) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update cache in background for images
      if (isImage) {
        fetch(request).then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
        }).catch(() => {
          // Ignore fetch errors for background updates
        });
      }
      return cachedResponse;
    }

    // Not in cache, fetch from network
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone response before caching
      const responseClone = response.clone();
      
      // Implement cache size limits for images
      if (isImage) {
        await limitCacheSize(cache, MAX_CACHE_SIZE.images);
      }
      
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Cache-first strategy failed:', error);
    
    // Return offline fallback for images
    if (isImage) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="#f0f0f0"/><text x="100" y="75" text-anchor="middle" fill="#999">Image unavailable</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// Network-first strategy (for API calls and navigation)
async function networkFirstStrategy(request, cacheName, fallbackUrl = null) {
  try {
    const cache = await caches.open(cacheName);
    
    try {
      // Try network first
      const response = await fetch(request);
      
      if (response.ok) {
        // Cache successful responses
        const responseClone = response.clone();
        await limitCacheSize(cache, MAX_CACHE_SIZE.api);
        cache.put(request, responseClone);
      }
      
      return response;
    } catch (networkError) {
      console.log('[SW] Network failed, trying cache:', networkError);
      
      // Network failed, try cache
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If cache miss and fallback URL provided
      if (fallbackUrl) {
        const fallbackResponse = await cache.match(fallbackUrl);
        if (fallbackResponse) {
          return fallbackResponse;
        }
      }
      
      throw networkError;
    }
  } catch (error) {
    console.error('[SW] Network-first strategy failed:', error);
    
    // Return offline page for navigation requests
    if (isNavigationRequest(request)) {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Sin conexión - Tesoros del Chocó</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; }
            .offline { color: #666; max-width: 400px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="offline">
            <h1>Sin conexión a internet</h1>
            <p>Por favor, verifica tu conexión y vuelve a intentar.</p>
            <button onclick="window.location.reload()">Reintentar</button>
          </div>
        </body>
        </html>`,
        { 
          headers: { 'Content-Type': 'text/html' },
          status: 200 
        }
      );
    }
    
    throw error;
  }
}

// Limit cache size to prevent storage overflow
async function limitCacheSize(cache, maxSize) {
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Remove oldest entries
    const entriesToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(
      entriesToDelete.map(key => cache.delete(key))
    );
  }
}

// Background sync functions
async function syncCart() {
  try {
    const cartData = await getStoredData('pendingCart');
    if (cartData) {
      await syncDataToServer('/api/cart/sync', cartData);
      await removeStoredData('pendingCart');
    }
  } catch (error) {
    console.error('[SW] Cart sync failed:', error);
  }
}

async function syncFavorites() {
  try {
    const favoritesData = await getStoredData('pendingFavorites');
    if (favoritesData) {
      await syncDataToServer('/api/favorites/sync', favoritesData);
      await removeStoredData('pendingFavorites');
    }
  } catch (error) {
    console.error('[SW] Favorites sync failed:', error);
  }
}

// Storage helpers for background sync
async function getStoredData(key) {
  return new Promise((resolve) => {
    const channel = new BroadcastChannel('sw-storage');
    channel.postMessage({ type: 'GET', key });
    
    channel.onmessage = (event) => {
      if (event.data.type === 'GET_RESPONSE' && event.data.key === key) {
        resolve(event.data.value);
        channel.close();
      }
    };
    
    // Timeout after 5 seconds
    setTimeout(() => {
      resolve(null);
      channel.close();
    }, 5000);
  });
}

async function removeStoredData(key) {
  const channel = new BroadcastChannel('sw-storage');
  channel.postMessage({ type: 'REMOVE', key });
  channel.close();
}

async function syncDataToServer(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
  
  return response.json();
}

console.log('[SW] Service worker script loaded');