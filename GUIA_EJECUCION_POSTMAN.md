# 📋 Guía de Ejecución de Colecciones de Postman

Esta guía detalla cómo ejecutar las colecciones de Postman para el proyecto **Tesoros Chocó**, incluyendo los comandos necesarios y las configuraciones requeridas.

## 📁 Estructura de Archivos de Colecciones

El proyecto incluye las siguientes colecciones de Postman:

```
Postman/
├── Tesoros_Choco_API_Completa.postman_collection.json
├── Tesoros_Choco_Vendedor_Tests.postman_collection.json
├── Tesoros_Choco_Environment.postman_environment.json
└── Tesoros_Choco_Environment_Desarrollo.postman_environment.json
```

## 🛠️ Prerrequisitos

Antes de ejecutar las colecciones, asegúrate de tener:

1. **Node.js** instalado (versión 14 o superior)
2. **Backend** ejecutándose en `http://localhost:4000`
3. **Variables de entorno** correctamente configuradas

### Verificación del Backend

```bash
# Navega al directorio del backend
cd "C:\Users\Jessy\OneDrive\Desktop\PROYECTO-SENA-main-main\PROYECTO-SENA-main-main\Backend"

# Inicia el servidor (en modo desarrollo)
npm run dev
```

El backend debe mostrar un mensaje como:
```
[backend-demo] listening on 127.0.0.1:4000
```

## 🚀 Ejecución de Colecciones con Newman

### 1. Instalación de Newman

```bash
# Instala Newman globalmente (solo la primera vez)
npm install -g newman

# O instala como dependencia del proyecto
npm install newman
```

### 2. Ejecución de la Colección de Vendedor

```bash
# Navega al directorio del proyecto
cd "C:\Users\Jessy\OneDrive\Desktop\PROYECTO-SENA-main-main\PROYECTO-SENA-main-main"

# Ejecuta la colección de vendedor con su environment
npx newman run "Postman\Tesoros_Choco_Vendedor_Tests.postman_collection.json" -e "Postman\Tesoros_Choco_Environment.postman_environment.json"
```

### 3. Ejecución de la Colección API Completa

```bash
# Navega al directorio del proyecto
cd "C:\Users\Jessy\OneDrive\Desktop\PROYECTO-SENA-main-main\PROYECTO-SENA-main-main"

# Ejecuta la colección completa con su environment
npx newman run "Postman\Tesoros_Choco_API_Completa.postman_collection.json" -e "Postman\Tesoros_Choco_Environment.postman_environment.json"
```

## 🐛 Solución de Problemas Comunes

### Error: "Invalid API key"

**Causa**: La variable `supabase_anon_key` contiene `{{vault:supabase-anon-api-key}}` en lugar del valor real.

**Solución**: 
1. Abre el archivo de environment en Postman
2. Reemplaza `{{vault:supabase-anon-api-key}}` con la clave real:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g
   ```

### Error: "No autenticado" (401)

**Causa**: El token de autenticación no se está pasando correctamente entre las solicitudes.

**Solución**: 
- Usa el script `run-postman-tests.cjs` que maneja correctamente las variables dinámicas:

```bash
# Navega al directorio del proyecto
cd "C:\Users\Jessy\OneDrive\Desktop\PROYECTO-SENA-main-main\PROYECTO-SENA-main-main"

# Ejecuta el script que simula el flujo completo de Postman
node run-postman-tests.cjs
```

### Error: "Producto no encontrado" (404)

**Causa**: El `product_id` utilizado no existe en la base de datos.

**Solución**:
1. Verifica que el ID del producto exista en la base de datos
2. Actualiza la variable `demo_producto_id` en el environment con un ID válido

## 📊 Resultados Esperados

### Ejecución Exitosa
```
=== 🎉 ¡Todas las pruebas de la colección de Postman pasaron exitosamente! ===

Resumen de resultados:
1. 🔍 Health Check: ✅
2. 🔐 Auth Vendedor: ✅
3. 📦 Gestión de Productos (Crear): ✅
4. 📦 Gestión de Productos (Actualizar): ✅
5. 🚚 Gestión de Envíos: ✅
```

### Reporte Detallado de Newman
```
┌─────────────────────────┬───────────────────┬───────────────────┐
│                         │          executed │            failed │
├─────────────────────────┼───────────────────┼───────────────────┤
│              iterations │                 1 │                 0 │
├─────────────────────────┼───────────────────┼───────────────────┤
│                requests │                 6 │                 0 │
├─────────────────────────┼───────────────────┼───────────────────┤
│            test-scripts │                 6 │                 0 │
├─────────────────────────┼───────────────────┼───────────────────┤
│              assertions │                 7 │                 0 │
├─────────────────────────┴───────────────────┴───────────────────┤
│ total run duration: 1052ms                                      │
├─────────────────────────────────────────────────────────────────┤
│ total data received: 3.11kB (approx)                            │
├─────────────────────────────────────────────────────────────────┤
│ average response time: 106ms [min: 4ms, max: 565ms, s.d.: 205ms]│
└─────────────────────────────────────────────────────────────────┘
```

## 🧪 Scripts de Prueba Alternativos

### Script de Flujo Completo
```bash
# Ejecuta el script que maneja todo el flujo con variables dinámicas
node run-postman-tests.cjs
```

### Script de Verificación Individual
```bash
# Ejecuta pruebas individuales para debugging
node test-complete-flow.cjs
```

## 🔧 Variables de Entorno Importantes

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `backend_base_url` | `http://localhost:4000` | URL base del backend |
| `supabase_rest_url` | `https://jdmexfawmetmfabpwlfs.supabase.co` | URL de la API de Supabase |
| `supabase_anon_key` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Clave de API de Supabase |
| `vendor_email` | `quintojessy2222@gmail.com` | Email del vendedor de prueba |
| `vendor_password` | `Rulexi700.` | Contraseña del vendedor de prueba |
| `demo_categoria_id` | `a7114981-678c-412e-8648-017f02548872` | ID de categoría de prueba |
| `order_item_id` | `2bf88230-147b-47d0-b99a-b5274ca7e35d` | ID de order item de prueba |

## 📈 Monitoreo de Resultados

### Verificación en Base de Datos
```sql
-- Verificar productos creados
SELECT id, nombre, precio, stock FROM productos 
WHERE nombre LIKE '%Postman%';

-- Verificar estado de order items
SELECT id, enviado FROM order_items 
WHERE id = '2bf88230-147b-47d0-b99a-b5274ca7e35d';
```

## 🔄 Actualización de Colecciones

Para mantener las colecciones actualizadas:

1. **Exporta desde Postman**:
   - File → Export → Collection v2.1

2. **Verifica variables**:
   - Asegúrate de que `supabase_anon_key` tenga el valor real
   - Confirma que los IDs de prueba sean válidos

3. **Valida scripts de test**:
   - Revisa que los assertions sean correctos
   - Asegúrate de manejar errores apropiadamente

## 🆘 Soporte y Contacto

Si encuentras problemas:

1. Verifica que el backend esté corriendo
2. Confirma las credenciales de prueba
3. Revisa los logs del backend para errores específicos
4. Asegúrate de tener conexión a internet para las llamadas a Supabase

Para soporte adicional, contacta al equipo de desarrollo.