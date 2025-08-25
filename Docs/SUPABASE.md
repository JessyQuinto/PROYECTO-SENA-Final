# Documentación Supabase - Tesoros Chocó

## 📋 **Índice**
1. [Arquitectura General](#arquitectura-general)
2. [Configuración](#configuración)
3. [Base de Datos](#base-de-datos)
4. [Autenticación](#autenticación)
5. [Edge Functions](#edge-functions)
6. [Storage](#storage)
7. [RLS (Row Level Security)](#rls-row-level-security)
8. [Funciones RPC](#funciones-rpc)
9. [Optimizaciones Aplicadas](#optimizaciones-aplicadas)
10. [Mantenimiento](#mantenimiento)

---

## 🏗️ **Arquitectura General**

### **Stack Tecnológico**
- **Base de Datos**: PostgreSQL (gestionado por Supabase)
- **Autenticación**: Supabase Auth con JWT + claims de rol
- **API**: PostgREST + Edge Functions
- **Storage**: Supabase Storage (bucket `product-images`)
- **Emails**: Brevo (vía Edge Functions)

### **Componentes Principales**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   Edge Functions │
│   (React/Vite)  │◄──►│   (PostgreSQL)  │◄──►│   (Deno)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Storage       │
                       │   (Imágenes)    │
                       └─────────────────┘
```

---

## ⚙️ **Configuración**

### **Variables de Entorno Requeridas**

#### **Frontend (.env.local)**
```bash
VITE_SUPABASE_URL=https://jdmexfawmetmfabpwlfs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_BACKEND_URL=http://localhost:4000
VITE_APP_NAME=Tesoros Chocó
```

#### **Backend (.env)**
```bash
SUPABASE_URL=https://jdmexfawmetmfabpwlfs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Edge Functions (Variables de Entorno)**
```bash
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@tesoros-choco.app
BREVO_SENDER_NAME=Tesoros Chocó
APP_NAME=Tesoros Chocó
PUBLIC_APP_URL=https://tesoros-choco.app
SUPPORT_EMAIL=soporte@tesoros-choco.app
```

---

## 🗄️ **Base de Datos**

### **Tablas Principales**

#### **1. users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'comprador',
  vendedor_estado vendedor_estado,
  nombre_completo TEXT,
  bloqueado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **2. productos**
```sql
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID NOT NULL REFERENCES users(id),
  categoria_id UUID REFERENCES categorias(id),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC NOT NULL CHECK (precio > 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  imagen_url TEXT,
  estado producto_estado DEFAULT 'activo',
  archivado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **3. orders**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comprador_id UUID NOT NULL REFERENCES users(id),
  estado pedido_estado DEFAULT 'pendiente',
  total NUMERIC DEFAULT 0,
  moneda TEXT DEFAULT 'COP',
  invoice_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **4. order_items**
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  producto_id UUID NOT NULL REFERENCES productos(id),
  vendedor_id UUID NOT NULL REFERENCES users(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC NOT NULL CHECK (precio_unitario > 0),
  subtotal NUMERIC NOT NULL,
  producto_nombre TEXT NOT NULL,
  producto_imagen_url TEXT,
  enviado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **5. categorias**
```sql
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **6. evaluaciones**
```sql
CREATE TABLE evaluaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comprador_id UUID NOT NULL REFERENCES users(id),
  producto_id UUID NOT NULL REFERENCES productos(id),
  order_item_id UUID NOT NULL REFERENCES order_items(id),
  puntuacion INTEGER NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comprador_id, order_item_id)
);
```

#### **7. app_config**
```sql
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **8. audit_log**
```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **9. user_address**
```sql
CREATE TABLE user_address (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tipo address_tipo NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT NOT NULL,
  direccion2 TEXT,
  ciudad TEXT NOT NULL,
  departamento TEXT NOT NULL,
  codigo_postal TEXT,
  es_predeterminada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **10. user_payment_profile**
```sql
CREATE TABLE user_payment_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  metodo payment_method NOT NULL,
  etiqueta TEXT NOT NULL,
  titular TEXT,
  last4 TEXT,
  exp_mm SMALLINT,
  exp_yy SMALLINT,
  es_predeterminada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **11. order_shipping**
```sql
CREATE TABLE order_shipping (
  order_id UUID PRIMARY KEY REFERENCES orders(id),
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  telefono TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **12. invoice_counters**
```sql
CREATE TABLE invoice_counters (
  year INTEGER PRIMARY KEY,
  last_number INTEGER DEFAULT 0
);
```

### **Tipos ENUM**

```sql
-- Roles de usuario
CREATE TYPE user_role AS ENUM ('admin', 'vendedor', 'comprador');

-- Estados de vendedor
CREATE TYPE vendedor_estado AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- Estados de producto
CREATE TYPE producto_estado AS ENUM ('activo', 'inactivo', 'bloqueado');

-- Estados de pedido
CREATE TYPE pedido_estado AS ENUM ('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado');

-- Tipos de dirección
CREATE TYPE address_tipo AS ENUM ('envio', 'facturacion');

-- Métodos de pago
CREATE TYPE payment_method AS ENUM ('tarjeta', 'contraentrega');
```

### **Vista Materializada**

```sql
-- Promedio de calificaciones por producto
CREATE MATERIALIZED VIEW mv_promedio_calificaciones AS
SELECT 
  producto_id,
  ROUND(AVG(puntuacion), 2) AS promedio,
  COUNT(*) AS total
FROM evaluaciones
GROUP BY producto_id;
```

---

## 🔐 **Autenticación**

### **Configuración de Auth**

#### **Triggers de Registro**
```sql
-- Crear perfil de usuario al registrarse
CREATE TRIGGER handle_user_registration
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_registration();

-- Actualizar claims JWT cuando cambia el rol
CREATE TRIGGER update_user_jwt_claims
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_jwt_claims();
```

#### **Función de Registro**
```sql
CREATE OR REPLACE FUNCTION handle_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO users (id, email, role, nombre_completo)
  VALUES (
    NEW.id,
    NEW.email,
    'comprador',
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email)
  );
  RETURN NEW;
END;
$$;
```

### **Claims JWT**

Los tokens JWT incluyen:
- `role`: Rol del usuario (admin, vendedor, comprador)
- `vendedor_estado`: Estado del vendedor (si aplica)

---

## ⚡ **Edge Functions**

### **1. notify-vendor-status**
**Propósito**: Notificar a vendedores sobre cambios en su estado de aprobación

**Endpoint**: `POST /functions/v1/notify-vendor-status`

**Payload**:
```json
{
  "email": "vendedor@ejemplo.com",
  "action": "aprobado" | "rechazado",
  "nombre": "Nombre del Vendedor",
  "from": "Tesoros Chocó <noreply@tesoros-choco.app>"
}
```

### **2. order-emails**
**Propósito**: Enviar emails de confirmación y seguimiento de pedidos

**Endpoint**: `POST /functions/v1/order-emails`

**Payload**:
```json
{
  "action": "receipt" | "shipped",
  "email": "cliente@ejemplo.com",
  "order_id": "uuid-del-pedido",
  "nombre": "Nombre del Cliente"
}
```

### **3. admin-users**
**Propósito**: Gestión de usuarios por administradores

**Endpoint**: `POST /functions/v1/admin-users`

**Payload**:
```json
{
  "action": "setRole" | "suspend" | "delete",
  "user_id": "uuid-del-usuario",
  "role": "admin" | "vendedor" | "comprador",
  "blocked": true | false
}
```

### **4. self-account**
**Propósito**: Auto-eliminación de cuenta por el usuario

**Endpoint**: `POST /functions/v1/self-account`

**Payload**: `{}` (usa el usuario autenticado)

---

## 📁 **Storage**

### **Bucket: product-images**

**Configuración**:
- **Público**: Sí (para mostrar imágenes en el frontend)
- **RLS**: Habilitado
- **Políticas**: Solo vendedores pueden subir sus propias imágenes

**Estructura de archivos**:
```
product-images/
├── {vendedor_id}/
│   ├── {producto_id}/
│   │   ├── main.jpg
│   │   ├── gallery-1.jpg
│   │   └── gallery-2.jpg
│   └── {otro_producto_id}/
│       └── main.jpg
```

**Políticas RLS**:
```sql
-- Permitir lectura pública
CREATE POLICY "product_images_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Permitir inserción solo a vendedores aprobados
CREATE POLICY "product_images_vendor_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND
  (SELECT role FROM users WHERE id = auth.uid()) = 'vendedor' AND
  (SELECT vendedor_estado FROM users WHERE id = auth.uid()) = 'aprobado'
);

-- Permitir actualización/eliminación solo al propietario
CREATE POLICY "product_images_owner_manage" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 🛡️ **RLS (Row Level Security)**

### **Políticas por Tabla**

#### **users**
```sql
-- Lectura para usuarios autenticados
CREATE POLICY "users_read_authenticated" ON users
FOR SELECT TO authenticated
USING (true);

-- Actualización propia
CREATE POLICY "users_update_own" ON users
FOR UPDATE TO authenticated
USING (id = auth.uid());
```

#### **productos**
```sql
-- Lectura pública para productos activos
CREATE POLICY "productos_public_read" ON productos
FOR SELECT TO anon, authenticated
USING (estado = 'activo' AND archivado = false);

-- Gestión por vendedor
CREATE POLICY "productos_vendor_manage" ON productos
FOR ALL TO authenticated
USING (
  vendedor_id = auth.uid() AND
  (SELECT vendedor_estado FROM users WHERE id = auth.uid()) = 'aprobado'
);

-- Acceso completo para admin
CREATE POLICY "productos_admin_access" ON productos
FOR ALL TO authenticated
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

#### **orders**
```sql
-- Compradores ven sus propios pedidos
CREATE POLICY "orders_owner" ON orders
FOR ALL TO authenticated
USING (comprador_id = auth.uid());

-- Admins ven todos los pedidos
CREATE POLICY "orders_admin" ON orders
FOR ALL TO authenticated
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

#### **order_items**
```sql
-- Política consolidada para SELECT
CREATE POLICY "order_items_select_consolidated" ON order_items
FOR SELECT TO authenticated, anon
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin' OR
  (SELECT role FROM users WHERE id = auth.uid()) = 'comprador' AND 
    order_id IN (SELECT id FROM orders WHERE comprador_id = auth.uid()) OR
  (SELECT role FROM users WHERE id = auth.uid()) = 'vendedor' AND 
    vendedor_id = auth.uid()
);
```

#### **evaluaciones**
```sql
-- Política consolidada para INSERT
CREATE POLICY "evaluaciones_insert_consolidated" ON evaluaciones
FOR INSERT TO authenticated, anon
WITH CHECK (
  comprador_id = auth.uid() AND
  NOT EXISTS (
    SELECT 1 FROM evaluaciones 
    WHERE comprador_id = auth.uid() 
    AND order_item_id = evaluaciones.order_item_id
  )
);
```

---

## 🔧 **Funciones RPC**

### **Funciones de Pedidos**

#### **crear_pedido_backend**
```sql
CREATE OR REPLACE FUNCTION crear_pedido_backend(p_user_id uuid, items jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
```

**Propósito**: Crear pedido con validaciones de stock y transaccionalidad

#### **guardar_envio_backend**
```sql
CREATE OR REPLACE FUNCTION guardar_envio_backend(
  p_user_id uuid,
  p_order_id uuid,
  p_nombre text,
  p_direccion text,
  p_ciudad text,
  p_telefono text
)
RETURNS boolean
```

**Propósito**: Guardar información de envío para un pedido

### **Funciones de Métricas**

#### **kpi_mes_vendedor**
```sql
CREATE OR REPLACE FUNCTION kpi_mes_vendedor(inicio timestamp with time zone)
RETURNS TABLE(total_ventas numeric, pedidos bigint)
```

**Propósito**: Obtener KPIs del mes para vendedores

#### **kpi_mes**
```sql
CREATE OR REPLACE FUNCTION kpi_mes(inicio timestamp with time zone)
RETURNS TABLE(total_ventas numeric, pedidos bigint, productos_activos bigint)
```

**Propósito**: Obtener KPIs del mes para administradores

#### **top_productos_por_ventas**
```sql
CREATE OR REPLACE FUNCTION top_productos_por_ventas(limite integer DEFAULT 10)
RETURNS TABLE(producto_id uuid, nombre text, total_ventas numeric, unidades_vendidas bigint)
```

**Propósito**: Obtener productos más vendidos

### **Funciones de Gestión**

#### **marcar_item_enviado**
```sql
CREATE OR REPLACE FUNCTION marcar_item_enviado(p_order_item_id uuid)
RETURNS boolean
```

**Propósito**: Marcar un item de pedido como enviado

#### **pedido_cambiar_estado**
```sql
CREATE OR REPLACE FUNCTION pedido_cambiar_estado(pedido_id uuid, nuevo_estado pedido_estado)
RETURNS pedido_estado
```

**Propósito**: Cambiar estado de un pedido con validaciones

#### **generate_invoice_number**
```sql
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text
```

**Propósito**: Generar número de factura único

---

## ⚡ **Optimizaciones Aplicadas**

### **Índices Optimizados**

#### **Índices Eliminados (No Utilizados)**
- `idx_productos_search` - Índice de búsqueda de texto completo
- `idx_user_address__user_id` - Índice duplicado
- `idx_user_address__user_id_default` - Índice no utilizado
- `idx_user_payment__user_id_default` - Índice no utilizado

#### **Índices Agregados**
- `idx_evaluaciones_order_item_id` - Para foreign key
- `idx_order_items_producto_id` - Para foreign key
- `idx_productos_categoria_id` - Para foreign key
- `idx_productos_vendedor_id` - Para foreign key

### **Funciones Optimizadas**

Todas las funciones han sido optimizadas con:
- `SECURITY DEFINER` para operaciones privilegiadas
- `SET search_path = public` para seguridad
- Manejo de errores mejorado
- Performance optimizada

### **Políticas RLS Consolidadas**

Se consolidaron políticas duplicadas para mejorar performance:
- **evaluaciones**: Políticas de INSERT consolidadas
- **order_items**: Políticas de SELECT consolidadas
- **order_shipping**: Políticas consolidadas

### **Limpieza de Datos**

Se eliminaron:
- Registros huérfanos en todas las tablas
- Datos antiguos de audit_log (>6 meses)
- Referencias rotas entre tablas

---

## 🔧 **Mantenimiento**

### **Comandos Útiles**

#### **Verificar Estado de la Base de Datos**
```sql
-- Verificar tablas y tamaños
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Verificar índices no utilizados
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;
```

#### **Limpieza Periódica**
```sql
-- Limpiar audit_log antiguo (ejecutar mensualmente)
DELETE FROM audit_log 
WHERE created_at < now() - interval '6 months';

-- Limpiar datos huérfanos (ejecutar semanalmente)
DELETE FROM order_items 
WHERE order_id NOT IN (SELECT id FROM orders);

DELETE FROM order_shipping 
WHERE order_id NOT IN (SELECT id FROM orders);
```

#### **Monitoreo de Performance**
```sql
-- Verificar consultas lentas
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Verificar uso de índices
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### **Backup y Recuperación**

#### **Backup Automático**
Supabase realiza backups automáticos:
- **Backup diario**: Últimos 7 días
- **Backup semanal**: Últimas 4 semanas
- **Backup mensual**: Últimos 12 meses

#### **Punto de Restauración**
Para restaurar a un punto específico:
1. Ir a Dashboard de Supabase
2. Sección "Database" > "Backups"
3. Seleccionar punto de restauración
4. Confirmar restauración

### **Monitoreo y Alertas**

#### **Métricas a Monitorear**
- **Conexiones activas**: Máximo 100 conexiones simultáneas
- **Uso de CPU**: Mantener por debajo del 80%
- **Uso de memoria**: Mantener por debajo del 80%
- **Espacio en disco**: Mantener por debajo del 90%

#### **Alertas Recomendadas**
- Conexiones > 80
- CPU > 80%
- Memoria > 80%
- Disco > 85%
- Errores de RLS > 100/hora

### **Actualizaciones**

#### **Migraciones**
Para aplicar cambios:
```bash
# Usar el CLI de Supabase
supabase db push

# O aplicar manualmente via SQL
# (como se hizo en las optimizaciones)
```

#### **Versionado**
- Todas las migraciones están versionadas
- Usar nombres descriptivos para migraciones
- Documentar cambios importantes

---

## 📞 **Soporte**

### **Recursos Útiles**
- [Documentación oficial de Supabase](https://supabase.com/docs)
- [Guías de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Storage](https://supabase.com/docs/guides/storage)

### **Contacto**
- **Proyecto**: Tesoros Chocó
- **Versión**: 1.0.0
- **Última actualización**: Enero 2025
- **Mantenido por**: Equipo de Desarrollo SENA

---

*Esta documentación se actualiza regularmente. Para la versión más reciente, consulta el repositorio del proyecto.*



