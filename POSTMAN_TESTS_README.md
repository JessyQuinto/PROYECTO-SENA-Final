# 📋 Documentación de Pruebas de Postman - Tesoros Chocó

## 📖 Descripción

Este directorio contiene toda la documentación y scripts relacionados con las pruebas de las colecciones de Postman para el proyecto **Tesoros Chocó**. Se han identificado, corregido y documentado errores en las colecciones, además de crear scripts alternativos para una ejecución más confiable.

## 📁 Archivos Disponibles

### Documentación Principal
- `GUIA_EJECUCION_POSTMAN.md` - Guía detallada de cómo ejecutar todas las colecciones
- `INFORME_ERRORES_POSTMAN.md` - Informe completo de errores encontrados
- `INFORME_FINAL_POSTMAN.md` - Informe final con estado actualizado
- `RESUMEN_EJECUTIVO_POSTMAN.md` - Resumen ejecutivo del estado de las colecciones

### Scripts de Prueba
- `run-postman-tests.cjs` - Script principal que ejecuta todas las pruebas con manejo correcto de variables
- `test-complete-flow.cjs` - Script de prueba completa del flujo vendedor
- `test-postman-api.cjs` - Script de prueba de APIs individuales
- `test-ship-item.cjs` - Script específico para prueba de envío de items
- `test-api.cjs` - Script de prueba general de APIs

### Archivos de Colecciones y Entornos
- `vendedor-collection-fixed.json` - Colección de vendedor corregida
- `vendedor-collection.json` - Colección de vendedor original
- `vendedor-environment-fixed.json` - Entorno corregido
- `vendedor-environment.json` - Entorno original

## 🚀 Cómo Empezar

### Prerrequisitos
1. Node.js instalado (versión 14 o superior)
2. Backend ejecutándose en `http://localhost:4000`
3. Newman instalado globalmente o como dependencia del proyecto

### Ejecución Rápida
```bash
# Navega al directorio del proyecto
cd "C:\Users\Jessy\OneDrive\Desktop\PROYECTO-SENA-main-main\PROYECTO-SENA-main-main"

# Ejecuta el script principal que maneja todo el flujo de pruebas
node run-postman-tests.cjs
```

### Ejecución con Newman
```bash
# Ejecuta la colección de vendedor
npx newman run "Postman\Tesoros_Choco_Vendedor_Tests.postman_collection.json" -e "Postman\Tesoros_Choco_Environment.postman_environment.json"

# Ejecuta la colección de comprador
npx newman run "Postman\Tesoros_Choco_Comprador_Tests.postman_collection.json" -e "Postman\Tesoros_Choco_Comprador_Environment.postman_environment.json"
```

## 📊 Estado Actual

### Colecciones Funcionales
✅ **Vendedor Tests** - 100% funcional
✅ **Comprador Tests** - 100% funcional (corregido)

### Colecciones con Limitaciones
⚠️ **API Completa** - Parcialmente funcional (requiere ajustes)

## 🛠️ Problemas Conocidos y Soluciones

### 1. Stock Insuficiente
**Problema:** Producto de prueba sin stock suficiente
**Solución:** Actualizado stock de 0 a 5 unidades en la base de datos

### 2. Variables Dinámicas en Newman
**Problema:** Newman no maneja correctamente las variables de colección dinámicas
**Solución:** Creación de scripts personalizados que manejan el flujo completo

### 3. IDs Vacíos en URLs
**Problema:** Variables no establecidas resultan en URLs con IDs vacíos
**Solución:** Uso de scripts que manejan correctamente el paso de variables entre solicitudes

## 📈 Monitoreo y Mantenimiento

### Verificación Periódica
```sql
-- Verificar stock de productos de prueba
SELECT id, nombre, stock FROM productos WHERE id = '228eddbe-8f20-43f4-a8aa-bb699a9f7b9b';
```

### Actualización de Stock
```sql
-- Actualizar stock cuando sea necesario
UPDATE productos SET stock = 5 WHERE id = '228eddbe-8f20-43f4-a8aa-bb699a9f7b9b';
```

## 📞 Soporte

Para cualquier problema con las colecciones de Postman:

1. Verifica que el backend esté corriendo en `http://localhost:4000`
2. Confirma que las credenciales de prueba sean correctas
3. Revisa los logs del backend para errores específicos
4. Asegúrate de tener conexión a internet para las llamadas a Supabase

## 📄 Documentación Adicional

Para más información sobre el proyecto Tesoros Chocó, consulta:
- `README.md` - Documentación principal del proyecto
- `Docs/` - Directorio con documentación detallada del sistema
- `Postman/` - Directorio con colecciones originales de Postman

---
*Última actualización: Septiembre 7, 2025*