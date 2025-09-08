# API Reference - Tesoros Chocó (Actualizada)

## 🚀 Visión General de la API

La API de **Tesoros Chocó** está diseñada como una capa de abstracción entre el frontend y Supabase, proporcionando endpoints RESTful para operaciones complejas, validación de datos y lógica de negocio adicional.

## ✅ ESTADO ACTUAL - COMPLETA Y FUNCIONAL
- **Última actualización**: 07 Septiembre 2025
- **Tests ejecutados**: ✅ PASADOS (100% funcional)
- **Endpoints funcionales**: Todos los endpoints implementados y verificados

## 🔧 Configuración Base

### URL Base
```
Desarrollo: http://localhost:4000
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
  "ok": true,
  "data": {...},
  "message": "Operación exitosa"
}

// Respuesta de error
{
  "ok": false,
  "error": "Descripción del error",
  "detail": {...} // Detalles adicionales del error (Zod validation)
}
```

## 📊 Endpoints de la API

### ✅ 1. Health Check

#### GET `/` 
**Descripción**: Redirige a `/health`
**Autenticación**: No requerida
**Respuesta**: Redirección HTTP 302

#### GET `/health`
**Descripción**: Verifica el estado del servicio y obtiene información de sistema
**Autenticación**: No requerida
**Respuesta**:
```json
{
  "ok": true,
  "service": "backend-demo",
  "ts": "2024-09-02T16:30:00.000Z"
}
```

### ✅ 2. Autenticación

#### POST `/auth/post-signup`
**Descripción**: Crea/actualiza perfil de usuario después del registro en Supabase
**Autenticación**: No requerida (se valida internamente)
**Body**:
```typescript
{
  user_id: string;        // UUID del usuario en Supabase (DEBE EXISTIR)
  email: string;          // Email del usuario
  role: 'comprador' | 'vendedor' | 'admin';  // Rol del usuario
  nombre?: string;        // Nombre completo (opcional)
}
```

**Respuesta Exitosa** (200):
```json
{
  "ok": true
}
```

### ✅ 3. Gestión de Usuarios (Admin)

#### POST `/admin/users/:id/role`
**Descripción**: Actualiza el rol de un usuario
**Autenticación**: Requerida (rol admin)
**Body**:
```typescript
{
  role: 'comprador' | 'vendedor' | 'admin'
}
```

#### POST `/admin/create-user`
**Descripción**: Crea un nuevo usuario con rol específico
**Autenticación**: Requerida (rol admin)
**Body**:
```typescript
{
  email: string;
  password: string;
  role: 'comprador' | 'vendedor' | 'admin';
  nombre?: string;
}
```

#### PUT `/users/:id`
**Descripción**: Actualiza información de un usuario
**Autenticación**: Requerida (rol admin)
**Body**:
```typescript
{
  vendedor_estado?: 'pendiente' | 'aprobado' | 'rechazado';
  bloqueado?: boolean;
  role?: 'comprador' | 'vendedor' | 'admin';
}
```

### ✅ 4. Gestión de Productos (Vendedor)

#### POST `/productos`
**Descripción**: Crea un nuevo producto
**Autenticación**: Requerida (rol vendedor aprobado)
**Body**:
```typescript
{
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria_id?: string;
  imagen_url?: string;
}
```

#### PUT `/productos/:id`
**Descripción**: Actualiza un producto existente
**Autenticación**: Requerida (rol vendedor aprobado y dueño del producto)
**Body**:
```typescript
{
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  categoria_id?: string;
  imagen_url?: string;
  estado?: 'activo' | 'inactivo';
}
```

### ✅ 5. Sistema de Pedidos

#### POST `/rpc/crear_pedido`
**Descripción**: Crea un nuevo pedido
**Autenticación**: Requerida (rol comprador)
**Body**:
```typescript
{
  items: Array<{
    producto_id: string;
    cantidad: number;
  }>;
  shipping?: {
    nombre: string;
    direccion: string;
    ciudad: string;
    telefono: string;
  };
  payment?: {
    metodo: 'tarjeta' | 'contraentrega';
    tarjeta?: {
      numero: string;
      nombre: string;
      expiracion: string; // MM/YY
      cvv: string;
    }
  };
  simulate_payment?: boolean;
}
```

#### POST `/orders/:id/cancel`
**Descripción**: Cancela un pedido
**Autenticación**: Requerida (usuario autenticado)
**Body**: Vacío

#### POST `/orders/:id/delivered`
**Descripción**: Marca un pedido como entregado
**Autenticación**: Requerida (usuario autenticado)
**Body**: Vacío

#### POST `/order-items/:id/shipped`
**Descripción**: Marca un ítem de pedido como enviado
**Autenticación**: Requerida (usuario autenticado)
**Body**: Vacío

### ✅ 6. Sistema de Evaluaciones/Reseñas

#### POST `/evaluaciones`
**Descripción**: Crea una nueva evaluación de un producto
**Autenticación**: Requerida (rol comprador)
**Body**:
```typescript
{
  order_item_id: string;
  puntuacion: number; // 1-5
  comentario?: string;
}
```

#### GET `/productos/:id/evaluaciones`
**Descripción**: Obtiene todas las evaluaciones de un producto
**Autenticación**: No requerida
**Respuesta**:
```typescript
Array<{
  id: string;
  puntuacion: number;
  comentario: string | null;
  created_at: string;
  comprador_nombre: string;
}>
```

#### GET `/vendedores/:id/calificacion`
**Descripción**: Obtiene la calificación promedio de un vendedor
**Autenticación**: No requerida
**Respuesta**:
```json
{
  "promedio": number, // 0-5
  "total": number     // cantidad de evaluaciones
}
```

### ✅ 7. Reportes

#### GET `/reportes/ventas/vendedor`
**Descripción**: Obtiene reporte de ventas del vendedor autenticado
**Autenticación**: Requerida (rol vendedor aprobado)
**Query Parameters**:
- `periodo`: 'dia' | 'semana' | 'mes' | 'anio'
**Respuesta**:
```json
{
  "resumen": {
    "total_ventas": number,
    "total_productos": number,
    "productos_unicos": number,
    "periodo": {
      "inicio": string,
      "fin": string
    }
  },
  "ventas_por_dia": Record<string, { ventas: number; productos: number }>,
  "detalles": Array<{
    "producto": string,
    "cantidad": number,
    "precio_unitario": number,
    "subtotal": number,
    "fecha": string
  }>
}
```

#### GET `/reportes/productos/top`
**Descripción**: Obtiene los productos más vendidos
**Autenticación**: Requerida (rol admin)
**Query Parameters**:
- `limite`: number (default: 10)
**Respuesta**: Array de productos con sus ventas

#### GET `/reportes/tendencias/vendedor/:id`
**Descripción**: Obtiene las tendencias de ventas de un vendedor específico
**Autenticación**: Requerida (rol admin)
**Respuesta**:
```json
{
  "vendedor": {
    "id": string,
    "email": string,
    "nombre": string
  },
  "tendencias_mensuales": Array<{
    "mes": string, // YYYY-MM
    "total_ventas": number,
    "total_productos": number
  }>
}
```

### ✅ 8. Pagos

#### POST `/payments/simulate`
**Descripción**: Simula el procesamiento de un pago
**Autenticación**: No requerida
**Body**:
```typescript
{
  order_id: string;
  approved: boolean;
}
```

## 🔐 Middlewares de Autenticación

La API utiliza middlewares consolidados para la autenticación:

### `authenticate(options)`
**Descripción**: Middleware de autenticación parametrizable
**Parámetros**:
- `role`: 'admin' | 'vendedor' | 'comprador' (opcional)
- `vendedorEstado`: 'aprobado' (opcional)
- `allowBlocked`: boolean (opcional, default: false)

**Ejemplos de uso**:
```javascript
// Cualquier usuario autenticado
authenticate()

// Solo administradores
authenticate({ role: 'admin' })

// Solo vendedores aprobados
authenticate({ role: 'vendedor', vendedorEstado: 'aprobado' })

// Compradores (bloqueados permitidos)
authenticate({ role: 'comprador', allowBlocked: true })
```

## 🔄 Funcionalidades Especiales

### Sistema de Notificaciones
La API incluye funciones edge para notificaciones automáticas:
- **notify-low-stock**: Alertas de stock bajo
- **notify-evaluation**: Notificaciones de nuevas evaluaciones
- **notify-vendor-status**: Cambios en estado de vendedores
- **order-emails**: Emails de pedidos

### Materialized Views
- **mv_promedio_calificaciones**: Vista materializada para cálculo de promedios de calificaciones

## 🧪 Testing y Desarrollo

### Colección de Postman
- **Nombre**: "Tesoros Chocó - API COMPLETA"
- **Workspace**: Proyecto-Sena
- **Tests automatizados**: Incluidos en cada request

## 📋 Notas Finales

- **Documentación actualizada**: 07 Septiembre 2025
- **Tests automatizados**: Ejecutados y verificados en Postman
- **Base de datos**: Conectada y funcionando con Supabase
- **Estado del proyecto**: API completamente funcional

Para reportar issues o solicitar nuevos endpoints, consulta la documentación del proyecto o contacta al equipo de desarrollo.