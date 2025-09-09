# APIs por Rol de Usuario

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Roles del Sistema](#roles-del-sistema)
3. [APIs por Rol](#apis-por-rol)
   - [Comprador (Buyer)](#comprador-buyer)
   - [Vendedor Aprobado (Approved Vendor)](#vendedor-aprobado-approved-vendor)
   - [Administrador (Admin)](#administrador-admin)
   - [Usuarios No Autenticados](#usuarios-no-autenticados)
4. [Funciones RPC](#funciones-rpc)
5. [Funciones Edge](#funciones-edge)

## Introducción

Este documento detalla todas las APIs implementadas en el backend del proyecto Tesoros Chocó, organizadas por rol de usuario. Cada endpoint requiere diferentes niveles de autenticación y autorización según el rol del usuario.

## Roles del Sistema

1. **comprador (buyer)**: Usuario registrado que puede comprar productos
2. **vendedor (vendor)**: Usuario que puede publicar y vender productos
   - Estado adicional: `aprobado` para acceder a ciertas funcionalidades
3. **admin (administrator)**: Usuario con acceso completo al sistema
4. **No autenticado**: Usuarios sin sesión activa

## APIs por Rol

### Comprador (Buyer)

Los compradores pueden acceder a las siguientes APIs:

#### Pedidos
- `POST /rpc/crear_pedido` - Crear un nuevo pedido
  - Permite crear pedidos con items, información de envío y pago
  - Incluye validación de stock y simulación de pagos

- `POST /orders/:id/cancel` - Cancelar un pedido propio
  - Solo puede cancelar pedidos que le pertenecen

- `POST /payments/simulate` - Simular pagos (educativo)

#### Evaluaciones
- `POST /evaluaciones` - Crear una evaluación de producto
  - Solo puede evaluar items de pedidos entregados que le pertenecen

#### Reportes
- `GET /reportes/ventas/vendedor` - Obtener reporte de ventas (solo si es vendedor aprobado)

#### Público
- `GET /productos/:id/evaluaciones` - Ver evaluaciones de un producto
- `GET /vendedores/:id/calificacion` - Ver calificación promedio de un vendedor

### Vendedor Aprobado (Approved Vendor)

Los vendedores aprobados tienen acceso a las APIs de compradores, más:

#### Gestión de Productos
- `POST /productos` - Crear un nuevo producto
- `PUT /productos/:id` - Actualizar un producto propio
  - Incluye notificaciones de stock bajo

#### Gestión de Pedidos
- `POST /order-items/:id/shipped` - Marcar un ítem como enviado
  - Solo puede marcar items de sus propios productos

#### Reportes
- `GET /reportes/ventas/vendedor` - Obtener reporte de ventas propio

### Administrador (Admin)

Los administradores tienen acceso a todas las APIs, incluyendo:

#### Gestión de Usuarios
- `POST /admin/users/:id/role` - Cambiar el rol de un usuario
- `POST /admin/create-user` - Crear un nuevo usuario con rol específico
- `PUT /users/:id` - Actualizar información de un usuario (estado, rol, bloqueo)

#### Reportes
- `GET /reportes/productos/top` - Obtener reporte de productos más vendidos
- `GET /reportes/tendencias/vendedor/:id` - Obtener tendencias de ventas de un vendedor

#### Herramientas de Desarrollo (Solo en ambientes no productivos)
- `POST /dev/ensure-admin` - Crear o actualizar usuario administrador
- `GET /dev/debug/products` - Listar productos (debug)
- `GET /dev/debug/orders` - Listar pedidos recientes (debug)

### Usuarios No Autenticados

- `GET /health` - Verificar estado del servicio
- `POST /auth/post-signup` - Endpoint de post-registro (usado internamente por Supabase)
- `GET /productos/:id/evaluaciones` - Ver evaluaciones de un producto
- `GET /vendedores/:id/calificacion` - Ver calificación promedio de un vendedor

## Funciones RPC

Las siguientes funciones RPC están disponibles:

1. `crear_pedido` - Crear un pedido (usado por el endpoint `/rpc/crear_pedido_demo`)
2. `crear_pedido_backend` - Crear un pedido con contexto de usuario
3. `guardar_envio_backend` - Guardar información de envío
4. `pedido_cambiar_estado` - Cambiar estado de un pedido
5. `marcar_item_enviado` - Marcar un ítem como enviado
6. `top_productos_por_ventas` - Obtener productos más vendidos

## Funciones Edge

Las siguientes funciones Edge están implementadas:

1. `notify-vendor-status` - Notificar cambios de estado a vendedores
2. `order-emails` - Enviar correos electrónicos de pedidos
3. `admin-users` - Gestión de usuarios por parte de administradores
4. `self-account` - Permitir a usuarios eliminar sus propias cuentas
5. `notify-order-status` - Notificar cambios de estado de pedidos
6. `notify-low-stock` - Notificar cuando el stock de un producto está bajo
7. `notify-evaluation` - Notificar nuevas evaluaciones a vendedores

## Consideraciones de Seguridad

1. Todas las APIs (excepto las públicas) requieren autenticación mediante JWT
2. Las APIs con roles específicos verifican el rol del usuario antes de permitir el acceso
3. Los vendedores deben estar en estado "aprobado" para acceder a ciertas funcionalidades
4. Los administradores pueden acceder a todas las APIs del sistema
5. Se implementa rate limiting en endpoints sensibles
6. Se validan todos los datos de entrada con Zod

## Variables

variables backend:
NODE_ENV=production
NODE_ENV=development
SUPABASE_URL=https://jdmexfawmetmfabpwlfs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYzMDMxNiwiZXhwIjoyMDcwMjA2MzE2fQ.WRsxPKGyESijM3qI4h1AlrTyaXgpNEHQ0eOdmzCJkHE
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g
ADMIN_API_KEY=3102469381Qt..

variables frontend:
VITE_SUPABASE_URL=https://jdmexfawmetmfabpwlfs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g
VITE_BACKEND_URL=http://localhost:4000

## usuarios

🛒 Comprador	
✓ Activo
marianareyesgonzalez4@gmail.com
Rulexi700.

🏪 Vendedor	sin stock
✓ Activo
quintojessy2222@gmail.com
Rulexi700.

🏪 Vendedor	con stock
✓ Activo
carolinaalexandrazapata@gmail.com
Rulexi700.


🛡️ Admin	
✓ Activo
admin@tesoros-choco.com
admi123
