// @ts-nocheck
// Edge Function: order-emails
// Función mantenida por compatibilidad, ahora utiliza el servicio unificado

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
					type: 'order',
					payload: body
				}),
			}
		);

		const result = await response.json();
		
		if (!response.ok) {
			throw new Error(result.error || 'Error en el servicio de notificaciones');
		}

		return json(200, { ok: true, ...result });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return json(500, { error: msg });
	}
});


