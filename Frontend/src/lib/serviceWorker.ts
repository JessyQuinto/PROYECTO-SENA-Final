/**
 * Service Worker registration and management utility
 */

interface ServiceWorkerMessage {
  type: string;
  cacheType?: string;
}

interface ServiceWorkerResponse {
  success?: boolean;
  stats?: Record<string, number>;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = 'serviceWorker' in navigator;

  constructor() {
    if (this.isSupported) {
      this.register();
    }
  }

  /**
   * Register the service worker
   */
  private async register(): Promise<void> {
    try {
      console.log('🔧 Registering service worker...');

      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        console.log('🔄 Service worker update found');
        const newWorker = this.registration?.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              console.log('🆕 New service worker installed, refresh to update');
              this.notifyUpdate();
            }
          });
        }
      });

      console.log('✅ Service worker registered successfully');
    } catch (error) {
      console.warn('❌ Service worker registration failed:', error);
    }
  }

  /**
   * Send message to service worker and get response
   */
  private async sendMessage(
    message: ServiceWorkerMessage
  ): Promise<ServiceWorkerResponse> {
    if (!this.registration?.active) {
      throw new Error('Service worker not active');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = event => {
        resolve(event.data);
      };

      messageChannel.port1.onmessageerror = error => {
        reject(error);
      };

      this.registration!.active!.postMessage(message, [messageChannel.port2]);
    });
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<boolean> {
    try {
      if (!this.isSupported || !this.registration?.active) {
        // Fallback to manual cache clearing
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => {
            if (name.startsWith('tesoros-choco-')) {
              return caches.delete(name);
            }
          })
        );
        return true;
      }

      const response = await this.sendMessage({
        type: 'CLEAR_CACHE',
        cacheType: 'all',
      });
      return response.success || false;
    } catch (error) {
      console.warn('Failed to clear caches:', error);
      return false;
    }
  }

  /**
   * Clear specific cache type
   */
  async clearCache(cacheType: 'static' | 'api' | 'images'): Promise<boolean> {
    try {
      if (!this.isSupported || !this.registration?.active) {
        // Fallback to manual cache clearing
        const cacheName = `tesoros-choco-${cacheType}-v1.0.0`;
        await caches.delete(cacheName);
        return true;
      }

      const response = await this.sendMessage({
        type: 'CLEAR_CACHE',
        cacheType,
      });
      return response.success || false;
    } catch (error) {
      console.warn(`Failed to clear ${cacheType} cache:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<Record<string, number>> {
    try {
      if (!this.isSupported || !this.registration?.active) {
        // Fallback to manual stats gathering
        const cacheNames = await caches.keys();
        const stats: Record<string, number> = {};

        for (const cacheName of cacheNames) {
          if (cacheName.startsWith('tesoros-choco-')) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            stats[cacheName] = keys.length;
          }
        }

        return stats;
      }

      const response = await this.sendMessage({ type: 'GET_CACHE_STATS' });
      return response.stats || {};
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return {};
    }
  }

  /**
   * Check if service worker is supported and active
   */
  isActive(): boolean {
    return this.isSupported && !!this.registration?.active;
  }

  /**
   * Notify user about service worker update
   */
  private notifyUpdate(): void {
    // You can customize this notification
    if (window.confirm('Nueva versión disponible. ¿Quieres actualizar?')) {
      window.location.reload();
    }
  }

  /**
   * Manually update service worker
   */
  async update(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  /**
   * Unregister service worker (for development)
   */
  async unregister(): Promise<boolean> {
    if (this.registration) {
      return await this.registration.unregister();
    }
    return false;
  }
}

// Global service worker manager instance
export const serviceWorkerManager = new ServiceWorkerManager();

// React hook for service worker functionality
import { useState, useEffect, useCallback } from 'react';

interface UseServiceWorkerReturn {
  isSupported: boolean;
  isActive: boolean;
  cacheStats: Record<string, number>;
  clearAllCaches: () => Promise<boolean>;
  clearCache: (type: 'static' | 'api' | 'images') => Promise<boolean>;
  refreshStats: () => Promise<void>;
}

export const useServiceWorker = (): UseServiceWorkerReturn => {
  const [isActive, setIsActive] = useState(false);
  const [cacheStats, setCacheStats] = useState<Record<string, number>>({});

  const refreshStats = useCallback(async () => {
    const stats = await serviceWorkerManager.getCacheStats();
    setCacheStats(stats);
  }, []);

  const clearAllCaches = useCallback(async () => {
    const success = await serviceWorkerManager.clearAllCaches();
    if (success) {
      await refreshStats();
    }
    return success;
  }, [refreshStats]);

  const clearCache = useCallback(
    async (type: 'static' | 'api' | 'images') => {
      const success = await serviceWorkerManager.clearCache(type);
      if (success) {
        await refreshStats();
      }
      return success;
    },
    [refreshStats]
  );

  useEffect(() => {
    // Check if service worker is active
    const checkActive = () => {
      setIsActive(serviceWorkerManager.isActive());
    };

    // Initial check
    checkActive();

    // Load initial stats
    refreshStats();

    // Check periodically
    const interval = setInterval(checkActive, 5000);

    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    isSupported: 'serviceWorker' in navigator,
    isActive,
    cacheStats,
    clearAllCaches,
    clearCache,
    refreshStats,
  };
};

export default serviceWorkerManager;
