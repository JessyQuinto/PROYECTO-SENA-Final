# Base de Datos (Supabase) - Esquema actual

Esta documentación fue generada desde el esquema actual del proyecto en Supabase (schema `public`). Incluye tablas, columnas, tipos, claves primarias y relaciones principales.

## Tabla: app_config
- key (text, PK)
- value (jsonb, not null)
- updated_at (timestamptz, default now())

Notas:
- Configuración de la aplicación en formato clave/valor.

## Tabla: audit_log
- id (bigint, PK, sequence)
- actor_id (uuid, nullable)
- action (text, not null)
- entity (text, not null)
- entity_id (uuid, nullable)
- old_values (jsonb, nullable)
- new_values (jsonb, nullable)
- created_at (timestamptz, default now())

Notas:
- Auditoría de cambios críticos.

## Tabla: categorias
- id (uuid, PK, default gen_random_uuid())
- nombre (text, not null)
- slug (text, unique, not null)
- descripcion (text, nullable)
- created_at (timestamptz, default now())

Relaciones:
- Referenciada por `productos.categoria_id`.

## Tabla: users
- id (uuid, PK, FK -> auth.users.id)
- email (text, unique, not null)
- role (user_role, default 'comprador')
- vendedor_estado (vendedor_estado, nullable)
- nombre_completo (text, nullable)
- bloqueado (boolean, default false)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

Relaciones:
- FK desde: productos.vendedor_id, orders.comprador_id, order_items.vendedor_id, evaluaciones.comprador_id, user_address.user_id, user_payment_profile.user_id

## Tabla: productos
- id (uuid, PK, default gen_random_uuid())
- vendedor_id (uuid, not null, FK -> users.id)
- categoria_id (uuid, nullable, FK -> categorias.id)
- nombre (text, not null)
- descripcion (text, nullable)
- precio (numeric, not null, check > 0)
- stock (integer, not null, check >= 0)
- imagen_url (text, nullable)
- estado (producto_estado, default 'activo')
- creado el (timestamptz, default now())
- actualizado el (timestamptz, default now())
- archivado (boolean, default false)

Relaciones:
- Referenciada por: order_items.producto_id, evaluaciones.producto_id

## Tabla: orders
- id (uuid, PK, default gen_random_uuid())
- comprador_id (uuid, not null, FK -> users.id)
- estado (pedido_estado, default 'pendiente')
- total (numeric, not null)
- moneda (text, default 'COP')
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())
- invoice_number (text, unique, nullable)

Relaciones:
- Referenciada por: order_items.order_id, order_shipping.order_id

## Tabla: order_items
- id (uuid, PK, default gen_random_uuid())
- order_id (uuid, not null, FK -> orders.id)
- producto_id (uuid, not null, FK -> productos.id)
- vendedor_id (uuid, not null, FK -> users.id)
- cantidad (integer, not null, check > 0)
- precio_unitario (numeric, not null, check > 0)
- subtotal (numeric, not null)
- producto_nombre (text, not null)
- producto_imagen_url (text, nullable)
- enviado (boolean, default false)

Relaciones:
- Referenciado por: evaluaciones.order_item_id

## Tabla: order_shipping
- order_id (uuid, PK, FK -> orders.id)
- nombre (text, not null)
- direccion (text, not null)
- ciudad (text, not null)
- telefono (text, not null)
- created_at (timestamptz, default now())

## Tabla: evaluaciones
- id (uuid, PK, default gen_random_uuid())
- comprador_id (uuid, not null, FK -> users.id)
- producto_id (uuid, not null, FK -> productos.id)
- order_item_id (uuid, not null, FK -> order_items.id)
- puntuacion (integer, not null, check 1..5)
- comentario (text, nullable)
- created_at (timestamptz, default now())

## Tabla: user_address
- id (uuid, PK, default gen_random_uuid())
- user_id (uuid, not null, FK -> users.id)
- tipo (address_tipo, not null, enum: envio|facturacion)
- nombre (text, not null)
- telefono (text, nullable)
- direccion (text, not null)
- direccion2 (text, nullable)
- ciudad (text, not null)
- departamento (text, not null)
- codigo_postal (text, nullable)
- es_predeterminada (boolean, default false)
- created_at (timestamptz, default now())

## Tabla: user_payment_profile
- id (uuid, PK, default gen_random_uuid())
- user_id (uuid, not null, FK -> users.id)
- metodo (payment_method, not null, enum: tarjeta|contraentrega)
- etiqueta (text, not null)
- titular (text, nullable)
- last4 (text, nullable)
- exp_mm (smallint, nullable)
- exp_yy (smallint, nullable)
- es_predeterminada (boolean, default false)
- created_at (timestamptz, default now())

## Notas de Seguridad (RLS)
- RLS habilitado en todas las tablas listadas.
- Políticas aplican según rol: admin, vendedor, comprador.

## Extensiones / Otros
- `invoice_counters` mantiene contador anual para facturación (PK year, last_number).

Fuente: instancia Supabase actual. Si cambian migraciones, regenerar este archivo.
