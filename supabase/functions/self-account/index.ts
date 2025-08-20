import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...cors } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") || "";
  const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Obtener usuario actual
  const { data: userData } = await supa.auth.getUser();
  const caller = userData?.user;
  if (!caller) return json(401, { error: "No auth" });

  try {
    // Soft-delete en tabla pública para no romper FKs
    const domain = Deno.env.get("ANON_EMAIL_DOMAIN") || "tesoros-choco.app";
    const anonEmail = `deleted+${caller.id}@${domain}`;
    const { error: upErr } = await admin
      .from("users")
      .update({
        email: anonEmail,
        bloqueado: true,
        nombre_completo: null,
        vendedor_estado: null,
        role: "comprador",
      })
      .eq("id", caller.id);
    if (upErr) throw new Error(upErr.message);

    // Marcar en app_metadata para evitar usos futuros (no rompe FKs)
    try {
      await admin.auth.admin.updateUserById(caller.id, { app_metadata: { deleted: true } });
    } catch { /* noop */ }

    // No borramos en Auth para evitar errores por triggers/relaciones.
    // Frontend debe hacer signOut tras respuesta OK.
    return json(200, { ok: true, softDeleted: true });
  } catch (e: any) {
    return json(500, { error: e?.message || "Unhandled" });
  }
});


