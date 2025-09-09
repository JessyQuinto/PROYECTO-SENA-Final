# API de Backend – Endpoints y Contratos

Esta guía documenta los endpoints disponibles en el backend (Express + Supabase). Todos los payloads y respuestas son JSON. Los errores siguen el formato: { error: string, [detail]: any }.

## Autenticación y contexto

- Autenticación por Bearer Token (JWT de Supabase) en el header Authorization.
- Algunos endpoints requieren rol específico incluido en app_metadata.role del JWT y validado contra la tabla public.users.

Headers comunes:
- Authorization: Bearer <access_token>
- Content-Type: application/json

## Health

- GET /health
  - Respuesta 200: { ok: true, service: 'backend-demo', ts: string, [uptime], [memory] }

## Post-signup y gestión de usuarios

- POST /auth/post-signup
  - Body: { user_id: uuid, email: string, role: 'comprador'|'vendedor'|'admin', nombre?: string }
  - Efecto: upsert en tabla public.users y setea app_metadata.role del usuario.
  - Respuesta 200: { ok: true }

- POST /admin/create-user  (Requiere rol admin)
  - Headers: Authorization: Bearer <token admin>
  - Body: { email: string, password: string (>=8), role?: 'admin'|'vendedor'|'comprador', nombre?: string }
  - Efecto: crea usuario por Supabase Admin; upsert en public.users; asegura app_metadata.role.
  - Respuesta 200: { ok: true, user_id: uuid }

- POST /admin/users/:id/role  (Requiere rol admin)
  - Headers: Authorization: Bearer <token admin>
  - Body: { role: 'admin'|'vendedor'|'comprador' }
  - Efecto: actualiza app_metadata.role del usuario :id.
  - Respuesta 200: { ok: true }

## Catálogo (Optimizado con cache en memoria)

- GET /api/categories
  - Query: ninguna
  - Respuesta 200: Categoria[]
  - Cache: 3600s (1 hora)

- GET /api/products
  - Query opcionales: category: uuid, search: string, limit: number (default 20), offset: number (default 0)
  - Respuesta 200: Producto[] activos con stock > 0, ordenados por created_at desc
  - Cache: 300s (5 minutos)

Modelo de datos (referencial):
- categorias: { id, nombre, slug?, descripcion?, imagen_url?, created_at }
- productos: { id, nombre, precio, stock, imagen_url, created_at, categoria_id, vendedor_id, estado }

## Pedidos

- POST /rpc/crear_pedido_demo
  - Body: { items: { producto_id: uuid, cantidad: number }[] }
  - Efecto: llama RPC crear_pedido con Supabase Admin (modo demostración).
  - Respuesta 200: { pedido: any }

- POST /rpc/crear_pedido  (Requiere rol comprador y usuario no bloqueado)
  - Headers: Authorization: Bearer <token>
  - Body: {
      items: { producto_id: uuid, cantidad: number }[],
      shipping?: { nombre: string, direccion: string, ciudad: string, telefono: string },
      payment?: { metodo: 'tarjeta'|'contraentrega', tarjeta?: { numero: string, nombre: string, expiracion: 'MM/YY', cvv: string } },
      simulate_payment?: boolean,
      is_quick_checkout?: boolean
    }
  - Comportamiento:
    - Valida sesión y perfil en public.users (role === 'comprador', bloqueado === false).
    - Si is_quick_checkout y faltan datos: recupera dirección predeterminada (user_address) o pago predeterminado (user_payment_profile) del usuario.
    - Ejecuta RPC crear_pedido en contexto del usuario.
    - Si simulate_payment es true, simula resultado del pago para demo.
  - Respuesta 200: { pedido: any, [payment]: { simulated: boolean, status: 'approved'|'declined' } }

Notas:
- La lógica exacta de la RPC crear_pedido vive en la BD Supabase (SQL/PLPGSQL) y debe existir.

## Seguridad, CORS y rate limiting

- CORS configurable con FRONTEND_ORIGINS, soporta comodines usando patrones regex simples.
- Rate limiting por IP: ventana de 60s, con límites de 30 req/min (index.ts) o 100 req/min con bloqueo temporal de 5 min (index.optimized.ts).
- Headers de seguridad: X-Content-Type-Options, Cache-Control, Pragma, Expires; en el build optimizado se añade Helmet (CSP, HSTS, XSS, etc.).

## Errores comunes

- 401 No autenticado: falta o inválido el Bearer token.
- 403 No autorizado: rol incorrecto, usuario bloqueado o vendedor no aprobado.
- 429 Rate limit excedido: incluye header Retry-After.
- 500 Error interno: detalle en logs del servidor.

## Variables de entorno relevantes

- SUPABASE_URL: URL del proyecto Supabase.
- SUPABASE_SERVICE_ROLE_KEY: clave service role para operaciones admin.
- SUPABASE_ANON_KEY: usada por el backend para crear cliente en contexto de usuario.
- FRONTEND_ORIGINS: lista separada por comas de orígenes permitidos; soporta comodines.
- PORT: puerto del servidor (default 4000/3001 según despliegue).
