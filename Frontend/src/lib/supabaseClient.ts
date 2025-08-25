import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Evita lanzar error duro para que la app cargue y muestre aviso claro.
  console.error(
    '[supabase] Variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no definidas.'
  );
  console.error('Crea Frontend/.env.local basándote en Frontend/env.example');
  console.error('Valores por defecto:');
  console.error('VITE_SUPABASE_URL=https://jdmexfawmetmfabpwlfs.supabase.co');
  console.error(
    'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g'
  );
}

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: 'tesoros_choco_auth', // Custom storage key to avoid conflicts
          storage: {
            getItem: (key: string) => {
              try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
              } catch (error) {
                console.warn(`[Supabase] Error reading auth storage for ${key}:`, error);
                return null;
              }
            },
            setItem: (key: string, value: string) => {
              try {
                localStorage.setItem(key, value);
              } catch (error) {
                console.warn(`[Supabase] Error writing auth storage for ${key}:`, error);
                // Try to clear some space
                try {
                  const keys = Object.keys(localStorage);
                  const authKeys = keys.filter(k => k.startsWith('sb-') || k.includes('supabase'));
                  if (authKeys.length > 10) {
                    // Remove oldest auth keys
                    authKeys.slice(0, 5).forEach(k => localStorage.removeItem(k));
                    localStorage.setItem(key, value);
                  }
                } catch (cleanupError) {
                  console.error('[Supabase] Failed to cleanup auth storage:', cleanupError);
                }
              }
            },
            removeItem: (key: string) => {
              try {
                localStorage.removeItem(key);
              } catch (error) {
                console.warn(`[Supabase] Error removing auth storage for ${key}:`, error);
              }
            },
          },
        },
        global: { 
          headers: { 
            'x-application-name': 'tesoros-choco-frontend',
            'Cache-Control': 'no-cache', // Prevent caching of API responses
          } 
        },
        db: {
          schema: 'public',
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    : (undefined as any);

// Exponer referencia global para comprobaciones puntuales en UI (solo navegador)
try {
  if (typeof window !== 'undefined' && supabase) {
    (window as any).supabase = supabase;
  }
} catch {}

// Utility function to clear Supabase auth storage
export const clearSupabaseAuth = () => {
  try {
    if (typeof window !== 'undefined' && localStorage) {
      // Clear all Supabase-related keys
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase') || key.includes('tesoros_choco_auth')) {
          localStorage.removeItem(key);
        }
      });
      console.log('[Supabase] Auth storage cleared');
    }
  } catch (error) {
    console.warn('[Supabase] Error clearing auth storage:', error);
  }
};
