import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
let supabaseAdmin = null;
export function getSupabaseAdmin() {
    if (supabaseAdmin)
        return supabaseAdmin;
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY; // fallback temporal
    if (!url) {
        throw new Error('[supabase-admin] SUPABASE_URL no definida. Crea Backend/.env con SUPABASE_URL=...');
    }
    if (!serviceKey) {
        throw new Error('[supabase-admin] Falta SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_ANON_KEY como fallback).');
    }
    supabaseAdmin = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    return supabaseAdmin;
}
