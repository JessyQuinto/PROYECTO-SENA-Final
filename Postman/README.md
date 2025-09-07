# 📮 Tesoros Chocó - Postman Collection

Esta colección de Postman contiene todas las pruebas necesarias para verificar el funcionamiento de la API del proyecto Tesoros Chocó.

## 📋 Requisitos Previos

1. **Postman** instalado (versión 8.0 o superior)
2. **Backend** ejecutándose localmente en `http://localhost:4000`
3. Variables de entorno configuradas correctamente

## 🚀 Configuración Inicial

1. Importar la colección `Tesoros_Choco_API_Completa.postman_collection.json` en Postman
2. Importar el entorno `Tesoros_Choco_Environment.postman_environment.json` en Postman
3. Seleccionar el entorno "Tesoros Chocó - Desarrollo"

## 🆕 Nueva Colección de Pruebas para Comprador

Adicionalmente, se ha creado una colección específica para pruebas del perfil de comprador:

1. Importar la colección `Tesoros_Choco_Comprador_Tests.postman_collection.json` en Postman
2. Importar el entorno `Tesoros_Choco_Environment.postman_environment.json` en Postman
3. Seleccionar el entorno "Tesoros Chocó - Comprador"

Para más detalles sobre esta colección, consultar el archivo `README_COMPRADOR.md`.

## 🧪 Ejecución de Pruebas

La colección está organizada en carpetas lógicas:

### 1. 🔍 Health Check
- Verifica que el backend esté funcionando correctamente

### 2. 🌱 Dev Seed
- Crea un usuario administrador para pruebas de desarrollo

### 3. 🔐 Auth
- Autentica con Supabase y sincroniza el perfil de usuario

### 4. 🛒 Pedidos
- Crea un pedido de prueba

### 5. 💳 Pagos
- Simula el procesamiento de un pago

### 6. 📦 Estados
- Cambia el estado de un pedido a "entregado"

### 7. 🔒 Admin Users Management
- Crea nuevos usuarios
- Cambia roles de usuarios

## 🧪 Ejecución de Pruebas para Comprador

Adicionalmente, se ha creado una colección específica para pruebas del perfil de comprador. Consultar el archivo `README_COMPRADOR.md` para más detalles.

## 🎯 Orden de Ejecución Recomendado

1. `GET /health` - Verificar que el backend esté activo
2. `POST /dev/ensure-admin` - Crear usuario admin (solo en desarrollo)
3. `POST Supabase Auth` - Autenticar como admin
4. `POST Backend Post-Signup` - Sincronizar perfil
5. `POST /rpc/crear_pedido` - Crear un pedido
6. `POST /payments/simulate` - Simular pago
7. `POST /orders/:id/delivered` - Marcar pedido como entregado
8. `POST /admin/create-user` - Crear un nuevo usuario
9. `POST /admin/users/:id/role` - Cambiar rol de usuario

## 🔐 Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `backend_base_url` | URL base del backend | `http://localhost:4000` |
| `supabase_rest_url` | URL de la API REST de Supabase | `https://jdmexfawmetmfabpwlfs.supabase.co` |
| `supabase_anon_key` | Clave pública de Supabase | - |
| `admin_email` | Email del usuario administrador | `admin@tesoros-choco.com` |
| `admin_password` | Contraseña del admin | `admin123` |
| `dev_seed_secret` | Secreto para crear admin en desarrollo | `CHANGEME_DEV_SECRET` |
| `demo_producto_id` | ID de producto para pruebas | `228eddbe-8f20-43f4-a8aa-bb699a9f7b9b` |

## 📝 Notas Importantes

- Algunas pruebas dependen de variables establecidas por pruebas anteriores
- La colección utiliza scripts de prueba para validar respuestas
- En entorno de producción, asegúrate de usar las credenciales correctas

## 🛠️ Desarrollo

Para ejecutar todas las pruebas automáticamente:
1. Haz clic en "Run" en la colección
2. Selecciona el entorno adecuado
3. Observa los resultados en el Runner de Postman

## 📊 Resultados Esperados

Todas las pruebas deberían pasar con estado 200 (OK) excepto casos específicos documentados en los scripts de prueba.