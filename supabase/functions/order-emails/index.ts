// @ts-nocheck
// Edge Function: order-emails
// Envía correos de pedidos (recibo y enviado) usando Brevo

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type BodyPayload = {
	action: "receipt" | "shipped";
	email: string;
	order_id?: string | number | null;
	nombre?: string | null;
	from?: string | null;
};

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, data: unknown) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json", ...corsHeaders },
	});
}

function text(status: number, body?: string) {
    if (status === 204 || status === 304) {
        return new Response(null, { status, headers: corsHeaders });
    }
    return new Response(body ?? "", { status, headers: corsHeaders });
}

function getSupabase(req: Request) {
	const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
	const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
	return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
	});
}

async function getFromConfig(supabase: ReturnType<typeof createClient>) {
	const { data } = await supabase
		.from("app_config")
		.select("value")
		.eq("key", "notify_from")
		.maybeSingle();
	return (data as any)?.value?.from as string | undefined;
}

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

function buildEmail(action: "receipt" | "shipped", orderId: string | number | null | undefined, nombre?: string | null) {
	const shortId = orderId ? String(orderId).slice(0, 8) : "";
	const greeting = (nombre ?? "").trim() ? `Hola ${(nombre ?? "").trim()},` : "Hola,";
	if (action === "receipt") {
		const subject = `Tu recibo de compra · Pedido ${shortId}`;
		const html = `
		  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111;">
		    <h1 style=\"margin: 0 0 12px;\">Gracias por tu compra</h1>
		    <p style=\"margin: 0 0 8px;\">${greeting}</p>
		    <p style=\"margin: 0 0 8px;\">Pedido: <b>${shortId}</b></p>
		    <p style=\"margin: 0 0 8px;\">Puedes ver tu recibo en la app.</p>
		    <p style=\"margin: 24px 0 8px; font-size: 12px; color: #666;\">Este es un mensaje automático, por favor no responder.</p>
		  </div>`;
		const text = `Gracias por tu compra\n\n${greeting}\nPedido: ${shortId}\nPuedes ver tu recibo en la app.`;
		return { subject, html, text };
	}
	// shipped
	const subject = `Tu pedido va en camino · ${shortId}`;
	const html = `
	  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111;">
	    <h1 style=\"margin: 0 0 12px;\">¡Buenas noticias!</h1>
	    <p style=\"margin: 0 0 8px;\">${greeting}</p>
	    <p style=\"margin: 0 0 8px;\">Tu pedido <b>${shortId}</b> ha sido enviado.</p>
	    <p style=\"margin: 24px 0 8px; font-size: 12px; color: #666;\">Este es un mensaje automático, por favor no responder.</p>
	  </div>`;
	const text = `¡Buenas noticias!\n\n${greeting}\nTu pedido ${shortId} ha sido enviado.`;
	return { subject, html, text };
}

Deno.serve(async (req: Request) => {
	if (req.method === "OPTIONS") return text(204);
	if (req.method !== "POST") return json(405, { error: "Método no permitido" });

	try {
		const supa = getSupabase(req);
		const { data: userData } = await supa.auth.getUser();
		if (!userData?.user) return json(401, { error: "No autenticado" });

		let body: BodyPayload;
		try { body = await req.json(); } catch { return json(400, { error: "JSON inválido" }); }
		const { action, email, order_id, nombre, from } = body || {} as BodyPayload;
		if (!action || !email || !["receipt", "shipped"].includes(action)) return json(400, { error: "Campos faltantes o acción inválida" });

		const fromCfg = await getFromConfig(supa);
		const ENV_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL");
		const ENV_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") ?? "Tesoros Chocó";
		const envFrom = ENV_SENDER_EMAIL ? `${ENV_SENDER_NAME} <${ENV_SENDER_EMAIL}>` : "";
		const effectiveFrom = (from && from.trim()) || fromCfg || envFrom;

		const { subject, html, text } = buildEmail(action as any, order_id, nombre ?? null);
		await sendWithBrevo({ from: effectiveFrom, to: email, subject, html, text }, nombre ?? null);

		return json(200, { ok: true });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return json(500, { error: msg });
	}
});


