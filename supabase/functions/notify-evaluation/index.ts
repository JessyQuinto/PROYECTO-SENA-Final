// @ts-nocheck
// Edge Function: notify-evaluation
// Función mantenida por compatibilidad, ahora utiliza el servicio unificado

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Método no permitido" });

  try {
    // Obtener información del proyecto
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const projectRef = new URL(SUPABASE_URL).host.split('.')[0];
    const authHeader = req.headers.get("Authorization") || "";

    // Cliente con encabezado Authorization del request
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    // Validar vendedor
    const { data } = await supabase.auth.getUser();
    const role = (data.user)?.app_metadata?.role || (data.user)?.user_metadata?.role;
    if (role !== "vendedor") return jsonResponse(403, { error: "No autorizado (vendedor requerido)" });

    // Validar payload
    const body = await req.json();
    if (!body?.producto_id || typeof body.puntuacion !== 'number' || body.puntuacion < 1 || body.puntuacion > 5) {
      return jsonResponse(400, { error: "Payload inválido" });
    }

    // Redirigir al nuevo servicio unificado
    const response = await fetch(
      `https://${projectRef}.functions.supabase.co/notification-service`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          type: 'evaluation',
          payload: {
            ...body,
            vendedor_id: data.user.id
          }
        }),
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Error en el servicio de notificaciones');
    }

    return jsonResponse(200, { ok: true, ...result });
  } catch (err) {
    console.error("[notify-evaluation]", err);
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
});
