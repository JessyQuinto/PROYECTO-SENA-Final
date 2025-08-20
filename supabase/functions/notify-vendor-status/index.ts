// @ts-nocheck
// Edge Function: notify-vendor-status
// - Responde inmediatamente a OPTIONS con 204 + CORS (sin tocar env)
// - POST: valida admin con anon key, lee app_config y envía correo via Brevo

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

function parseFromToSender(fromValue) {
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

async function sendWithBrevo(emailData, recipientName) {
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

    // Leer configuración desde BD
    const [notif, sender] = await Promise.all([
      supabase.from("app_config").select("value").eq("key", "notify_vendor_email_enabled").maybeSingle(),
      supabase.from("app_config").select("value").eq("key", "notify_from").maybeSingle(),
    ]);
    const enabled = (notif.data?.value?.enabled ?? true) as boolean;
    const fromCfg = sender.data?.value?.from as string | undefined;
    if (!enabled) return jsonResponse(200, { ok: true, skipped: true });

    // Construcción de correo
    const ENV_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL");
    const ENV_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") ?? "Tesoros Chocó";
    const envFrom = ENV_SENDER_EMAIL ? `${ENV_SENDER_NAME} <${ENV_SENDER_EMAIL}>` : "";
    const effectiveFrom = (body.from && String(body.from).trim()) || fromCfg || envFrom;

    // Branding y enlaces opcionales desde ENV
    const APP_NAME = Deno.env.get("APP_NAME") ?? "Tesoros Chocó";
    const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL") ?? "";
    const SUPPORT_EMAIL = Deno.env.get("SUPPORT_EMAIL") ?? "";
    const BRAND_COLOR = Deno.env.get("BRAND_COLOR") ?? "#16a34a"; // verde

    const safeNombre = (body.nombre ?? "").trim();
    const greeting = safeNombre ? `Hola ${safeNombre},` : "Hola,";

    function buildVendorStatusEmail(action) {
      const THEME = {
        brand: BRAND_COLOR || "#166534", // verde selva
        accent: Deno.env.get("ACCENT_COLOR") || "#b45309", // ámbar artesanal
        bg: Deno.env.get("BG_COLOR") || "#fafaf5",
        text: Deno.env.get("TEXT_COLOR") || "#1f2937",
        card: Deno.env.get("CARD_BG") || "#ffffff",
        border: Deno.env.get("BORDER_COLOR") || "#e5e7eb",
        radius: Deno.env.get("BUTTON_RADIUS") || "10px",
        logo: Deno.env.get("LOGO_URL") || "",
      };

      const styles = {
        wrapper: `width:100%;margin:0;padding:24px 0;background:${THEME.bg};-webkit-font-smoothing:antialiased;`,
        container: "max-width:640px;margin:0 auto;padding:0 20px;",
        header: `padding:8px 0 12px; text-align:center; color:${THEME.brand}; font-weight:800; font-size:14px; letter-spacing:.06em; text-transform:uppercase;`,
        hero: `height:6px;background:linear-gradient(90deg, ${THEME.brand}, ${THEME.accent});border-radius:999px;`,
        card: `background:${THEME.card};border:1px solid ${THEME.border};border-radius:16px;padding:24px 22px;margin-top:16px;`,
        h1: `margin:0 0 10px;font-size:22px;line-height:28px;color:${THEME.text};`,
        p: `margin:0 0 12px;color:${THEME.text};font-size:15px;line-height:22px;`,
        li: `margin:0 0 8px;color:${THEME.text};font-size:15px;line-height:22px;`,
        cta: `display:inline-block;margin-top:12px;background:${THEME.brand};color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:${THEME.radius};font-weight:700`,
        note: `margin:18px 0 0;color:#64748b;font-size:12px;`,
        logo: "max-height:40px;margin:8px auto 4px;display:block;",
        footer: "text-align:center;margin-top:18px;color:#64748b;font-size:12px",
        divider: `height:1px;background:${THEME.border};margin:14px 0`,
        pill: `display:inline-block;background:${THEME.brand}10;color:${THEME.brand};padding:6px 10px;border-radius:999px;font-weight:700;font-size:12px;margin-bottom:8px;`
      } as Record<string,string>;

      const headerBlock = THEME.logo
        ? `<img src="${THEME.logo}" alt="${APP_NAME}" style="${styles.logo}" />`
        : `<div style="${styles.header}">${APP_NAME}</div>`;

      const dashboardUrl = PUBLIC_APP_URL ? `${PUBLIC_APP_URL.replace(/\/$/, '')}/vendedor` : "";
      const homeUrl = PUBLIC_APP_URL ? `${PUBLIC_APP_URL.replace(/\/$/, '')}` : "";

      if (action === "aprobado") {
        const subject = `¡Bienvenido como vendedor en ${APP_NAME}!`;
        const html = `
          <div style="${styles.wrapper}">
            <div style="${styles.container}">
              ${headerBlock}
              <div style="${styles.hero}"></div>
              <div style="${styles.card}">
                <div style="${styles.pill}">Cuenta aprobada</div>
                <h1 style="${styles.h1}">¡Felicidades!</h1>
                <p style="${styles.p}">${greeting}</p>
                <p style="${styles.p}">Tu cuenta de vendedor fue aprobada. Ya puedes compartir las artesanías del Chocó con el mundo.</p>
                <div style="${styles.divider}"></div>
                <p style="${styles.p}"><strong>Próximos pasos:</strong></p>
                <ul style="padding-left:18px;margin:0 0 8px">
                  <li style="${styles.li}">Crea tu primer producto con fotos que destaquen textura y detalle.</li>
                  <li style="${styles.li}">Define stock y precio acorde a tu proceso artesanal.</li>
                  <li style="${styles.li}">Cuenta la historia detrás de tu pieza: materiales, tradición y territorio.</li>
                </ul>
                ${dashboardUrl ? `<a href="${dashboardUrl}" style="${styles.cta}" target="_blank" rel="noopener noreferrer">Ir al panel de vendedor</a>` : ''}
                <p style="${styles.note}">Mensaje automático. ${SUPPORT_EMAIL ? `Ayuda: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>` : ''}</p>
              </div>
              <div style="${styles.footer}">Gracias por hacer parte de ${APP_NAME}. Artesanías con identidad del Chocó.</div>
            </div>
          </div>`;
        const text = [
          `Cuenta aprobada`,
          `¡Felicidades!`,
          greeting,
          `Tu cuenta de vendedor fue aprobada. Comparte tus artesanías.`,
          `Próximos pasos: \n- Crea tu primer producto\n- Ajusta stock y precio\n- Cuenta la historia de tu pieza`,
          dashboardUrl ? `Panel vendedor: ${dashboardUrl}` : "",
          SUPPORT_EMAIL ? `Ayuda: ${SUPPORT_EMAIL}` : "",
        ].filter(Boolean).join("\n\n");
        return { subject, html, text };
      }

      if (action === "bloqueado") {
        const subject = `Tu cuenta ha sido suspendida en ${APP_NAME}`;
        const html = `
          <div style="${styles.wrapper}">
            <div style="${styles.container}">
              ${headerBlock}
              <div style="${styles.hero}"></div>
              <div style="${styles.card}">
                <div style="${styles.pill};background:${THEME.accent}10;color:${THEME.accent}">Cuenta suspendida</div>
                <h1 style="${styles.h1}">Tu cuenta ha sido suspendida</h1>
                <p style="${styles.p}">${greeting}</p>
                <p style="${styles.p}">Por razones de cumplimiento de nuestras políticas, tu cuenta de vendedor ha sido suspendida temporalmente.</p>
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
              ${headerBlock}
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
              ${headerBlock}
              <div style="${styles.hero}"></div>
              <div style="${styles.card}">
                <div style="${styles.pill};background:${THEME.accent}10;color:${THEME.accent}">Cuenta eliminada</div>
                <h1 style="${styles.h1}">Cuenta eliminada</h1>
                <p style="${styles.p}">${greeting}</p>
                <p style="${styles.p}">Tu cuenta ha sido eliminada conforme a nuestras políticas.</p>
                <div style="${styles.divider}"></div>
                <p style="${styles.p}"><strong>Impacto:</strong></p>
                <ul style="padding-left:18px;margin:0 0 8px">
                  <li style="${styles.li}">Los productos asociados han quedado <strong>bloqueados y archivados</strong> permanentemente.</li>
                </ul>
                ${SUPPORT_EMAIL ? `<p style="${stylesp}">Si tienes dudas sobre esta acción, escríbenos a <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>` : ''}
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

      const subject = `Actualización de tu solicitud en ${APP_NAME}`;
      const html = `
        <div style="${styles.wrapper}">
          <div style="${styles.container}">
            ${headerBlock}
            <div style="${styles.hero}"></div>
            <div style="${styles.card}">
              <div style="${styles.pill};background:${THEME.accent}10;color:${THEME.accent}">Aún no aprobada</div>
              <h1 style="${styles.h1}">Gracias por tu interés</h1>
              <p style="${styles.p}">${greeting}</p>
              <p style="${styles.p}">Por ahora tu solicitud no ha sido aprobada. Valoramos tu propuesta y nos gustaría revisarla de nuevo más adelante.</p>
              <div style="${styles.divider}"></div>
              <p style="${styles.p}"><strong>Para una mejor postulación:</strong></p>
              <ul style="padding-left:18px;margin:0 0 8px">
                <li style="${styles.li}">Completa tu perfil con datos y experiencia.</li>
                <li style="${styles.li}">Incluye fotos de calidad que resalten el trabajo artesanal.</li>
                <li style="${styles.li}">Explica materiales, técnicas y origen cultural.</li>
              </ul>
              ${homeUrl ? `<a href="${homeUrl}" style="${styles.cta};background:${THEME.accent}" target="_blank" rel="noopener noreferrer">Volver a la app</a>` : ''}
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

    const { subject, html, text } = buildVendorStatusEmail(body.action);

    const result = await sendWithBrevo({ from: effectiveFrom, to: body.email, subject, html, text }, body.nombre ?? null);
    return jsonResponse(200, { ok: true, result });
  } catch (err) {
    console.error("[notify-vendor-status]", err);
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
});
