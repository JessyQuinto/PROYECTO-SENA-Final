# Tesoros Chocó - PROYECTO-SENA-Final

## Descripción del Proyecto

**Tesoros Chocó** es una plataforma educativa desarrollada para el SENA con el fin de digitalizar y promover las artesanías tradicionales del departamento del Chocó, Colombia.

## URLs de Despliegue

### Frontend (Azure Static Web Apps)
https://ambitious-ground-03b86cf10.2.azurestaticapps.net

### Backend (Azure App Service)
https://marketplace-backend-prod.azurewebsites.net

## Configuración del Entorno de Desarrollo

### Prerrequisitos

- Node.js >= 20.0.0
- Bun (recomendado) o npm
- Cuenta en Supabase

### Estructura del Proyecto

```
PROYECTO-SENA-Final/
├── Backend/          # Servidor Express con TypeScript
├── Frontend/         # Aplicación React con Vite
└── Docs/             # Documentación del proyecto
```

### Configuración de Variables de Entorno

#### Backend (.env)
Crear `Backend/.env` con:
``env
SUPABASE_URL=https://jdmexfawmetmfabpwlfs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYzMDMxNiwiZXhwIjoyMDcwMjA2MzE2fQ.YN8rJSYn5NVL5jNZHUAKLgWUIhyy6U1h_AoZ6aExFrw
FRONTEND_ORIGINS=http://localhost:5173,https://localhost:5173,http://localhost:3000,https://localhost:3000
NODE_ENV=development
PORT=3001
```

#### Frontend (.env.local)
Crear `Frontend/.env.local` con:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://jdmexfawmetmfabpwlfs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g

# Backend URL (para desarrollo local)
VITE_BACKEND_URL=http://localhost:3001

# App Configuration
VITE_APP_NAME=Tesoros Chocó
VITE_APP_VERSION=1.0.0
VITE_APP_URL=http://localhost:5173

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=true
```

### Instalación de Dependencias

```bash
# En la raíz del proyecto
cd PROYECTO-SENA-Final

# Instalar dependencias (usando bun - recomendado)
bun install

# O alternativamente con npm
npm install
```

### Ejecución en Modo Desarrollo

#### Iniciar el Backend
```bash
cd Backend
bun run dev
# El servidor estará disponible en http://localhost:3001
```

#### Iniciar el Frontend
```bash
cd Frontend
bun run dev
# La aplicación estará disponible en http://localhost:5173
```

### Solución de Problemas Comunes

#### Error de CORS
Si encuentras errores de CORS:
1. Asegúrate de que `FRONTEND_ORIGINS` en `Backend/.env` incluye `http://localhost:5173` y `http://localhost:3000`
2. Verifica que `VITE_BACKEND_URL` en `Frontend/.env.local` apunte a `http://localhost:3001`
3. Reinicia ambos servidores después de hacer cambios

#### "Failed to fetch" al procesar pedidos
1. Verifica que el backend esté corriendo en `http://localhost:3001`
2. Asegúrate de que `VITE_BACKEND_URL` en `Frontend/.env.local` esté correctamente configurado
3. Revisa la consola del navegador para ver la URL a la que se está enviando la solicitud

#### El frontend sigue apuntando al backend de producción
1. Verifica que tengas un archivo `Frontend/.env.local` con `VITE_BACKEND_URL=http://localhost:3001`
2. Asegúrate de que no haya otros archivos `.env` que estén sobrescribiendo esta variable

### Despliegue

Para despliegue en producción, asegúrate de configurar las variables de entorno apropiadas en tu plataforma de hosting (Azure, Vercel, etc.).

## 🧪 Testing

### Pruebas Unitarias

```bash
# Frontend
cd Frontend
bun run test
bun run test:run

# Backend
cd Backend
bun run test
```

### Pruebas de Cobertura

Para ejecutar las pruebas con generación de reporte de cobertura:

```bash
# En el directorio Frontend
cd Frontend
bun run test:coverage
```

Esto ejecutará todas las pruebas y generará un reporte de cobertura en el directorio `coverage/`. El reporte incluye:

- **Texto en consola**: Muestra el porcentaje de cobertura de branches, functions, lines y statements
- **Archivo JSON**: `coverage/coverage-final.json` con datos detallados
- **Reporte HTML**: `coverage/index.html` que se puede abrir en un navegador para ver un reporte visual

La configuración actual requiere un mínimo del 70% de cobertura para branches, functions, lines y statements. Si la cobertura es menor, las pruebas fallarán.

Para ver el reporte HTML de cobertura:
1. Ejecuta `bun run test:coverage` en el directorio Frontend
2. Abre `Frontend/coverage/index.html` en tu navegador

### Pruebas de API con Postman

Hemos creado colecciones completas de Postman para probar todas las funcionalidades del sistema organizadas por rol:

#### 🔗 Colecciones Públicas de Postman

**📋 Administrador**
- [Tesoros Chocó - Administrador](https://www.postman.com/bold-zodiac-382577/workspace/tesoros-choco/collection/13226867-e1af0bd7-a37c-4674-9089-be540313cdf1?action=share&source=copy-link&creator=13226867)
- Incluye: Login, gestión de usuarios, categorías, productos, órdenes, aprobación de vendedores

**🛍️ Vendedor**
- [Tesoros Chocó - Vendedor](https://www.postman.com/bold-zodiac-382577/workspace/tesoros-choco/collection/13226867-b84cdda9-e50f-4590-89ee-4e8febd921a8?action=share&source=copy-link&creator=13226867)
- Incluye: Login, gestión de productos, órdenes, perfil de vendedor

**🛒 Comprador**
- [Tesoros Chocó - Comprador](https://www.postman.com/bold-zodiac-382577/workspace/tesoros-choco/collection/13226867-1355fb2b-b951-4c75-8d65-53222eb089ec?action=share&source=copy-link&creator=13226867)
- Incluye: Login, catálogo de productos, carrito de compras, órdenes, perfil de usuario

#### 🔑 Perfiles utilizados

**🛡️ Admin**
- Credenciales: `admin@tesoros-choco.com` / `admin123`
- Estado: ✓ Activo

**🏪 Vendedor**
- Credenciales: `carolinaalexandrazapata@gmail.com` / `Rulexi700.`
- Estado: ✓ Activo, ✓ Aprobado

**🛒 Comprador**
- Credenciales: `quintojessy2222@gmail.com` / `Rulexi700.`
- Estado: ✓ Activo

#### 📝 Características de las Colecciones

- ✅ **Autenticación automática**: Extracción y uso automático de tokens JWT
- ✅ **Variables dinámicas**: IDs se capturan automáticamente para uso en pruebas subsecuentes
- ✅ **Validaciones completas**: Tests exhaustivos para cada endpoint
- ✅ **Logs detallados**: Información completa en la consola de Postman
- ✅ **Flujos realistas**: Simulan casos de uso reales del sistema

#### 🚀 Cómo usar las colecciones

1. Hacer clic en cualquiera de los enlaces públicos arriba
2. Importar la colección a tu workspace de Postman
3. Configurar la variable `vault:supabase-anon-api-key` con tu clave anónima de Supabase
4. Ejecutar las pruebas en orden secuencial para mejores resultados
5. Revisar los logs en la consola de Postman para información detallada

## 📚 Documentación Adicional

- [Arquitectura del Sistema](Docs/ARQUITECTURA.md)
- [Diseño del Sistema](Docs/DISEÑO_SISTEMA.md)
- [Documentación Frontend](Docs/FRONTEND.md)
- [Documentación Backend](Docs/BACKEND.md)
- [API del Backend](Docs/API.md)
- [**📋 Guía Completa de Pruebas con Postman**](Docs/POSTMAN_TESTING.md)
- [Guía de Despliegue](Docs/DEPLOYMENT.md)
- [_videos de Funcionamiento de Módulos y Pruebas_](https://drive.google.com/drive/folders/1TzaoRomnwRZKkUAKr17rV5evDqHJ74l6?usp=sharing)

## 🤝 Contribución

Este es un proyecto educativo del SENA. Para contribuir:

1. Crear una rama para tu feature
2. Implementar cambios siguiendo las convenciones del proyecto
3. Ejecutar tests antes de hacer commit
4. Crear un Pull Request con descripción clara

## 📄 Licencia

Proyecto educativo del SENA - Todos los derechos reservados.

## 🆘 Soporte

Para soporte técnico o preguntas sobre el proyecto, contactar al equipo de desarrollo del SENA.

---

**Desarrollado con ❤️ para preservar y promover las artesanías del Chocó**