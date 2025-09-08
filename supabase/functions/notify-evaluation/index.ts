// @ts-nocheck
// Edge Function: notify-evaluation
// Notifica a vendedores cuando un comprador evalúa uno de sus productos

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

// Parse sender from config
function parseFromToSender(fromValue: string | undefined): { email: string; name?: string } | null {
  if (!fromValue) return null;
  const trimmed = fromValue.trim();
  const match = trimmed.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (match) {
    const name = match[1]?.trim();
    const email = match[2]?.trim();
    if (email) return { email, name: name || undefined };
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { email: trimmed };
  }
  return null;
}

// Send email via Brevo
async function sendWithBrevo(emailData: { from?: string; to: string; subject: string; html: string; text?: string }, recipientName?: string | null) {
  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  const ENV_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL");
  const ENV_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") ?? "Tesoros Chocó";
  if (!BREVO_API_KEY) throw new Error("Falta BREVO_API_KEY en variables de entorno");

  const parsedSender = parseFromToSender(emailData.from);
  const sender = parsedSender ?? (ENV_SENDER_EMAIL ? { email: ENV_SENDER_EMAIL, name: ENV_SENDER_NAME } : null);
  if (!sender) throw new Error("No hay remitente válido: define 'from' o variables BREVO_SENDER_EMAIL/NAME");

  const body = {
    sender,
    to: [{ email: emailData.to, name: recipientName ?? undefined }],
    subject: emailData.subject,
    htmlContent: emailData.html,
    ...(emailData.text ? { textContent: emailData.text } : {}),
  };

  const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Brevo error ${resp.status}: ${errText}`);
  }
  return resp.json();
}

// Build evaluation notification email
function buildEvaluationEmail(productName: string, puntuacion: number, comentario: string | undefined | null, vendorName?: string | null) {
  const APP_NAME = Deno.env.get("APP_NAME") ?? "Tesoros Chocó";
  const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL") ?? "";
  const SUPPORT_EMAIL = Deno.env.get("SUPPORT_EMAIL") ?? "";
  
  const safeNombre = (vendorName ?? "").trim();
  const greeting = safeNombre ? `Hola ${safeNombre},` : "Hola,";
  
  const subject = `¡Nueva evaluación recibida! - ${productName}`;
  
  const dashboardUrl = PUBLIC_APP_URL ? `${PUBLIC_APP_URL.replace(/\/$/, '')}/vendedor#products` : "";
  
  // Star rating display
  const stars = "★".repeat(puntuacion) + "☆".repeat(5 - puntuacion);
  
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="margin: 0 0 20px; color: #16a34a;">Nueva Evaluación Recibida</h1>
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">Un comprador ha evaluado uno de tus productos:</p>
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h2 style="margin: 0 0 12px; color: #16a34a;">${productName}</h2>
        <p style="margin: 0 0 8px; font-size: 24px; color: #f59e0b;">${stars} (${puntuacion}/5)</p>
        ${comentario ? `<p style="margin: 12px 0 8px; padding: 12px; background: white; border-radius: 6px; border-left: 4px solid #16a34a;"><strong>Comentario:</strong><br/>${comentario}</p>` : ''}
      </div>
      
      <p style="margin: 0 0 16px;">Gracias por ser parte de ${APP_NAME}. Las evaluaciones de los compradores son importantes para construir confianza en tu tienda.</p>
      
      ${dashboardUrl ? `<p style="margin: 0 0 16px;"><a href="${dashboardUrl}" style="background: #16a34a; color: white; text-decoration: none; padding: 12px 20px; border-radius: 6px; display: inline-block;">Ver tus productos</a></p>` : ''}
      
      <p style="margin: 24px 0 16px; font-size: 14px; color: #666;">Este es un mensaje automático de ${APP_NAME}. ${SUPPORT_EMAIL ? `Para soporte: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>` : ''}</p>
    </div>`;
  
  const text = [
    `Nueva Evaluación Recibida`,
    greeting,
    `Un comprador ha evaluado uno de tus productos:`,
    `${productName}`,
    `Calificación: ${stars} (${puntuacion}/5)`,
    comentario ? `Comentario: ${comentario}` : '',
    `Gracias por ser parte de ${APP_NAME}. Las evaluaciones de los compradores son importantes para construir confianza en tu tienda.`,
    dashboardUrl ? `Ver tus productos: ${dashboardUrl}` : '',
    `Mensaje automático de ${APP_NAME}.${SUPPORT_EMAIL ? ` Soporte: ${SUPPORT_EMAIL}` : ''}`
  ].filter(Boolean).join("\n\n");
  
  return { subject, html, text };
}

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Método no permitido" });
  }

  try {
    // Load env only for POST
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Faltan SUPABASE_URL / SUPABASE_ANON_KEY");

    // Client with request Authorization header
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    // Validate vendor
    const { data } = await supabase.auth.getUser();
    const role = (data.user)?.app_metadata?.role || (data.user)?.user_metadata?.role;
    if (role !== "vendedor") return jsonResponse(403, { error: "No autorizado (vendedor requerido)" });

    // Validate payload
    const body = await req.json();
    if (!body?.producto_id || typeof body.puntuacion !== 'number' || body.puntuacion < 1 || body.puntuacion > 5) {
      return jsonResponse(400, { error: "Payload inválido" });
    }

    // Read configuration from DB
    const [notif, sender] = await Promise.all([
      supabase.from("app_config").select("value").eq("key", "notify_evaluation_enabled").maybeSingle(),
      supabase.from("app_config").select("value").eq("key", "notify_from").maybeSingle(),
    ]);
    
    const enabled = (notif.data?.value?.enabled ?? true) as boolean;
    const fromCfg = sender.data?.value?.from as string | undefined;
    
    if (!enabled) return jsonResponse(200, { ok: true, skipped: true });

    // Get product and vendor information
    const { data: product, error: productError } = await supabase
      .from("productos")
      .select(`
        id,
        nombre,
        users!productos_vendedor_id_fkey(email, nombre_completo)
      `)
      .eq("id", body.producto_id)
      .eq("vendedor_id", data.user.id) // Ensure vendor owns this product
      .single();
      
    if (productError || !product) {
      return jsonResponse(404, { error: "Producto no encontrado o no autorizado" });
    }

    // Build email
    const ENV_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL");
    const ENV_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") ?? "Tesoros Chocó";
    const envFrom = ENV_SENDER_EMAIL ? `${ENV_SENDER_NAME} <${ENV_SENDER_EMAIL}>` : "";
    const effectiveFrom = fromCfg || envFrom;

    const { subject, html, text } = buildEvaluationEmail(
      product.nombre,
      body.puntuacion,
      body.comentario,
      product.users?.nombre_completo
    );

    // Send notification
    const result = await sendWithBrevo({
      from: effectiveFrom,
      to: product.users?.email,
      subject,
      html,
      text
    }, product.users?.nombre_completo ?? null);

    return jsonResponse(200, { ok: true, result });
  } catch (err) {
    console.error("[notify-evaluation]", err);
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
});