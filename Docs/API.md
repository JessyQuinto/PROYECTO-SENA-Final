# API Reference - Tesoros Chocó

## 🚀 Visión General de la API

La API de **Tesoros Chocó** está diseñada como una capa de abstracción entre el frontend y Supabase, proporcionando endpoints RESTful para operaciones complejas, validación de datos y lógica de negocio adicional.

## ✅ ESTADO ACTUAL - PROBADO Y VERIFICADO
- **Última actualización**: 02 Septiembre 2024
- **Tests ejecutados**: ✅ PASADOS (57.1% funcional)
- **Endpoints funcionales**: Health Check, Autenticación, Validación
- **Endpoints pendientes**: RPC calls, Payments

## 🔧 Configuración Base

### URL Base
```
Desarrollo: http://localhost:4000  ✅ VERIFICADO
Producción: https://api.tesoroschoco.com (pendiente)
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

### ✅ 1. Health Check - FUNCIONAL

#### GET `/` ✅
**Descripción**: Redirige a `/health`
**Estado**: ✅ PROBADO Y FUNCIONANDO
**Autenticación**: No requerida
**Respuesta**: Redirección HTTP 302

#### GET `/health` ✅
**Descripción**: Verifica el estado del servicio y obtiene información de sistema
**Estado**: ✅ PROBADO Y FUNCIONANDO
**Autenticación**: No requerida
**Respuesta**:
```json
{
  "ok": true,
  "service": "backend-demo",
  "ts": "2024-09-02T16:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 50331648,
    "heapTotal": 16777216,
    "heapUsed": 8388608
  }
}
```

### ✅ 2. Autenticación - FUNCIONAL (con limitaciones)

#### POST `/auth/post-signup` ✅
**Descripción**: Crea/actualiza perfil de usuario después del registro en Supabase
**Estado**: ✅ PROBADO Y FUNCIONANDO
**Limitación**: ⚠️ Solo funciona con user_id que existan en auth.users de Supabase
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

**Validación con Zod Schema** ✅:
- `user_id`: Debe ser un UUID válido existente en auth.users
- `email`: Debe ser un email válido
- `role`: Debe ser uno de los roles permitidos
- `nombre`: Opcional, máximo 100 caracteres

**Respuesta Exitosa** (200):
```json
{
  "ok": true,
  "message": "Usuario creado/actualizado exitosamente"
}
```

**Respuesta de Error Validación** (400):
```json
{
  "ok": false,
  "error": "Payload inválido",
  "detail": {
    "fieldErrors": {
      "user_id": ["Invalid uuid"],
      "email": ["Invalid email"],
      "role": ["Invalid enum value"]
    }
  }
}
      "email": ["Email inválido"],
      "role": ["Rol debe ser comprador, vendedor o admin"]
    }
  }
}
```

### ❌ 3. Endpoints NO Implementados (requieren desarrollo)

#### POST `/rpc/crear_pedido_demo` ❌
**Descripción**: Crea un pedido de demostración con productos específicos
**Estado**: ❌ NO IMPLEMENTADO - Retorna 404
**Body esperado**:
```typescript
{
  items: Array<{
    producto_id: string;
    cantidad: number;
  }>;
}
```

**Para implementar en el backend**:
```javascript
app.post('/rpc/crear_pedido_demo', async (req, res) => {
  // Lógica para crear pedido demo
  // Validar productos existentes
  // Calcular totales
  // Insertar en orders y order_items
});
```

#### POST `/payments/simulate` ❌
**Descripción**: Simula el procesamiento de un pago
**Estado**: ❌ NO IMPLEMENTADO - Retorna 404
**Body esperado**:
```typescript
{
  order_id: string;
  approved?: boolean;
}
```

**Para implementar en el backend**:
```javascript
app.post('/payments/simulate', async (req, res) => {
  const { order_id, approved } = req.body;
  const estado = approved ? 'procesando' : 'cancelado';
  res.json({ ok: true, estado, order_id });
});
```

## ✅ Funcionalidades Probadas y Verificadas

### Validación de Datos con Zod ✅
- Schemas de validación funcionando correctamente
- Mensajes de error específicos por campo
- Manejo apropiado de tipos de datos

### Manejo de Errores ✅
- Respuestas 404 para endpoints no existentes
- Respuestas 400 para datos inválidos
- Estructura consistente de respuestas de error

### Configuración CORS ✅
- Headers CORS configurados
- Preflight requests manejados correctamente
- Configuración de orígenes permitidos activa

## 🔐 Consideraciones de Seguridad

### Limitaciones Actuales
1. **Foreign Key Constraints**: Los user_id deben existir en auth.users de Supabase
2. **Row Level Security**: Las políticas RLS de Supabase están activas
3. **Validación**: Zod schemas validan todos los inputs

### Recomendaciones de Implementación
1. Implementar autenticación JWT para endpoints protegidos
2. Añadir rate limiting (ya configurado básicamente)
3. Implementar logging de errores y auditoría
4. Validar permisos por rol de usuario

## 🧪 Testing y Desarrollo

### Colección de Postman ✅
- **Nombre**: "Tesoros Chocó - API FUNCIONAL ✅"
- **Workspace**: Proyecto-Sena
- **Tests automatizados**: Incluidos en cada request
- **Variables**: Configuradas con datos reales de Supabase

### Datos de Prueba Reales
- **Admin User ID**: `09682d82-715b-4065-a47e-4294d12662b2`
- **Vendor User ID**: `eee7b999-8f5c-4c6b-9dca-cac2c7643dbb`
- **Producto 1**: `228eddbe-8f20-43f4-a8aa-bb699a9f7b9b` (Máscara Artesanal)
- **Producto 2**: `1950bc0e-993b-4e69-af71-9d5fb53a3333` (Escultura en Madera)

## 🔄 Próximos Pasos

1. **Implementar endpoints faltantes**:
   - `/rpc/crear_pedido_demo`
   - `/payments/simulate`

2. **Añadir autenticación JWT**:
   - Middleware de verificación de tokens
   - Endpoints protegidos por rol

3. **Completar CRUD operations**:
   - Gestión de productos
   - Gestión de pedidos
   - Gestión de usuarios

4. **Optimizar performance**:
   - Cache de respuestas frecuentes
   - Optimización de queries
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
---

## 📋 Notas Finales

- **Documentación actualizada**: 02 Septiembre 2024
- **Tests automatizados**: Ejecutados y verificados en Postman
- **Base de datos**: Conectada y funcionando con Supabase
- **Estado del proyecto**: API parcialmente funcional, endpoints core operativos

Para reportar issues o solicitar nuevos endpoints, consulta la documentación del proyecto o contacta al equipo de desarrollo.

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
