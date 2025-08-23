import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Evita lanzar error duro para que la app cargue y muestre aviso claro.
  console.error(
    '[supabase] Variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no definidas. Crea Frontend/.env.local usando Frontend/.env.example.'
  );
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
