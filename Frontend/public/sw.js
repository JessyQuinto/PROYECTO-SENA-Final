/**
 * Service Worker for additional caching capabilities
 * Handles static assets, API responses, and offline fallbacks
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE_NAME = `tesoros-choco-static-${CACHE_VERSION}`;
const API_CACHE_NAME = `tesoros-choco-api-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `tesoros-choco-images-${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/productos',
  '/manifest.json',
];

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = [
  /\/rest\/v1\/categorias/,
  /\/rest\/v1\/app_config/,
  /\/rest\/v1\/mv_promedio_calificaciones/,
];

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\/storage\/v1\/object\/public\/product-images/,
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('📦 Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (
            cacheName.startsWith('tesoros-choco-') &&
            !cacheName.includes(CACHE_VERSION)
          ) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip requests with special headers (like cache-control: no-cache)
  if (request.headers.get('cache-control') === 'no-cache') {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else {
    // Network first for other requests
    event.respondWith(fetch(request));
  }
});

/**
 * Check if request is for a static asset
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    request.method === 'GET' &&
    (url.pathname.endsWith('.js') ||
     url.pathname.endsWith('.css') ||
     url.pathname.endsWith('.html') ||
     url.pathname === '/' ||
     url.pathname.startsWith('/assets/'))
  );
}

/**
 * Check if request is for an API endpoint we want to cache
 */
function isAPIRequest(request) {
  return (
    request.method === 'GET' &&
    API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))
  );
}

/**
 * Check if request is for an image
 */
function isImageRequest(request) {
  return (
    request.method === 'GET' &&
    IMAGE_PATTERNS.some(pattern => pattern.test(request.url))
  );
}

/**
 * Handle static assets with cache-first strategy
 */
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Static asset fetch failed:', error);
    // Return offline fallback if available
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Handle API requests with network-first strategy and TTL
 */
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    
    // Try network first
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        // Add timestamp header for TTL checking
        const responseToCache = networkResponse.clone();
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cached-at', Date.now().toString());
        
        const responseWithTimestamp = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers,
        });
        
        cache.put(request, responseWithTimestamp);
      }
      return networkResponse;
    } catch (networkError) {
      // Network failed, try cache
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        // Check if cached response is still valid (5 minutes TTL)
        const cachedAt = cachedResponse.headers.get('sw-cached-at');
        const isExpired = cachedAt && 
          (Date.now() - parseInt(cachedAt)) > (5 * 60 * 1000);
        
        if (!isExpired) {
          console.log('📱 Serving cached API response:', request.url);
          return cachedResponse;
        } else {
          // Remove expired cache entry
          cache.delete(request);
        }
      }
      
      throw networkError;
    }
  } catch (error) {
    console.warn('API request failed:', error);
    return new Response(
      JSON.stringify({ error: 'Network unavailable' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle images with cache-first strategy
 */
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache images for longer period
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Image fetch failed:', error);
    // Return placeholder image or empty response
    return new Response('', { status: 404 });
  }
}

/**
 * Message event - handle commands from main thread
 */
self.addEventListener('message', (event) => {
  const { data } = event;
  
  if (data.type === 'CLEAR_CACHE') {
    handleClearCache(data.cacheType).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  } else if (data.type === 'GET_CACHE_STATS') {
    getCacheStats().then((stats) => {
      event.ports[0].postMessage({ stats });
    });
  }
});

/**
 * Clear specific cache or all caches
 */
async function handleClearCache(cacheType) {
  if (cacheType === 'all') {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(name => {
        if (name.startsWith('tesoros-choco-')) {
          return caches.delete(name);
        }
      })
    );
  } else {
    const cacheName = `tesoros-choco-${cacheType}-${CACHE_VERSION}`;
    await caches.delete(cacheName);
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    if (cacheName.startsWith('tesoros-choco-')) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats[cacheName] = keys.length;
    }
  }
  
  return stats;
}

console.log('🌟 Tesoros Chocó Service Worker loaded');