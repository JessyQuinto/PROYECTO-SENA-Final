# 📋 Documentación de Pruebas de API con Postman

## 🎯 Introducción

Este documento describe las colecciones de Postman creadas para probar todas las funcionalidades de la plataforma **Tesoros Chocó**. Las pruebas están organizadas por rol de usuario y cubren flujos completos de autenticación, gestión de datos y operaciones de negocio.

## 📚 Colecciones Disponibles

### 🔗 Enlaces Públicos

- **👨‍💼 Administrador**: [Tesoros Chocó - Administrador](https://www.postman.com/bold-zodiac-382577/workspace/tesoros-choco/collection/13226867-e1af0bd7-a37c-4674-9089-be540313cdf1?action=share&source=copy-link&creator=13226867)
- **🎨 Vendedor**: [Tesoros Chocó - Vendedor](https://www.postman.com/bold-zodiac-382577/workspace/tesoros-choco/collection/13226867-b84cdda9-e50f-4590-89ee-4e8febd921a8?action=share&source=copy-link&creator=13226867)
- **🛍️ Comprador**: [Tesoros Chocó - Comprador](https://www.postman.com/bold-zodiac-382577/workspace/tesoros-choco/collection/13226867-1355fb2b-b951-4c75-8d65-53222eb089ec?action=share&source=copy-link&creator=13226867)

---

## 🏗️ Configuración Inicial

### 📋 Requisitos Previos

1. **Postman Desktop** o **Postman Web** instalado
2. Acceso a las URLs públicas de las colecciones
3. Clave anónima de Supabase para configurar variables

### ⚙️ Configuración de Variables

Cada colección requiere la siguiente variable configurada:

```
vault:supabase-anon-api-key = tu_clave_anonima_de_supabase
```

**Para configurar:**
1. Importar cualquier colección
2. Ir a Variables → Manage Variables
3. Agregar la variable `vault:supabase-anon-api-key` con tu clave de Supabase

---

## 👨‍💼 Colección: Administrador

### 📖 Descripción
Pruebas para funcionalidades administrativas del sistema, incluyendo gestión de usuarios, moderación de contenido, y operaciones privilegiadas.

### 🔑 Credenciales
- **Email**: `admin@tesoros-choco.com`
- **Password**: `admin123`

### 📝 Pruebas Incluidas

#### 1. 🔐 Login Administrador
**Propósito**: Autenticación del administrador con extracción automática de JWT.

**Método**: `POST`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/auth/v1/token?grant_type=password`

**Headers**:
```
Content-Type: application/json
apikey: {{vault:supabase-anon-api-key}}
```

**Body**:
```json
{
  "email": "admin@tesoros-choco.com",
  "password": "admin123"
}
```

**Validaciones**:
- ✅ Status 200
- ✅ Respuesta contiene `access_token`
- ✅ Token se guarda automáticamente en `authToken`
- ✅ Decodificación JWT extrae `adminUserId` y `adminEmail`

**Variables Generadas**:
- `authToken`: Token JWT para autenticación
- `adminUserId`: ID del usuario administrador
- `adminEmail`: Email del administrador

---

#### 2. ✅ Health Check Backend
**Propósito**: Verificar que el backend esté funcionando correctamente.

**Método**: `GET`  
**URL**: `https://marketplace-backend-prod.azurewebsites.net/health`

**Validaciones**:
- ✅ Status 200
- ✅ Respuesta contiene `ok: true`

---

#### 3. 👥 Obtener Todos los Usuarios
**Propósito**: Listar todos los usuarios del sistema para gestión administrativa.

**Método**: `GET`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/users?select=*`

**Headers**:
```
apikey: {{vault:supabase-anon-api-key}}
Authorization: Bearer {{authToken}}
Accept: application/json
Content-Type: application/json
```

**Prerequisitos**: Debe ejecutarse después del login.

**Validaciones**:
- ✅ Status 200
- ✅ Respuesta es un array
- ✅ Captura IDs de vendedores y compradores para pruebas posteriores

**Variables Generadas**:
- `testVendorId`: ID de un vendedor para pruebas
- `testCompradorId`: ID de un comprador para pruebas

---

#### 4. 📂 Obtener Categorías
**Propósito**: Verificar acceso a catálogo de categorías.

**Método**: `GET`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/categorias?select=*`

**Headers**:
```
apikey: {{vault:supabase-anon-api-key}}
Authorization: Bearer {{authToken}}
Accept: application/json
```

**Validaciones**:
- ✅ Status 200
- ✅ Respuesta es un array de categorías
- ✅ Guarda ID de primera categoría

**Variables Generadas**:
- `testCategoryId`: ID de categoría para pruebas

---

#### 5. 🛍️ Obtener Productos
**Propósito**: Acceder al catálogo completo de productos.

**Método**: `GET`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/productos?select=*`

**Headers**:
```
apikey: {{vault:supabase-anon-api-key}}
Authorization: Bearer {{authToken}}
Accept: application/json
```

**Validaciones**:
- ✅ Status 200
- ✅ Array de productos
- ✅ Guarda ID del primer producto

**Variables Generadas**:
- `testProductId`: ID de producto para pruebas

---

#### 6. 📦 Obtener Órdenes
**Propósito**: Visualizar todas las órdenes del sistema.

**Método**: `GET`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/orders?select=*`

**Headers**:
```
apikey: {{vault:supabase-anon-api-key}}
Authorization: Bearer {{authToken}}
Accept: application/json
```

**Validaciones**:
- ✅ Status 200
- ✅ Array de órdenes
- ✅ Logs informativos del estado de órdenes

**Variables Generadas**:
- `testOrderId`: ID de orden para pruebas

---

#### 7. ✅ Aprobar Vendedor Pendiente
**Propósito**: Aprobar un vendedor que está en estado pendiente.

**Método**: `PATCH`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/users?id=eq.{{testVendorId}}`

**Headers**:
```
Content-Type: application/json
apikey: {{vault:supabase-anon-api-key}}
Authorization: Bearer {{authToken}}
Prefer: return=minimal
```

**Body**:
```json
{
  "vendedor_estado": "aprobado"
}
```

**Prerequisitos**: Debe ejecutarse después de obtener usuarios.

**Validaciones**:
- ✅ Status 204 (o 200 como alternativa)
- ✅ Operación exitosa

---

#### 8. ❌ Rechazar Vendedor Pendiente
**Propósito**: Rechazar una solicitud de vendedor.

**Método**: `PATCH`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/users?id=eq.{{testVendorId}}`

**Headers**:
```
Content-Type: application/json
apikey: {{vault:supabase-anon-api-key}}
Authorization: Bearer {{authToken}}
Prefer: return=minimal
```

**Body**:
```json
{
  "vendedor_estado": "rechazado"
}
```

**Validaciones**:
- ✅ Status 204 (o 200 como alternativa)
- ✅ Estado actualizado correctamente

---

#### 9. 🚫 Bloquear Usuario
**Propósito**: Bloquear acceso de un usuario al sistema.

**Método**: `PATCH`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/users?id=eq.{{testCompradorId}}`

**Headers**:
```
Content-Type: application/json
apikey: {{vault:supabase-anon-api-key}}
Authorization: Bearer {{authToken}}
Prefer: return=minimal
```

**Body**:
```json
{
  "bloqueado": true
}
```

**Validaciones**:
- ✅ Status 204 (o 200 como alternativa)
- ✅ Usuario bloqueado exitosamente

---

#### 10. 🔓 Desbloquear Usuario
**Propósito**: Restaurar acceso de un usuario previamente bloqueado.

**Método**: `PATCH`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/users?id=eq.{{testCompradorId}}`

**Headers**:
```
Content-Type: application/json
apikey: {{vault:supabase-anon-api-key}}
Authorization: Bearer {{authToken}}
Prefer: return=minimal
```

**Body**:
```json
{
  "bloqueado": false
}
```

**Validaciones**:
- ✅ Status 204 (o 200 como alternativa)
- ✅ Usuario desbloqueado exitosamente

---

## 🎨 Colección: Vendedor

### 📖 Descripción
Pruebas para funcionalidades específicas de vendedores, incluyendo gestión de productos, visualización de ventas y administración de inventario.

### 🔑 Credenciales
- **Email**: `quintojessy2222@gmail.com`
- **Password**: `Rulexi700.`

### 📝 Pruebas Incluidas

#### 1. 🔐 Login Vendedor
**Propósito**: Autenticación del vendedor con captura automática de datos.

**Método**: `POST`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/auth/v1/token?grant_type=password`

**Headers**:
```
Content-Type: application/json
apikey: {{vault:supabase-anon-api-key}}
```

**Body**:
```json
{
  "email": "quintojessy2222@gmail.com",
  "password": "Rulexi700."
}
```

**Validaciones**:
- ✅ Status 200
- ✅ Token JWT extraído y guardado
- ✅ User ID del vendedor capturado

**Variables Generadas**:
- `authToken`: Token de autenticación
- `vendorUserId`: ID del vendedor
- `vendorEmail`: Email del vendedor

---

#### 2. ✅ Health Check
**Propósito**: Verificar conectividad con el backend.

**Método**: `GET`  
**URL**: `https://marketplace-backend-prod.azurewebsites.net/health`

**Validaciones**: Status 200 esperado.

---

#### 3. 🛍️ Mis Productos
**Propósito**: Listar productos del vendedor autenticado.

**Método**: `GET`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/productos?select=*&vendedor_id=eq.{{vendorUserId}}`

**Headers**:
```
apikey: {{vault:supabase-anon-api-key}}
Authorization: Bearer {{authToken}}
```

**Prerequisitos**: Login exitoso.

**Validaciones**:
- ✅ Status 200
- ✅ Lista de productos del vendedor
- ✅ Filtrado correcto por `vendedor_id`

---

#### 4. ➕ Crear Producto (Supabase)
**Propósito**: Crear un nuevo producto en el catálogo.

**Método**: `POST`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/productos`

**Headers**:
```
Content-Type: application/json
apikey: {{vault:supabase-anon-api-key}}
Authorization: Bearer {{authToken}}
Prefer: return=representation
```

**Body**:
```json
{
  "nombre": "Artesanía Chocó {{$randomInt}}",
  "descripcion": "Hermosa artesanía tradicional del Chocó elaborada con técnicas ancestrales",
  "precio": 85000,
  "stock": 3,
  "categoria_id": "a7114981-678c-412e-8648-017f02548872",
  "vendedor_id": "{{vendorUserId}}",
  "imagen_url": "https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Artesania+Choco"
}
```

**Prerequisitos**: Login y obtención de `vendorUserId`.

**Validaciones**:
- ✅ Status 201 (created)
- ✅ Producto creado con datos válidos
- ✅ Asignación correcta al vendedor

---

#### 5. 💰 Mis Ventas
**Propósito**: Visualizar ventas realizadas por el vendedor.

**Método**: `GET`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/order_items?select=*,orders(*),productos!inner(*)&productos.vendedor_id=eq.{{vendorUserId}}`

**Headers**:
```
apikey: {{vault:supabase-anon-api-key}}
Authorization: Bearer {{authToken}}
```

**Prerequisitos**: Login exitoso.

**Validaciones**:
- ✅ Status 200
- ✅ Datos de ventas con relaciones
- ✅ Filtrado por productos del vendedor

---

## 🛍️ Colección: Comprador

### 📖 Descripción
Pruebas para la experiencia del comprador, incluyendo navegación de catálogo, gestión de carrito y proceso de compra.

### 🔑 Credenciales
- **Email**: `marianareyesgonzalez4@gmail.com`
- **Password**: `Rulexi700.`

### 📝 Pruebas Incluidas

#### 1. 🔐 Login Comprador
**Propósito**: Autenticación del comprador con configuración automática.

**Método**: `POST`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/auth/v1/token?grant_type=password`

**Headers**:
```
Content-Type: application/json
apikey: {{vault:supabase-anon-api-key}}
```

**Body**:
```json
{
  "email": "marianareyesgonzalez4@gmail.com",
  "password": "Rulexi700."
}
```

**Validaciones**:
- ✅ Status 200
- ✅ Token capturado automáticamente
- ✅ ID de comprador extraído del JWT

**Variables Generadas**:
- `authToken`: Token de autenticación
- `compradorUserId`: ID del comprador
- `compradorEmail`: Email del comprador

---

#### 2. ✅ Health Check Backend
**Propósito**: Verificar estado del backend.

**Método**: `GET`  
**URL**: `https://marketplace-backend-prod.azurewebsites.net/health`

**Validaciones**:
- ✅ Status 200
- ✅ Backend operativo
- ✅ Logs informativos del servicio

---

#### 3. 🛍️ Obtener Productos Disponibles
**Propósito**: Navegar catálogo con productos en stock.

**Método**: `GET`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/productos?select=*&stock=gt.0&estado=eq.activo`

**Headers**:
```
apikey: {{vault:supabase-anon-api-key}}
Authorization: Bearer {{authToken}}
Accept: application/json
```

**Prerequisitos**: Login exitoso.

**Validaciones**:
- ✅ Status 200
- ✅ Solo productos con stock > 0
- ✅ Solo productos activos
- ✅ Captura producto disponible para compra

**Variables Generadas**:
- `testProductId`: ID de producto general
- `availableProductId`: ID de producto disponible para compra

---

#### 4. 📂 Obtener Categorías
**Propósito**: Acceder a clasificación de productos.

**Método**: `GET`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/categorias?select=*`

**Headers**:
```
apikey: {{vault:supabase-anon-api-key}}
Authorization: Bearer {{authToken}}
Accept: application/json
```

**Validaciones**:
- ✅ Status 200
- ✅ Lista completa de categorías
- ✅ Información detallada de cada categoría

**Variables Generadas**:
- `testCategoryId`: ID de categoría para pruebas

---

#### 5. 📦 Obtener Mis Órdenes
**Propósito**: Visualizar historial de compras del usuario.

**Método**: `GET`  
**URL**: `https://jdmexfawmetmfabpwlfs.supabase.co/rest/v1/orders?select=*&comprador_id=eq.{{compradorUserId}}`

**Headers**:
```
apikey: {{vault:supabase-anon-api-key}}
Authorization: Bearer {{authToken}}
Accept: application/json
```

**Prerequisitos**: Login exitoso.

**Validaciones**:
- ✅ Status 200
- ✅ Solo órdenes del comprador autenticado
- ✅ Información completa de cada orden
- ✅ Estados y totales correctos

**Variables Generadas**:
- `testOrderId`: ID de orden para pruebas adicionales

---

### 🛒 Pruebas de Carrito (Simuladas)

Las siguientes pruebas simulan la funcionalidad del carrito de compras, ya que el carrito real está implementado en el frontend usando localStorage:

#### 6. 👤 Obtener Mi Perfil
**Propósito**: Verificar información del perfil del comprador.

#### 7. 🛍️ Agregar Producto al Carrito
**Propósito**: Simular agregar productos al carrito.

#### 8. 📝 Actualizar Cantidad en Carrito
**Propósito**: Simular modificación de cantidades.

#### 9. 🗑️ Eliminar Producto del Carrito
**Propósito**: Simular eliminación de productos.

#### 10. 🛍️ Ver Carrito Actual
**Propósito**: Simular visualización del estado del carrito.

---

## 🚀 Guía de Ejecución

### 🔄 Orden Recomendado de Ejecución

#### Para Administrador:
1. Login Administrador
2. Health Check Backend
3. Obtener Todos los Usuarios
4. Obtener Categorías
5. Obtener Productos
6. Obtener Órdenes
7. Aprobar Vendedor Pendiente
8. Rechazar Vendedor Pendiente
9. Bloquear Usuario
10. Desbloquear Usuario

#### Para Vendedor:
1. Login Vendedor
2. Health Check
3. Mis Productos
4. Crear Producto
5. Mis Ventas

#### Para Comprador:
1. Login Comprador
2. Health Check Backend
3. Obtener Productos Disponibles
4. Obtener Categorías
5. Obtener Mis Órdenes
6. [Pruebas de carrito simuladas]

### ⚡ Ejecución Automatizada

**Opción 1: Collection Runner**
1. Seleccionar colección
2. Hacer clic en "Run Collection"
3. Configurar orden de ejecución
4. Ejecutar todas las pruebas secuencialmente

**Opción 2: Ejecución Individual**
1. Ejecutar Login primero (obligatorio)
2. Ejecutar pruebas en cualquier orden
3. Monitorear logs en consola de Postman

### 📊 Interpretación de Resultados

#### ✅ Indicadores de Éxito:
- Status codes correctos (200, 201, 204)
- Tests pasando en verde
- Logs informativos en consola
- Variables pobladas automáticamente

#### ❌ Indicadores de Problemas:
- Status codes de error (400, 401, 403, 500)
- Tests fallando en rojo
- Variables no capturadas
- Errores en pre-request scripts

### 🐛 Solución de Problemas Comunes

#### 🔑 Error de Autenticación (401)
**Causa**: Token expirado o no configurado
**Solución**: 
1. Ejecutar login nuevamente
2. Verificar variable `vault:supabase-anon-api-key`

#### 🔧 Variable No Definida
**Causa**: Prerequisitos no ejecutados
**Solución**: Ejecutar pruebas en orden correcto

#### 🌐 Error de Conectividad (503/504)
**Causa**: Servicios temporalmente no disponibles
**Solución**: Esperar y reintentar

#### 🗃️ Error de Base de Datos (400)
**Causa**: Datos inválidos o campos incorrectos
**Solución**: Verificar estructura de datos en body

---

## 📈 Métricas y Monitoreo

### 📊 Información Capturada

Cada prueba captura:
- ⏱️ **Tiempo de respuesta**
- 📦 **Tamaño de respuesta**
- ✅ **Estado de tests**
- 📝 **Logs detallados**
- 🔄 **Variables generadas**

### 📋 Reportes Disponibles

- **Test Results**: Resumen de éxito/fallo por prueba
- **Console Logs**: Información detallada de ejecución
- **Response Data**: Datos retornados por cada endpoint
- **Variable Tracking**: Estado de variables entre pruebas

---

## 🤝 Contribución y Mantenimiento

### 📝 Actualizaciones de Colecciones

Para mantener las colecciones actualizadas:

1. **Modificar localmente** en Postman
2. **Exportar colección** actualizada
3. **Actualizar enlaces públicos** si es necesario
4. **Actualizar esta documentación**

### 🔄 Versionado

Las colecciones siguen el patrón:
- `v1.0`: Versión inicial
- `v1.1`: Correcciones menores
- `v2.0`: Cambios importantes en API

### 📞 Soporte

Para problemas con las pruebas:
1. Verificar documentación de solución de problemas
2. Revisar logs de consola en Postman
3. Contactar equipo de desarrollo

---

**Desarrollado con ❤️ para garantizar la calidad de Tesoros Chocó**