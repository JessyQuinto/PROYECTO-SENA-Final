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
  console.error('VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g');
}

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        global: { headers: { 'x-application-name': 'tesoros-choco-frontend' } },
      })
    : (undefined as any);

// Exponer referencia global para comprobaciones puntuales en UI (solo navegador)
try {
  if (typeof window !== 'undefined' && supabase) {
    (window as any).supabase = supabase;
  }
} catch {}
