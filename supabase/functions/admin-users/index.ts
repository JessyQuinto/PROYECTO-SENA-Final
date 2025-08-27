import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(data: any, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", ...(init.headers || {}), "Access-Control-Allow-Origin": "*" },
    ...init,
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return json({ error: "Faltan SUPABASE_URL / SUPABASE_ANON_KEY" }, { status: 500, headers: corsHeaders });
  if (!SERVICE_ROLE) return json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY (requerido para admin)" }, { status: 500, headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") || "";
  const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders }); }
  const { action, user_id, role, blocked } = body || {};
  if (!action) return json({ error: "Missing action" }, { status: 400, headers: corsHeaders });

  // Verify admin
  try {
    const { data } = await supa.auth.getUser();
    const caller = data?.user;
    if (!caller) return json({ error: "Auth check failed" }, { status: 401, headers: corsHeaders });

    // Verificar rol en la base de datos (más seguro que app_metadata)
    const { data: userProfile, error: profileError } = await admin
      .from('users')
      .select('role, bloqueado')
      .eq('id', caller.id)
      .single();

    if (profileError || !userProfile) {
      return json({ error: "User profile not found" }, { status: 401, headers: corsHeaders });
    }

    if (userProfile.bloqueado) {
      return json({ error: "User is blocked" }, { status: 403, headers: corsHeaders });
    }

    if (userProfile.role !== "admin") {
      return json({ error: "Forbidden - Admin access required" }, { status: 403, headers: corsHeaders });
    }
  } catch {
    return json({ error: "Auth check failed" }, { status: 401, headers: corsHeaders });
  }

  try {
    if (action === "setRole") {
      if (!user_id || !role || !["admin", "vendedor", "comprador"].includes(role)) {
        return json({ error: "Invalid params" }, { status: 400, headers: corsHeaders });
      }
      const { error: e1 } = await admin.auth.admin.updateUserById(user_id, { app_metadata: { role } });
      if (e1) throw new Error(e1.message);
      const { error: e2 } = await admin.from("users").update({ role }).eq("id", user_id);
      if (e2) throw new Error(e2.message);
      return json({ ok: true }, { headers: corsHeaders });
    }

    if (action === "suspend") {
      if (!user_id || typeof blocked !== "boolean") {
        return json({ error: "Invalid params" }, { status: 400, headers: corsHeaders });
      }
      const { error } = await admin.from("users").update({ bloqueado: blocked }).eq("id", user_id);
      if (error) throw new Error(error.message);
      return json({ ok: true }, { headers: corsHeaders });
    }

    if (action === "delete") {
      if (!user_id) return json({ error: "Invalid params" }, { status: 400, headers: corsHeaders });

      // 1) Borrar en Auth (si no existe, continuar)
      const del = await admin.auth.admin.deleteUser(user_id);
      if ((del as any)?.error) {
        // permitir continuar si es 'User not found'
        const msg = (del as any).error?.message || "";
        if (!/not\s*found/i.test(msg)) throw new Error(msg);
      }

      // 2) Anonimizar en tabla pública en lugar de borrar (evita fallas por FK y preserva integridad)
      const domain = Deno.env.get("ANON_EMAIL_DOMAIN") || "tesoros-choco.app";
      const anonEmail = `deleted+${user_id}@${domain}`;
      const { error: upErr } = await admin
        .from("users")
        .update({
          email: anonEmail,
          bloqueado: true,
          nombre_completo: null,
          vendedor_estado: null,
          role: "comprador",
        })
        .eq("id", user_id);
      if (upErr) throw new Error(upErr.message);

      return json({ ok: true, softDeleted: true }, { headers: corsHeaders });
    }

    return json({ error: "Unknown action" }, { status: 400, headers: corsHeaders });
  } catch (e: any) {
    return json({ error: e?.message || "Unhandled" }, { status: 500, headers: corsHeaders });
  }
});


