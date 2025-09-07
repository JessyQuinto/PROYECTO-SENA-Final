# 📋 Guía de Ejecución - Colección "Tesoros Chocó API - Flujo Vendedor"

## 🎯 Objetivo

Esta guía te ayudará a ejecutar correctamente la colección "Tesoros Chocó API - Flujo Vendedor" en Postman, asegurando que todas las solicitudes se ejecuten en el orden correcto y que las variables dinámicas se establezcan apropiadamente.

## 📋 Prerrequisitos

Antes de ejecutar la colección, asegúrate de tener:

1. **Backend en ejecución**: El servidor backend debe estar corriendo en `http://localhost:4000`
2. **Credenciales válidas**: El vendedor debe estar registrado y aprobado en el sistema
3. **Environment configurado**: El environment "Tesoros Chocó - Desarrollo" debe tener las variables actualizadas

## 🚀 Método 1: Ejecución Individual (Recomendado)

Para obtener los mejores resultados, ejecuta las solicitudes individualmente en el siguiente orden:

### 1. 🔍 Health Check
- Verifica que el backend esté funcionando correctamente

### 2. 🔐 Auth Vendedor
- **POST Supabase Auth - Vendedor**: Autentica al vendedor y establece `vendor_auth_token` y `vendor_user_id`
- **POST Backend Post-Signup - Vendedor**: Sincroniza el perfil del vendedor

### 3. 📦 Gestión de Productos
- **POST /productos - Crear Producto**: Crea un nuevo producto y establece `product_id`
- **PUT /productos/:id - Actualizar Producto**: Actualiza la información del producto recién creado

### 4. 🚚 Gestión de Envíos (Opcional)
- **POST /order-items/:id/shipped - Marcar Item como Enviado**: Solo si tienes un `order_item_id` válido

## 🚀 Método 2: Ejecución con Script (Automatizado)

Hemos creado un script que ejecuta toda la colección en el orden correcto:

### Ejecutar el script:

```bash
# Navega al directorio del proyecto
cd c:\Users\Jessy\OneDrive\Desktop\PROYECTO-SENA-main-main\PROYECTO-SENA-main-main

# Ejecuta el script
node run-vendedor-collection.cjs
```

Este script:
- Ejecuta todas las solicitudes en orden
- Establece las variables dinámicas correctamente
- Genera un reporte de resultados en `vendedor-collection-results.json`

## 📊 Resultados Esperados

### Ejecución Exitosa:
- ✅ **GET /health**: Status 200
- ✅ **POST Supabase Auth**: Status 200 y variables establecidas
- ✅ **POST Backend Post-Signup**: Status 200
- ✅ **POST /productos**: Status 201 y `product_id` establecido
- ✅ **PUT /productos/:id**: Status 200

### Variables Dinámicas Establecidas:
- `vendor_auth_token`: Token de autenticación JWT
- `vendor_user_id`: ID del usuario vendedor
- `product_id`: ID del producto creado

## ⚠️ Problemas Comunes y Soluciones

### 1. **401 Unauthorized**
**Causa**: Token de autenticación no válido o no establecido
**Solución**: 
- Verifica que las credenciales del vendedor sean correctas
- Asegúrate de ejecutar primero la autenticación

### 2. **404 Not Found**
**Causa**: IDs no establecidos correctamente
**Solución**:
- Verifica que las solicitudes se ejecuten en orden
- Confirma que `product_id` se establezca en la creación del producto

### 3. **400 Bad Request**
**Causa**: Datos inválidos en la solicitud
**Solución**:
- Verifica que el vendedor esté aprobado en el sistema
- Confirma que los datos del producto sean válidos

## 📝 Notas Importantes

1. **Orden de ejecución**: Es crucial ejecutar las solicitudes en el orden especificado para que las variables dinámicas se establezcan correctamente.

2. **Vendedor aprobado**: El vendedor debe estar aprobado en el sistema para poder crear productos.

3. **Variables del Environment**: La colección ahora usa las variables definidas en el environment "Tesoros Chocó - Desarrollo".

4. **Datos de prueba**: Los productos creados son solo para pruebas y pueden ser eliminados después.

## 🎯 Resultado Final

Al completar esta guía, habrás:
- ✅ Verificado el funcionamiento del backend
- ✅ Autenticado correctamente al vendedor
- ✅ Creado y actualizado un producto
- ✅ Comprendido el flujo completo de operaciones del vendedor

¿Tienes alguna pregunta sobre la ejecución de la colección o necesitas ayuda con algún paso específico?