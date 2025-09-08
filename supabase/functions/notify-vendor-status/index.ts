// @ts-nocheck
// Edge Function: notify-vendor-status
// Función mantenida por compatibilidad, ahora utiliza el servicio unificado

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers para llamadas desde el navegador
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  // Preflight CORS: responder inmediatamente y no tocar env ni otra lógica
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Método no permitido" });
  }

  try {
    // Cargar env solo para POST
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Faltan SUPABASE_URL / SUPABASE_ANON_KEY");

    // Cliente con encabezado Authorization del request
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    // Validar admin
    const { data } = await supabase.auth.getUser();
    const role = (data.user)?.app_metadata?.role || (data.user)?.user_metadata?.role;
    if (role !== "admin") return jsonResponse(403, { error: "No autorizado (admin requerido)" });

    // Validar payload
    const body = await req.json();
    if (!body?.email || !body?.action || !["aprobado", "rechazado", "bloqueado", "reactivado", "eliminado"].includes(body.action)) {
      return jsonResponse(400, { error: "Payload inválido" });
    }

    // Redirigir al nuevo servicio unificado
    const projectRef = SUPABASE_URL.split('.')[0].replace('https://', '');
    const authHeader = req.headers.get("Authorization") || "";
    
    const response = await fetch(
      `https://${projectRef}.functions.supabase.co/notification-service`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          type: 'vendor_status',
          payload: body
        }),
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Error en el servicio de notificaciones');
    }

    return jsonResponse(200, { ok: true, ...result });
  } catch (err) {
    console.error("[notify-vendor-status]", err);
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
});
