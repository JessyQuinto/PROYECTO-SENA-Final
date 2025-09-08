// @ts-nocheck
// Edge Function: notify-low-stock
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
    const body = await req.json();
    if (!body?.producto_id || body.stock_actual === undefined || body.umbral === undefined) {
      return jsonResponse(400, { error: "Payload inválido" });
    }

    // Obtener información del proyecto
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const projectRef = new URL(SUPABASE_URL).host.split('.')[0];
    const authHeader = req.headers.get("Authorization") || "";

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
          type: 'low_stock',
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
    console.error("[notify-low-stock]", err);
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
});
