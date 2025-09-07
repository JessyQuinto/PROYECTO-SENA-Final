# 📮 Tesoros Chocó - Pruebas de Comprador

Esta colección de Postman contiene las pruebas necesarias para verificar el funcionamiento de las funcionalidades específicas del perfil de comprador en la API del proyecto Tesoros Chocó.

## 📋 Requisitos Previos

1. **Postman** instalado (versión 8.0 o superior)
2. **Backend** ejecutándose localmente en `http://localhost:4000`
3. Variables de entorno configuradas correctamente

## 🚀 Configuración Inicial

1. Importar la colección `Tesoros_Choco_Comprador_Tests.postman_collection.json` en Postman
2. Importar el entorno `Tesoros_Choco_Environment.postman_environment.json` en Postman
3. Seleccionar el entorno "Tesoros Chocó - Comprador"

## 🧪 Ejecución de Pruebas

La colección está organizada en carpetas lógicas:

### 1. 🔐 Auth Comprador
- Autentica al comprador con Supabase y sincroniza el perfil de usuario

### 2. 🛒 Pedidos Comprador
- Crea un pedido de prueba usando las credenciales del comprador

### 3. 📦 Estados Comprador
- Cambia el estado de un pedido a "entregado" usando las credenciales del comprador

## 🎯 Orden de Ejecución Recomendado

1. `POST Supabase Auth Comprador` - Autenticar como comprador
2. `POST /rpc/crear_pedido (Comprador)` - Crear un pedido
3. `POST /orders/:id/delivered (Comprador)` - Marcar pedido como entregado

## 🔐 Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `backend_base_url` | URL base del backend | `http://localhost:4000` |
| `supabase_rest_url` | URL de la API REST de Supabase | `https://jdmexfawmetmfabpwlfs.supabase.co` |
| `supabase_anon_key` | Clave pública de Supabase | - |
| `comprador_email` | Email del usuario comprador | `marianareyesgonzalez4@gmail.com` |
| `comprador_password` | Contraseña del comprador | `Rulexi700.` |
| `demo_producto_id` | ID de producto para pruebas | `228eddbe-8f20-43f4-a8aa-bb699a9f7b9b` |

## 📝 Notas Importantes

- Estas pruebas están diseñadas específicamente para ejecutarse con credenciales de perfil de comprador
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