# 📋 Informe de Errores en Colecciones de Postman

Este informe detalla los errores encontrados al ejecutar las colecciones de Postman del proyecto **Tesoros Chocó**.

## 📊 Resumen General

| Colección | Estado | Errores Encontrados |
|-----------|--------|-------------------|
| Vendedor Tests | ✅ Exitosa | 0 errores |
| Comprador Tests | ⚠️ Con errores | 1 error |
| API Completa | ⚠️ Con errores | 3 errores |

## 🔍 Detalle de Errores

### 1. Colección: Tesoros Chocó - Comprador Tests

**Error encontrado:**
```
POST http://localhost:4000/rpc/crear_pedido [400 Bad Request]
❌ Order error: {"error":"Algunos productos no tienen stock suficiente. Por favor, revisa tu carrito.","code":"P0001"}
```

**Causa:**
El producto con ID `228eddbe-8f20-43f4-a8aa-bb699a9f7b9b` (definido en la variable `demo_producto_id`) no tiene stock suficiente para crear el pedido.

**Solución:**
1. Verificar el stock del producto en la base de datos
2. Actualizar el stock del producto a un valor mayor que 0
3. O actualizar la variable `demo_producto_id` con un ID de producto que tenga stock disponible

**SQL para verificar:**
```sql
SELECT id, nombre, stock FROM productos WHERE id = '228eddbe-8f20-43f4-a8aa-bb699a9f7b9b';
```

**SQL para actualizar stock:**
```sql
UPDATE productos SET stock = 5 WHERE id = '228eddbe-8f20-43f4-a8aa-bb699a9f7b9b';
```

### 2. Colección: Tesoros Chocó API - DOCUMENTADA

#### Error 1: Intento de crear pedido con rol incorrecto

**Error encontrado:**
```
POST http://localhost:4000/rpc/crear_pedido [403 Forbidden]
❌ Order error: {"error":"Solo compradores pueden crear pedidos"}
```

**Causa:**
La colección está intentando crear un pedido usando credenciales de administrador en lugar de comprador.

**Solución:**
1. Usar credenciales de comprador para esta operación
2. O modificar el endpoint para permitir crear pedidos con rol de administrador (no recomendado)

#### Error 2: Usuario ya existe

**Error encontrado:**
```
POST http://localhost:4000/admin/create-user [500 Internal Server Error]
❌ User creation error: {"error":"A user with this email address has already been registered"}
```

**Causa:**
El usuario con email `test@example.com` ya existe en la base de datos.

**Solución:**
1. Usar un email diferente para la prueba
2. O eliminar el usuario existente antes de crear uno nuevo

#### Error 3: IDs faltantes en URLs

**Error encontrado:**
```
POST http://localhost:4000/orders//delivered [404 Not Found]
POST http://localhost:4000/admin/users//role [404 Not Found]
```

**Causa:**
Las variables `order_id` y `new_user_id` no están siendo establecidas correctamente, resultando en URLs con IDs vacíos.

**Solución:**
1. Asegurar que las variables se establezcan correctamente en los scripts de test
2. O usar un script que maneje correctamente las variables dinámicas como el que creamos (`run-postman-tests.cjs`)

## 🛠️ Recomendaciones

### 1. Para la Colección de Comprador
- Verificar y actualizar el stock de productos de prueba
- Asegurar que los productos usados para pruebas tengan suficiente stock

### 2. Para la Colección API Completa
- Separar las pruebas por roles (admin, comprador, vendedor)
- Usar emails únicos para pruebas de creación de usuarios
- Implementar mejor manejo de variables dinámicas

### 3. General
- Usar el script `run-postman-tests.cjs` para ejecuciones más confiables
- Mantener actualizados los entornos de prueba con datos válidos
- Verificar periódicamente el estado de los productos de prueba

## ✅ Colecciones Funcionales

### Tesoros Chocó - Vendedor Tests
Esta colección funciona correctamente y prueba todos los flujos importantes para un vendedor:
1. Health Check
2. Autenticación
3. Creación de productos
4. Actualización de productos
5. Marcar items como enviados

## 📈 Próximos Pasos

1. **Corregir colección de comprador:**
   - Actualizar stock del producto de prueba
   - Verificar que el flujo de creación de pedidos funcione

2. **Corregir colección API completa:**
   - Separar pruebas por roles
   - Usar credenciales apropiadas para cada operación
   - Mejorar manejo de variables

3. **Mantener datos de prueba:**
   - Crear productos específicos para pruebas con stock garantizado
   - Usar emails únicos para pruebas de usuarios

4. **Documentar mejor:**
   - Actualizar README con instrucciones claras
   - Crear guías específicas por rol