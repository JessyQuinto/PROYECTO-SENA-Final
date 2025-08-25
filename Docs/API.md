# API Reference - Tesoros Chocó

## 🚀 Visión General de la API

La API de **Tesoros Chocó** está diseñada como una capa de abstracción entre el frontend y Supabase, proporcionando endpoints RESTful para operaciones complejas, validación de datos y lógica de negocio adicional. La API complementa las operaciones directas del frontend con Supabase para casos que requieren procesamiento adicional.

## 🔧 Configuración Base

### URL Base
```
Desarrollo: http://localhost:3001
Producción: https://api.tesoroschoco.com
```

### Headers Requeridos
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN> (para endpoints protegidos)
```

### Respuestas Estándar
```typescript
// Respuesta exitosa
{
  "success": true,
  "data": {...},
  "message": "Operación exitosa"
}

// Respuesta de error
{
  "success": false,
  "error": "Descripción del error",
  "details": {...} // Detalles adicionales del error
}
```

## 📊 Endpoints de la API

### 1. Health Check

#### GET `/`
**Descripción**: Redirige a `/health`
**Respuesta**: Redirección HTTP 302

#### GET `/health`
**Descripción**: Verifica el estado del servicio
**Autenticación**: No requerida
**Respuesta**:
```json
{
  "ok": true,
  "service": "backend-demo",
  "ts": "2024-01-15T10:30:00.000Z"
}
```

### 2. Autenticación

#### POST `/auth/post-signup`
**Descripción**: Crea perfil de usuario después del registro en Supabase
**Autenticación**: No requerida (se valida internamente)
**Body**:
```typescript
{
  user_id: string;        // UUID del usuario en Supabase
  email: string;          // Email del usuario
  role: 'comprador' | 'vendedor' | 'admin';  // Rol del usuario
  nombre?: string;        // Nombre completo (opcional)
}
```

**Validación**:
- `user_id`: Debe ser un UUID válido
- `email`: Debe ser un email válido
- `role`: Debe ser uno de los roles permitidos
- `nombre`: Opcional, máximo 100 caracteres

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "usuario@example.com",
    "role": "comprador",
    "nombre_completo": "Usuario Ejemplo",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Perfil de usuario creado exitosamente"
}
```

**Respuesta de Error** (400):
```json
{
  "success": false,
  "error": "Payload inválido",
  "details": {
    "fieldErrors": {
      "email": ["Email inválido"],
      "role": ["Rol debe ser comprador, vendedor o admin"]
    }
  }
}
```

**Flujo de Implementación**:
1. Valida payload con Zod
2. Crea perfil en tabla `users` de Supabase
3. Actualiza `app_metadata.role` en Supabase Auth
4. Retorna confirmación de creación

### 3. Pagos

#### POST `/payments/simulate`
**Descripción**: Simula el procesamiento de un pago
**Autenticación**: No requerida
**Body**:
```typescript
{
  order_id: string;       // ID de la orden
  approved?: boolean;     // Si el pago debe ser aprobado (default: true)
}
```

**Validación**:
- `order_id`: Requerido
- `approved`: Opcional, boolean

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "message": "Pago procesado exitosamente",
  "order_id": "ord_123456789"
}
```

**Respuesta de Error** (400):
```json
{
  "success": false,
  "message": "Pago rechazado",
  "order_id": "ord_123456789"
}
```

**Casos de Uso**:
- Simulación de pagos exitosos para testing
- Simulación de pagos rechazados para validar flujos de error
- Integración con sistemas de pago reales en el futuro

## 🔐 Endpoints Futuros Planificados

### 4. Gestión de Usuarios

#### GET `/api/users/profile`
**Descripción**: Obtiene perfil del usuario autenticado
**Autenticación**: Requerida (JWT)
**Respuesta**:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "usuario@example.com",
    "role": "comprador",
    "nombre_completo": "Usuario Ejemplo",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

#### PUT `/api/users/profile`
**Descripción**: Actualiza perfil del usuario autenticado
**Autenticación**: Requerida (JWT)
**Body**:
```typescript
{
  nombre_completo?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  codigo_postal?: string;
}
```

### 5. Gestión de Productos

#### POST `/api/products`
**Descripción**: Crea un nuevo producto
**Autenticación**: Requerida (JWT con rol vendedor)
**Body**:
```typescript
{
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria_id: string;
  imagen_url: string;
  materiales?: string[];
  tecnicas?: string[];
  origen?: string;
}
```

#### PUT `/api/products/:id`
**Descripción**: Actualiza un producto existente
**Autenticación**: Requerida (JWT con rol vendedor)
**Parámetros**: `id` - UUID del producto
**Body**: Mismo esquema que POST, campos opcionales

#### DELETE `/api/products/:id`
**Descripción**: Elimina un producto
**Autenticación**: Requerida (JWT con rol vendedor)
**Parámetros**: `id` - UUID del producto

### 6. Gestión de Pedidos

#### GET `/api/orders`
**Descripción**: Lista pedidos del usuario autenticado
**Autenticación**: Requerida (JWT)
**Query Parameters**:
- `status`: Filtro por estado (pendiente, procesando, enviado, entregado)
- `page`: Número de página para paginación
- `limit`: Límite de resultados por página

#### GET `/api/orders/:id`
**Descripción**: Obtiene detalles de un pedido específico
**Autenticación**: Requerida (JWT)
**Parámetros**: `id` - UUID del pedido

#### PUT `/api/orders/:id/status`
**Descripción**: Actualiza el estado de un pedido
**Autenticación**: Requerida (JWT con rol vendedor)
**Parámetros**: `id` - UUID del pedido
**Body**:
```typescript
{
  status: 'pendiente' | 'procesando' | 'enviado' | 'entregado' | 'cancelado';
  tracking_number?: string;
  comentarios?: string;
}
```

### 7. Categorías

#### GET `/api/categories`
**Descripción**: Lista todas las categorías disponibles
**Autenticación**: No requerida
**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_123",
      "nombre": "Tejidos",
      "slug": "tejidos",
      "descripcion": "Productos tejidos a mano",
      "imagen_url": "https://...",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### POST `/api/categories`
**Descripción**: Crea una nueva categoría
**Autenticación**: Requerida (JWT con rol admin)
**Body**:
```typescript
{
  nombre: string;
  slug: string;
  descripcion: string;
  imagen_url?: string;
}
```

### 8. Evaluaciones

#### POST `/api/reviews`
**Descripción**: Crea una evaluación de producto
**Autenticación**: Requerida (JWT con rol comprador)
**Body**:
```typescript
{
  producto_id: string;
  order_item_id: string;
  puntuacion: number;  // 1-5
  comentario: string;
}
```

#### GET `/api/products/:id/reviews`
**Descripción**: Lista evaluaciones de un producto
**Autenticación**: No requerida
**Query Parameters**:
- `page`: Número de página
- `limit`: Límite de resultados
- `sort`: Ordenamiento (reciente, puntuacion)

## 🛡️ Seguridad y Validación

### 1. Autenticación JWT

**Estructura del Token**:
```typescript
{
  "sub": "user_uuid",
  "email": "user@example.com",
  "role": "comprador|vendedor|admin",
  "exp": 1642233600,
  "iat": 1642147200
}
```

**Validación**:
- Verificación de firma del token
- Validación de expiración
- Verificación de rol para endpoints protegidos

### 2. Validación de Esquemas

**Ejemplo de Esquema Zod**:
```typescript
const productSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100, "Nombre muy largo"),
  descripcion: z.string().min(10, "Descripción muy corta").max(1000, "Descripción muy larga"),
  precio: z.number().positive("Precio debe ser positivo").max(1000000, "Precio muy alto"),
  stock: z.number().int("Stock debe ser entero").min(0, "Stock no puede ser negativo"),
  categoria_id: z.string().uuid("ID de categoría inválido"),
  imagen_url: z.string().url("URL de imagen inválida"),
  materiales: z.array(z.string()).optional(),
  tecnicas: z.array(z.string()).optional(),
  origen: z.string().max(100, "Origen muy largo").optional()
});
```

### 3. Rate Limiting

**Configuración por Endpoint**:
```typescript
const rateLimitConfig = {
  '/auth/*': { windowMs: 15 * 60 * 1000, max: 5 },      // 5 requests por 15 min
  '/api/products': { windowMs: 15 * 60 * 1000, max: 10 }, // 10 requests por 15 min
  '/api/orders': { windowMs: 15 * 60 * 1000, max: 20 },   // 20 requests por 15 min
  'default': { windowMs: 15 * 60 * 1000, max: 100 }       // 100 requests por 15 min
};
```

## 📊 Códigos de Estado HTTP

### Respuestas Exitosas
- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado exitosamente
- **204 No Content**: Operación exitosa sin contenido

### Errores del Cliente
- **400 Bad Request**: Datos inválidos o malformados
- **401 Unauthorized**: Autenticación requerida
- **403 Forbidden**: Acceso denegado (permisos insuficientes)
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: Conflicto con estado actual del recurso
- **422 Unprocessable Entity**: Datos válidos pero no procesables

### Errores del Servidor
- **500 Internal Server Error**: Error interno del servidor
- **502 Bad Gateway**: Error en comunicación con Supabase
- **503 Service Unavailable**: Servicio temporalmente no disponible

## 🔄 Manejo de Errores

### 1. Estructura de Error Estándar

```typescript
interface ApiError {
  success: false;
  error: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
    globalErrors?: string[];
    timestamp?: string;
    requestId?: string;
  };
}
```

### 2. Ejemplos de Errores

**Error de Validación**:
```json
{
  "success": false,
  "error": "Datos inválidos",
  "details": {
    "fieldErrors": {
      "email": ["Email inválido"],
      "precio": ["Precio debe ser positivo"]
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_123456789"
  }
}
```

**Error de Autenticación**:
```json
{
  "success": false,
  "error": "No autorizado",
  "details": {
    "globalErrors": ["Token expirado o inválido"],
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_123456789"
  }
}
```

**Error de Permisos**:
```json
{
  "success": false,
  "error": "Acceso denegado",
  "details": {
    "globalErrors": ["Rol insuficiente para esta operación"],
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_123456789"
  }
}
```

## 📝 Ejemplos de Uso

### 1. Crear Perfil de Usuario

```bash
curl -X POST http://localhost:3001/auth/post-signup \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "artesano@choco.com",
    "role": "vendedor",
    "nombre": "María González"
  }'
```

### 2. Simular Pago

```bash
curl -X POST http://localhost:3001/payments/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ord_123456789",
    "approved": true
  }'
```

### 3. Verificar Estado del Servicio

```bash
curl http://localhost:3001/health
```

## 🔮 Futuras Mejoras de la API

### 1. Documentación Interactiva
- **Swagger/OpenAPI**: Especificación completa de la API
- **Postman Collection**: Colección de requests para testing
- **API Explorer**: Interfaz web para probar endpoints

### 2. Funcionalidades Avanzadas
- **Webhooks**: Notificaciones de eventos en tiempo real
- **GraphQL**: Query language alternativo para consultas complejas
- **Bulk Operations**: Operaciones en lote para múltiples recursos
- **Search API**: Búsqueda avanzada con filtros y ordenamiento

### 3. Monitoreo y Analytics
- **API Metrics**: Métricas de uso y performance
- **Request Logging**: Logs detallados de todas las requests
- **Performance Monitoring**: Monitoreo de latencia y throughput
- **Error Tracking**: Seguimiento y análisis de errores

---

Esta documentación de la API proporciona una referencia completa para desarrolladores que necesiten integrar con el backend de Tesoros Chocó, incluyendo todos los endpoints disponibles, ejemplos de uso y mejores prácticas de implementación.
