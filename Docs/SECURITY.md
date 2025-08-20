# SECURITY.md (v1.1.0)
Cross-links: `rls_policies.md`, `AUDIT_RETENTION.md`, `NAMING_CONVENTIONS.md`.
Versión: 1.0.0 | Última actualización: 2025-08-08

## Principios
- Menor privilegio (RLS en todas las tablas + Storage)
- Nunca exponer `service_role` en frontend
- Todas las fechas/timestamps en UTC (`timestamptz`)
- Auditoría obligatoria en cambios de estado críticos

## Secretos
| Secreto | Uso | Dónde | Rotación |
|---------|-----|-------|----------|
| SUPABASE_ANON_KEY | Frontend | Variables build | Rotar si filtrada |
| SUPABASE_SERVICE_ROLE | Edge Functions / scripts backend | NO frontend | Trimestral / incidente |
| RESEND_API_KEY | Edge Function emails | Backend | Trimestral |

## Rate Limiting (a implementar)
- Auth: limitar intentos login (proxy / WAF)
- Crear producto/evaluación: throttling lógico (contador por usuario + ventana)

## Storage Policies (concepto)
```
-- Solo dueño puede escribir dentro de su carpeta
bucket = 'product-images'
path = '<user_id>/**'
```
Lectura pública restringida (MVP: pública; futura: signed URLs / verificación producto activo).

## XSS / Sanitización
- Evaluaciones: escapar HTML (render plain text)
- Formularios: validación con Zod / servidor

## Headers Frontend (recomendado)
- CSP estricta (script-src 'self')
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

## Rotación / Revocación
- Al bloquear usuario: invalidar sesiones (Supabase: reset password / update metadata flag)

## Monitoreo / Alertas (Pendiente)
- Alertas de error en Edge Functions (webhook / Sentry)
- Supervisión tasa de errores RPC > umbral

## Pendiente
- Política de backup y cifrado en repositorio (Supabase gestiona cifrado en reposo)
- Añadir WAF / rate limit externo (Cloudflare / Fastly)
