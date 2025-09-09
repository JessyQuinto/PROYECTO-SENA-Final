# Documentación de Supabase

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Configuración](#configuración)
3. [Estructura de la Base de Datos](#estructura-de-la-base-de-datos)
4. [Políticas de Seguridad (RLS)](#políticas-de-seguridad-rls)
5. [Funciones y Procedimientos](#funciones-y-procedimientos)
6. [Autenticación y Autorización](#autenticación-y-autorización)
7. [Almacenamiento (Storage)](#almacenamiento-storage)
8. [Funciones Edge](#funciones-edge)
9. [Migraciones](#migraciones)
10. [Configuración de la Aplicación](#configuración-de-la-aplicación)

## Introducción

Este documento describe la implementación de Supabase en el proyecto Tesoros Chocó, una plataforma de marketplace para artesanos del Chocó. El sistema utiliza Supabase como backend como servicio, aprovechando sus características de base de datos PostgreSQL, autenticación, almacenamiento y funciones serverless.

## Configuración

### Cliente de Supabase

El proyecto utiliza dos clientes de Supabase:

1. **Cliente Público (Frontend)** - `Frontend/src/lib/supabaseClient.ts`
   - Utiliza la URL de Supabase y la clave anónima
   - Configurado para autorefresh de tokens y persistencia de sesión
   - URL: `https://jdmexfawmetmfabpwlfs.supabase.co`
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g`

2. **Cliente Administrativo (Backend)** - `Backend/src/lib/supabaseAdmin.ts`
   - Utiliza la URL de Supabase y la clave de rol de servicio
   - Configurado sin autorefresh de tokens ni persistencia de sesión

## Estructura de la Base de Datos

### Tablas Principales

1. **users**
   - Campos: id, email, role, vendedor_estado, nombre_completo, bloqueado, created_at, updated_at
   - Roles: admin, vendedor, comprador
   - Estados de vendedor: pendiente, aprobado, rechazado

2. **categorias**
   - Campos: id, nombre, slug, descripcion, created_at, updated_at

3. **productos**
   - Campos: id, vendedor_id, categoria_id, nombre, descripcion, precio, stock, imagen_url, estado, created_at, updated_at, archivado
   - Estados: activo, inactivo, bloqueado

4. **orders**
   - Campos: id, comprador_id, estado, total, moneda, created_at, updated_at, invoice_number
   - Estados: pendiente, procesando, enviado, entregado, cancelado

5. **order_items**
   - Campos: id, order_id, producto_id, vendedor_id, cantidad, precio_unitario, subtotal, enviado, created_at, updated_at

6. **evaluaciones**
   - Campos: id, comprador_id, producto_id, order_item_id, puntuacion, comentario, created_at, updated_at

7. **user_address**
   - Campos: id, user_id, tipo, nombre, telefono, direccion, direccion2, ciudad, departamento, codigo_postal, es_predeterminada, created_at, updated_at

8. **user_payment_profile**
   - Campos: id, user_id, metodo, etiqueta, titular, last4, exp_mm, exp_yy, es_predeterminada, created_at, updated_at

9. **order_shipping**
   - Campos: order_id, nombre, direccion, ciudad, telefono, created_at, user_address_id, updated_at, direccion2, departamento, codigo_postal

10. **order_item_snapshot**
    - Campos: id, order_item_id, producto_nombre, producto_descripcion, producto_imagen_url, precio_capturado, vendedor_nombre, categoria_nombre, created_at, categoria_slug, vendedor_email

11. **audit_log**
    - Campos: id, actor_id, action, entity_table, entity_id, old_values, new_values, created_at, updated_at, processed_at, entity_type, ip_address, user_agent, session_id

12. **order_payments**
    - Campos: id, order_id, metodo, estado, last4, nombre_tarjeta, exp_mm, exp_yy, created_at, updated_at

13. **notifications**
    - Campos: id, title, message, type, read, link, user_id, created_at, updated_at

14. **app_config**
    - Campos: key, value, updated_at

15. **invoice_counters**
    - Campos: year, last_number, created_at, updated_at

## Políticas de Seguridad (RLS)

Todas las tablas tienen Row Level Security (RLS) habilitado con políticas específicas para cada rol:

- **Usuarios**: Solo pueden acceder a sus propios datos
- **Vendedores**: Pueden gestionar sus productos, pedidos y evaluaciones
- **Administradores**: Acceso completo a todas las tablas

Las políticas están implementadas para garantizar que cada usuario solo pueda acceder a los datos que le corresponden según su rol.

## Funciones y Procedimientos

El sistema utiliza varias funciones PostgreSQL para operaciones complejas:

1. **crear_pedido**: Función para crear pedidos con validación de stock y roles
2. **guardar_envio_backend**: Función para guardar información de envío
3. **marcar_item_enviado**: Función para marcar items como enviados
4. **rpc_vendor_metrics**: Funciones para obtener métricas de vendedores
5. **rpc_metrics_basicas**: Funciones para obtener métricas básicas del sistema

## Autenticación y Autorización

### Roles de Usuario

1. **comprador**: Rol por defecto para todos los usuarios registrados
2. **vendedor**: Rol para usuarios que pueden publicar productos
3. **admin**: Rol con acceso completo al sistema

### Procesos de Autenticación

- Registro de usuarios con asignación automática de rol "comprador"
- Solicitud para convertirse en vendedor con estado "pendiente"
- Aprobación/rechazo de vendedores por parte de administradores
- Bloqueo/eliminación de usuarios por parte de administradores

### JWT Claims

El sistema utiliza JWT claims personalizados para manejar roles y permisos de los usuarios.

## Almacenamiento (Storage)

### Buckets

1. **product-images**: Bucket para almacenar imágenes de productos
   - Políticas de acceso público para lectura
   - Políticas restringidas para escritura (solo vendedores y admins)

## Funciones Edge

El sistema utiliza funciones Edge para operaciones serverless:

1. **notify-vendor-status**: Notifica cambios de estado a vendedores (aprobado, rechazado, bloqueado, reactivado, eliminado)
2. **order-emails**: Envía correos electrónicos relacionados con pedidos (recibos y envíos)
3. **admin-users**: Funciones administrativas para gestión de usuarios (cambio de rol, suspensión, eliminación)
4. **self-account**: Permite a los usuarios eliminar sus propias cuentas
5. **notify-order-status**: Notifica cambios de estado de pedidos a compradores y vendedores
6. **notify-low-stock**: Notifica cuando el stock de un producto está bajo
7. **notify-evaluation**: Notifica nuevas evaluaciones a vendedores y recordatorios a compradores

## Migraciones

El sistema tiene un historial extenso de migraciones que incluyen:

1. Configuración inicial de tablas y relaciones
2. Implementación de políticas RLS
3. Creación de funciones y procedimientos almacenados
4. Configuración de almacenamiento y buckets
5. Implementación de sistema de auditoría
6. Configuración de notificaciones y emails
7. Optimización de funciones y triggers
8. Corrección de políticas y permisos

## Configuración de la Aplicación

La configuración de la aplicación se almacena en la tabla `app_config` con las siguientes claves:

1. **notify_vendor_email_enabled**: Habilita/deshabilita notificaciones a vendedores
2. **notify_from**: Configuración del remitente de notificaciones
3. **notify_order_status_enabled**: Habilita/deshabilita notificaciones de estado de pedidos
4. **notify_low_stock_enabled**: Habilita/deshabilita notificaciones de stock bajo
5. **notify_low_stock_threshold**: Umbral para notificaciones de stock bajo
6. **notify_evaluation_enabled**: Habilita/deshabilita notificaciones de evaluaciones

## Consideraciones de Seguridad

1. **Row Level Security**: Todas las tablas tienen RLS habilitado para control de acceso
2. **Validación de Roles**: Todas las operaciones verifican los roles de los usuarios
3. **Auditoría**: Sistema de logging para operaciones críticas
4. **Protección contra Inyección SQL**: Uso de parámetros en todas las consultas
5. **Gestión de Sesiones**: Configuración adecuada de tokens y persistencia

## Monitoreo y Mantenimiento

1. **Logs de Auditoría**: Registro de todas las operaciones importantes en la tabla `audit_log`
2. **Notificaciones**: Sistema de notificaciones para eventos importantes
3. **Métricas**: Funciones para obtener métricas del sistema
4. **Backups**: Configuración de backups automáticos en Supabase

Esta documentación proporciona una visión general completa del sistema Supabase implementado en el proyecto Tesoros Chocó. Para detalles específicos sobre implementación, se recomienda revisar el código fuente y las migraciones de la base de datos.