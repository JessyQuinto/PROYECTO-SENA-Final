// @ts-nocheck
// Edge Function: notification-service
// Servicio unificado para el envío de notificaciones por email

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

// Build vendor status notification email
function buildVendorStatusEmail(action: string, vendorName?: string | null, options: { 
  appName?: string, 
  appUrl?: string, 
  supportEmail?: string, 
  brandColor?: string,
  accentColor?: string
} = {}) {
  const APP_NAME = options.appName ?? Deno.env.get("APP_NAME") ?? "Tesoros Chocó";
  const PUBLIC_APP_URL = options.appUrl ?? Deno.env.get("PUBLIC_APP_URL") ?? "";
  const SUPPORT_EMAIL = options.supportEmail ?? Deno.env.get("SUPPORT_EMAIL") ?? "";
  const BRAND_COLOR = options.brandColor ?? Deno.env.get("BRAND_COLOR") ?? "#16a34a";
  const ACCENT_COLOR = options.accentColor ?? Deno.env.get("ACCENT_COLOR") ?? "#b45309";
  
  const safeNombre = (vendorName ?? "").trim();
  const greeting = safeNombre ? `Hola ${safeNombre},` : "Hola,";
  const dashboardUrl = PUBLIC_APP_URL ? `${PUBLIC_APP_URL.replace(/\/$/, '')}/vendedor#products` : "";
  const homeUrl = PUBLIC_APP_URL ? `${PUBLIC_APP_URL.replace(/\/$/, '')}` : "";
  
  const styles = {
    wrapper: "background:#fafaf5;padding:20px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937",
    container: "max-width:600px;margin:0 auto",
    header: "text-align:center;padding:20px 0",
    logo: "max-height:40px",
    hero: "height:120px;background:linear-gradient(135deg,#166534 0%,#16a34a 100%);border-radius:8px 8px 0 0",
    card: "background:#ffffff;border:1px solid #e5e7eb;border-radius:0 0 8px 8px;padding:24px;margin:-1px 0 0",
    pill: "display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:16px",
    h1: "margin:0 0 16px;font-size:24px;font-weight:700;color:#1f2937",
    p: "margin:0 0 16px;line-height:1.5",
    li: "margin:0 0 8px",
    divider: "height:1px;background:#e5e7eb;margin:20px 0",
    cta: `display:inline-block;background:${BRAND_COLOR};color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:16px 0`,
    note: "font-size:12px;color:#6b7280;margin:24px 0 0",
    footer: "text-align:center;font-size:12px;color:#6b7280;margin:24px 0 0"
  };

  // Status-specific templates
  if (action === "aprobado") {
    const subject = `¡Bienvenido! Tu cuenta ha sido aprobada en ${APP_NAME}`;
    const html = `
      <div style="${styles.wrapper}">
        <div style="${styles.container}">
          <div style="${styles.header}">
            ${Deno.env.get("LOGO_URL") ? `<img src="${Deno.env.get("LOGO_URL")}" alt="${APP_NAME}" style="${styles.logo}">` : `<h2>${APP_NAME}</h2>`}
          </div>
          <div style="${styles.hero}"></div>
          <div style="${styles.card}">
            <div style="${styles.pill};background:${BRAND_COLOR}10;color:${BRAND_COLOR}">Cuenta aprobada</div>
            <h1 style="${styles.h1}">¡Felicidades!</h1>
            <p style="${styles.p}">${greeting}</p>
            <p style="${styles.p}">Tu cuenta de vendedor fue aprobada. Comparte tus artesanías.</p>
            <div style="${styles.divider}"></div>
            <p style="${styles.p}"><strong>Próximos pasos:</strong></p>
            <ul style="padding-left:18px;margin:0 0 8px">
              <li style="${styles.li}">Crea tu primer producto</li>
              <li style="${styles.li}">Ajusta stock y precio</li>
              <li style="${styles.li}">Cuenta la historia de tu pieza</li>
            </ul>
            ${dashboardUrl ? `<a href="${dashboardUrl}" style="${styles.cta}" target="_blank" rel="noopener noreferrer">Ir al panel de vendedor</a>` : ''}
            <div style="${styles.divider}"></div>
            <p style="${styles.note}">Mensaje automático. ${SUPPORT_EMAIL ? `Ayuda: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>` : ''}</p>
          </div>
          <div style="${styles.footer}">Gracias por hacer parte de ${APP_NAME}. Artesanías con identidad del Chocó.</div>
        </div>
      </div>`;
    const text = [
      `¡Felicidades!`,
      greeting,
      `Tu cuenta de vendedor fue aprobada. Comparte tus artesanías.`,
      `Próximos pasos: \n- Crea tu primer producto\n- Ajusta stock y precio\n- Cuenta la historia de tu pieza`,
      dashboardUrl ? `Panel vendedor: ${dashboardUrl}` : "",
      SUPPORT_EMAIL ? `Ayuda: ${SUPPORT_EMAIL}` : "",
    ].filter(Boolean).join("\n\n");
    return { subject, html, text };
  }

  if (action === "rechazado") {
    const subject = `Solicitud no aprobada en ${APP_NAME}`;
    const html = `
      <div style="${styles.wrapper}">
        <div style="${styles.container}">
          <div style="${styles.header}">
            ${Deno.env.get("LOGO_URL") ? `<img src="${Deno.env.get("LOGO_URL")}" alt="${APP_NAME}" style="${styles.logo}">` : `<h2>${APP_NAME}</h2>`}
          </div>
          <div style="${styles.hero}"></div>
          <div style="${styles.card}">
            <div style="${styles.pill};background:${ACCENT_COLOR}10;color:${ACCENT_COLOR}">Solicitud no aprobada</div>
            <h1 style="${styles.h1}">Solicitud no aprobada</h1>
            <p style="${styles.p}">${greeting}</p>
            <p style="${styles.p}">Agradecemos tu interés. Nos encantaría revisar tu propuesta nuevamente más adelante.</p>
            <div style="${styles.divider}"></div>
            <p style="${styles.p}"><strong>Mejoras sugeridas:</strong></p>
            <ul style="padding-left:18px;margin:0 0 8px">
              <li style="${styles.li}">Completa tu perfil</li>
              <li style="${styles.li}">Mejora la fotografía</li>
              <li style="${styles.li}">Cuenta materiales y técnicas</li>
            </ul>
            <div style="${styles.divider}"></div>
            <p style="${styles.note}">Mensaje automático. ${SUPPORT_EMAIL ? `Dudas: <a href=\"mailto:${SUPPORT_EMAIL}\">${SUPPORT_EMAIL}</a>` : ''}</p>
          </div>
          <div style="${styles.footer}">En ${APP_NAME} apoyamos oficios que preservan tradición y territorio.</div>
        </div>
      </div>`;
    const text = [
      `Solicitud no aprobada`,
      greeting,
      `Agradecemos tu interés. Nos encantaría revisar tu propuesta nuevamente más adelante.`,
      `Mejoras sugeridas: \n- Completa tu perfil\n- Mejora la fotografía\n- Cuenta materiales y técnicas`,
      homeUrl ? `App: ${homeUrl}` : "",
      SUPPORT_EMAIL ? `Dudas: ${SUPPORT_EMAIL}` : "",
    ].filter(Boolean).join("\n\n");
    return { subject, html, text };
  }

  if (action === "bloqueado") {
    const subject = `Cuenta suspendida en ${APP_NAME}`;
    const html = `
      <div style="${styles.wrapper}">
        <div style="${styles.container}">
          <div style="${styles.header}">
            ${Deno.env.get("LOGO_URL") ? `<img src="${Deno.env.get("LOGO_URL")}" alt="${APP_NAME}" style="${styles.logo}">` : `<h2>${APP_NAME}</h2>`}
          </div>
          <div style="${styles.hero}"></div>
          <div style="${styles.card}">
            <div style="${styles.pill};background:#dc262610;color:#dc2626">Cuenta suspendida</div>
            <h1 style="${styles.h1}">Cuenta suspendida</h1>
            <p style="${styles.p}">${greeting}</p>
            <p style="${styles.p}">Tu cuenta de vendedor ha sido suspendida temporalmente.</p>
            <div style="${styles.divider}"></div>
            <p style="${styles.p}"><strong>Impacto en tus productos:</strong></p>
            <ul style="padding-left:18px;margin:0 0 8px">
              <li style="${styles.li}">Todos tus productos han sido <strong>bloqueados</strong> y <strong>archivados</strong>. Ya no son visibles ni vendibles.</li>
              <li style="${styles.li}">No podrás crear o editar productos mientras dure la suspensión.</li>
            </ul>
            ${SUPPORT_EMAIL ? `<p style="${styles.p}">Si consideras que se trata de un error, contáctanos: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>` : ''}
          </div>
          <div style="${styles.footer}">Gracias por tu comprensión.</div>
        </div>
      </div>`;
    const text = [
      `Cuenta suspendida`,
      greeting,
      `Tu cuenta de vendedor ha sido suspendida temporalmente.`,
      `Impacto: productos bloqueados y archivados; no podrás crear/editar productos.`,
      SUPPORT_EMAIL ? `Soporte: ${SUPPORT_EMAIL}` : "",
    ].filter(Boolean).join("\n\n");
    return { subject, html, text };
  }

  if (action === "reactivado") {
    const subject = `Tu cuenta ha sido reactivada en ${APP_NAME}`;
    const html = `
      <div style="${styles.wrapper}">
        <div style="${styles.container}">
          <div style="${styles.header}">
            ${Deno.env.get("LOGO_URL") ? `<img src="${Deno.env.get("LOGO_URL")}" alt="${APP_NAME}" style="${styles.logo}">` : `<h2>${APP_NAME}</h2>`}
          </div>
          <div style="${styles.hero}"></div>
          <div style="${styles.card}">
            <div style="${styles.pill}">Cuenta reactivada</div>
            <h1 style="${styles.h1}">¡Has sido reactivado!</h1>
            <p style="${styles.p}">${greeting}</p>
            <p style="${styles.p}">Tu cuenta de vendedor ha sido reactivada.</p>
            <div style="${styles.divider}"></div>
            <p style="${styles.p}"><strong>Estado de tus productos:</strong></p>
            <ul style="padding-left:18px;margin:0 0 8px">
              <li style="${styles.li}">Los productos bloqueados han pasado a <strong>inactivos</strong>.</li>
              <li style="${styles.li}">Puedes revisarlos y activarlos nuevamente desde tu panel de vendedor.</li>
            </ul>
            ${dashboardUrl ? `<a href="${dashboardUrl}" style="${styles.cta}" target="_blank" rel="noopener noreferrer">Ir al panel de vendedor</a>` : ''}
          </div>
          <div style="${styles.footer}">Te damos la bienvenida nuevamente.</div>
        </div>
      </div>`;
    const text = [
      `Cuenta reactivada`,
      greeting,
      `Tus productos han pasado a inactivos; puedes activarlos desde tu panel.`,
      dashboardUrl ? `Panel: ${dashboardUrl}` : "",
    ].filter(Boolean).join("\n\n");
    return { subject, html, text };
  }

  if (action === "eliminado") {
    const subject = `Tu cuenta ha sido eliminada en ${APP_NAME}`;
    const html = `
      <div style="${styles.wrapper}">
        <div style="${styles.container}">
          <div style="${styles.header}">
            ${Deno.env.get("LOGO_URL") ? `<img src="${Deno.env.get("LOGO_URL")}" alt="${APP_NAME}" style="${styles.logo}">` : `<h2>${APP_NAME}</h2>`}
          </div>
          <div style="${styles.hero}"></div>
          <div style="${styles.card}">
            <div style="${styles.pill};background:${ACCENT_COLOR}10;color:${ACCENT_COLOR}">Cuenta eliminada</div>
            <h1 style="${styles.h1}">Cuenta eliminada</h1>
            <p style="${styles.p}">${greeting}</p>
            <p style="${styles.p}">Tu cuenta ha sido eliminada conforme a nuestras políticas.</p>
            <div style="${styles.divider}"></div>
            <p style="${styles.p}"><strong>Impacto:</strong></p>
            <ul style="padding-left:18px;margin:0 0 8px">
              <li style="${styles.li}">Los productos asociados han quedado <strong>bloqueados y archivados</strong> permanentemente.</li>
            </ul>
            ${SUPPORT_EMAIL ? `<p style="${styles.p}">Si tienes dudas sobre esta acción, escríbenos a <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>` : ''}
          </div>
          <div style="${styles.footer}">Lamentamos verte partir.</div>
        </div>
      </div>`;
    const text = [
      `Cuenta eliminada`,
      greeting,
      `Los productos asociados han sido bloqueados y archivados.`,
      SUPPORT_EMAIL ? `Soporte: ${SUPPORT_EMAIL}` : "",
    ].filter(Boolean).join("\n\n");
    return { subject, html, text };
  }

  throw new Error(`Acción no soportada: ${action}`);
}

// Build low stock notification email
function buildLowStockEmail(productName: string, currentStock: number, threshold: number, vendorName?: string | null, options: { 
  appName?: string, 
  appUrl?: string, 
  supportEmail?: string 
} = {}) {
  const APP_NAME = options.appName ?? Deno.env.get("APP_NAME") ?? "Tesoros Chocó";
  const PUBLIC_APP_URL = options.appUrl ?? Deno.env.get("PUBLIC_APP_URL") ?? "";
  const SUPPORT_EMAIL = options.supportEmail ?? Deno.env.get("SUPPORT_EMAIL") ?? "";
  
  const safeNombre = (vendorName ?? "").trim();
  const greeting = safeNombre ? `Hola ${safeNombre},` : "Hola,";
  
  const subject = `¡Alerta de stock bajo! - ${productName}`;
  
  const dashboardUrl = PUBLIC_APP_URL ? `${PUBLIC_APP_URL.replace(/\/$/, '')}/vendedor#products` : "";
  
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="margin: 0 0 20px; color: #dc2626;">Alerta de Stock Bajo</h1>
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">Uno de tus productos está llegando a su límite de stock:</p>
      
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h2 style="margin: 0 0 12px; color: #dc2626;">${productName}</h2>
        <p style="margin: 0 0 8px;"><strong>Stock actual:</strong> ${currentStock} unidades</p>
        <p style="margin: 0 0 8px;"><strong>Límite configurado:</strong> ${threshold} unidades</p>
      </div>
      
      <p style="margin: 0 0 16px;">Por favor, actualiza tu inventario pronto para evitar interrupciones en las ventas.</p>
      
      ${dashboardUrl ? `<a href="${dashboardUrl}" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0;">Ir al panel de vendedor</a>` : ''}
      
      <div style="margin: 32px 0 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">Mensaje automático. ${SUPPORT_EMAIL ? `Dudas: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>` : ''}</p>
      </div>
      <div style="text-align: center; font-size: 12px; color: #6b7280; margin: 16px 0 0;">
        En ${APP_NAME} apoyamos oficios que preservan tradición y territorio.
      </div>
    </div>`;
  
  const text = [
    `Alerta de Stock Bajo - ${productName}`,
    greeting,
    `Uno de tus productos está llegando a su límite de stock:`,
    `Producto: ${productName}`,
    `Stock actual: ${currentStock} unidades`,
    `Límite configurado: ${threshold} unidades`,
    `Por favor, actualiza tu inventario pronto para evitar interrupciones en las ventas.`,
    dashboardUrl ? `Panel vendedor: ${dashboardUrl}` : "",
    SUPPORT_EMAIL ? `Dudas: ${SUPPORT_EMAIL}` : "",
  ].filter(Boolean).join("\n\n");
  
  return { subject, html, text };
}

// Build evaluation notification email
function buildEvaluationEmail(productName: string, rating: number, comment: string | undefined | null, vendorName?: string | null, options: { 
  appName?: string, 
  appUrl?: string, 
  supportEmail?: string 
} = {}) {
  const APP_NAME = options.appName ?? Deno.env.get("APP_NAME") ?? "Tesoros Chocó";
  const PUBLIC_APP_URL = options.appUrl ?? Deno.env.get("PUBLIC_APP_URL") ?? "";
  const SUPPORT_EMAIL = options.supportEmail ?? Deno.env.get("SUPPORT_EMAIL") ?? "";
  
  const safeNombre = (vendorName ?? "").trim();
  const greeting = safeNombre ? `Hola ${safeNombre},` : "Hola,";
  
  const subject = `¡Nueva evaluación recibida! - ${productName}`;
  
  const dashboardUrl = PUBLIC_APP_URL ? `${PUBLIC_APP_URL.replace(/\/$/, '')}/vendedor#products` : "";
  
  // Star rating display
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="margin: 0 0 20px; color: #16a34a;">Nueva Evaluación Recibida</h1>
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">Un comprador ha evaluado uno de tus productos:</p>
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h2 style="margin: 0 0 12px; color: #16a34a;">${productName}</h2>
        <p style="margin: 0 0 8px;"><strong>Calificación:</strong> ${stars} (${rating}/5)</p>
        ${comment ? `<div style="margin: 12px 0 0; padding: 12px; background: #ffffff; border-radius: 4px;">
          <p style="margin: 0; font-style: italic;">"${comment}"</p>
        </div>` : ''}
      </div>
      
      <p style="margin: 0 0 16px;">Gracias por formar parte de nuestra comunidad de artesanos.</p>
      
      ${dashboardUrl ? `<a href="${dashboardUrl}" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0;">Ir al panel de vendedor</a>` : ''}
      
      <div style="margin: 32px 0 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">Mensaje automático. ${SUPPORT_EMAIL ? `Dudas: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>` : ''}</p>
      </div>
      <div style="text-align: center; font-size: 12px; color: #6b7280; margin: 16px 0 0;">
        En ${APP_NAME} apoyamos oficios que preservan tradición y territorio.
      </div>
    </div>`;
  
  const text = [
    `Nueva Evaluación Recibida - ${productName}`,
    greeting,
    `Un comprador ha evaluado uno de tus productos:`,
    `Producto: ${productName}`,
    `Calificación: ${rating}/5`,
    comment ? `Comentario: "${comment}"` : "",
    `Gracias por formar parte de nuestra comunidad de artesanos.`,
    dashboardUrl ? `Panel vendedor: ${dashboardUrl}` : "",
    SUPPORT_EMAIL ? `Dudas: ${SUPPORT_EMAIL}` : "",
  ].filter(Boolean).join("\n\n");
  
  return { subject, html, text };
}

// Build order notification email
function buildOrderEmail(action: "receipt" | "shipped", orderId: string | number | null | undefined, customerName?: string | null, options: { 
  appName?: string, 
  supportEmail?: string 
} = {}) {
  const APP_NAME = options.appName ?? Deno.env.get("APP_NAME") ?? "Tesoros Chocó";
  const SUPPORT_EMAIL = options.supportEmail ?? Deno.env.get("SUPPORT_EMAIL") ?? "";
  
  const shortId = orderId ? String(orderId).slice(0, 8) : "";
  const greeting = (customerName ?? "").trim() ? `Hola ${(customerName ?? "").trim()},` : "Hola,";
  
  if (action === "receipt") {
    const subject = `Tu recibo de compra · Pedido ${shortId}`;
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111;">
        <h1 style="margin: 0 0 12px;">Gracias por tu compra</h1>
        <p style="margin: 0 0 8px;">${greeting}</p>
        <p style="margin: 0 0 8px;">Pedido: <b>${shortId}</b></p>
        <p style="margin: 0 0 8px;">Puedes ver tu recibo en la app.</p>
        <p style="margin: 24px 0 8px; font-size: 12px; color: #666;">Este es un mensaje automático, por favor no responder.</p>
      </div>`;
    const text = `Gracias por tu compra\n\n${greeting}\nPedido: ${shortId}\nPuedes ver tu recibo en la app.`;
    return { subject, html, text };
  }
  
  // shipped
  const subject = `Tu pedido va en camino · ${shortId}`;
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111;">
      <h1 style="margin: 0 0 12px;">¡Buenas noticias!</h1>
      <p style="margin: 0 0 8px;">${greeting}</p>
      <p style="margin: 0 0 8px;">Tu pedido <b>${shortId}</b> ha sido enviado.</p>
      <p style="margin: 24px 0 8px; font-size: 12px; color: #666;">Este es un mensaje automático, por favor no responder.</p>
    </div>`;
  const text = `¡Buenas noticias!\n\n${greeting}\nTu pedido ${shortId} ha sido enviado.`;
  return { subject, html, text };
}

// Main function to send notifications
async function sendNotification(
  type: "vendor_status" | "low_stock" | "evaluation" | "order",
  payload: any,
  supabase: ReturnType<typeof createClient>
) {
  try {
    // Get configuration from DB
    let configKey = "";
    switch (type) {
      case "vendor_status": configKey = "notify_vendor_email_enabled"; break;
      case "low_stock": configKey = "notify_low_stock_enabled"; break;
      case "evaluation": configKey = "notify_evaluation_enabled"; break;
      case "order": configKey = "notify_order_enabled"; break;
      default: throw new Error(`Tipo de notificación no soportado: ${type}`);
    }
    
    const [notif, sender] = await Promise.all([
      supabase.from("app_config").select("value").eq("key", configKey).maybeSingle(),
      supabase.from("app_config").select("value").eq("key", "notify_from").maybeSingle(),
    ]);
    
    const enabled = (notif.data?.value?.enabled ?? true) as boolean;
    const fromCfg = sender.data?.value?.from as string | undefined;
    
    if (!enabled) {
      return { ok: true, skipped: true, message: "Notificaciones deshabilitadas" };
    }
    
    // Get environment defaults
    const ENV_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL");
    const ENV_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") ?? "Tesoros Chocó";
    const envFrom = ENV_SENDER_EMAIL ? `${ENV_SENDER_NAME} <${ENV_SENDER_EMAIL}>` : "";
    const effectiveFrom = payload.from || fromCfg || envFrom;
    
    let emailData: { subject: string; html: string; text: string };
    let recipientEmail: string;
    let recipientName: string | null = null;
    
    // Build email based on type
    switch (type) {
      case "vendor_status":
        if (!payload.email || !payload.action) {
          throw new Error("Faltan campos requeridos para notificación de estado de vendedor");
        }
        
        emailData = buildVendorStatusEmail(payload.action, payload.nombre, {
          appName: Deno.env.get("APP_NAME"),
          appUrl: Deno.env.get("PUBLIC_APP_URL"),
          supportEmail: Deno.env.get("SUPPORT_EMAIL"),
          brandColor: Deno.env.get("BRAND_COLOR"),
          accentColor: Deno.env.get("ACCENT_COLOR")
        });
        
        recipientEmail = payload.email;
        recipientName = payload.nombre ?? null;
        break;
        
      case "low_stock":
        if (!payload.producto_id || payload.stock_actual === undefined || payload.umbral === undefined) {
          throw new Error("Faltan campos requeridos para notificación de stock bajo");
        }
        
        // Get product and vendor information
        const { data: product, error: productError } = await supabase
          .from("productos")
          .select(`
            id,
            nombre,
            stock,
            users!productos_vendedor_id_fkey(email, nombre_completo)
          `)
          .eq("id", payload.producto_id)
          .single();
          
        if (productError || !product) {
          throw new Error("Producto no encontrado");
        }
        
        emailData = buildLowStockEmail(
          product.nombre,
          payload.stock_actual,
          payload.umbral,
          product.users?.nombre_completo,
          {
            appName: Deno.env.get("APP_NAME"),
            appUrl: Deno.env.get("PUBLIC_APP_URL"),
            supportEmail: Deno.env.get("SUPPORT_EMAIL")
          }
        );
        
        recipientEmail = product.users?.email;
        recipientName = product.users?.nombre_completo ?? null;
        break;
        
      case "evaluation":
        if (!payload.producto_id || typeof payload.puntuacion !== 'number' || payload.puntuacion < 1 || payload.puntuacion > 5) {
          throw new Error("Datos de evaluación inválidos");
        }
        
        // Get product and vendor information
        const { data: evalProduct, error: evalError } = await supabase
          .from("productos")
          .select(`
            id,
            nombre,
            users!productos_vendedor_id_fkey(email, nombre_completo)
          `)
          .eq("id", payload.producto_id)
          .eq("vendedor_id", payload.vendedor_id) // Ensure vendor owns this product
          .single();
          
        if (evalError || !evalProduct) {
          throw new Error("Producto no encontrado o no autorizado");
        }
        
        emailData = buildEvaluationEmail(
          evalProduct.nombre,
          payload.puntuacion,
          payload.comentario,
          evalProduct.users?.nombre_completo,
          {
            appName: Deno.env.get("APP_NAME"),
            appUrl: Deno.env.get("PUBLIC_APP_URL"),
            supportEmail: Deno.env.get("SUPPORT_EMAIL")
          }
        );
        
        recipientEmail = evalProduct.users?.email;
        recipientName = evalProduct.users?.nombre_completo ?? null;
        break;
        
      case "order":
        if (!payload.action || !payload.email || !["receipt", "shipped"].includes(payload.action)) {
          throw new Error("Campos faltantes o acción inválida para notificación de pedido");
        }
        
        emailData = buildOrderEmail(payload.action as any, payload.order_id, payload.nombre, {
          appName: Deno.env.get("APP_NAME"),
          supportEmail: Deno.env.get("SUPPORT_EMAIL")
        });
        
        recipientEmail = payload.email;
        recipientName = payload.nombre ?? null;
        break;
        
      default:
        throw new Error(`Tipo de notificación no soportado: ${type}`);
    }
    
    // Send email
    const result = await sendWithBrevo({
      from: effectiveFrom,
      to: recipientEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    }, recipientName);
    
    return { ok: true, result, message: "Notificación enviada correctamente" };
  } catch (error) {
    console.error(`[notification-service] Error enviando notificación ${type}:`, error);
    throw error;
  }
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

    // Validar payload
    const body = await req.json();
    if (!body?.type || !body?.payload) {
      return jsonResponse(400, { error: "Payload inválido: se requiere type y payload" });
    }

    // Validar tipo de notificación
    const validTypes = ["vendor_status", "low_stock", "evaluation", "order"];
    if (!validTypes.includes(body.type)) {
      return jsonResponse(400, { error: `Tipo de notificación no válido. Tipos válidos: ${validTypes.join(", ")}` });
    }

    // Para notificaciones de vendedor, validar rol de admin
    if (body.type === "vendor_status") {
      const { data } = await supabase.auth.getUser();
      const role = (data.user)?.app_metadata?.role || (data.user)?.user_metadata?.role;
      if (role !== "admin") return jsonResponse(403, { error: "No autorizado (admin requerido)" });
    }
    
    // Para notificaciones de evaluación, validar rol de vendedor
    if (body.type === "evaluation") {
      const { data } = await supabase.auth.getUser();
      const role = (data.user)?.app_metadata?.role || (data.user)?.user_metadata?.role;
      if (role !== "vendedor") return jsonResponse(403, { error: "No autorizado (vendedor requerido)" });
      
      // Añadir el ID del vendedor al payload
      body.payload.vendedor_id = data.user.id;
    }

    // Enviar notificación
    const result = await sendNotification(body.type, body.payload, supabase);
    
    return jsonResponse(200, { ok: true, ...result });
  } catch (err) {
    console.error("[notification-service]", err);
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
});