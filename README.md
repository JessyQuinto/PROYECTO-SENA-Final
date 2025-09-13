# Tesoros Chocó - Marketplace de Artesanías

## 📋 Descripción General

**Tesoros Chocó** es una plataforma de comercio electrónico diseñada para conectar artesanos del departamento del Chocó, Colombia, con compradores que valoran productos únicos y auténticos hechos a mano. La plataforma facilita la comercialización de artesanías tradicionales, promoviendo la economía local y preservando las técnicas ancestrales de la región.

## 🎯 Objetivos del Proyecto

- **Digitalización del Comercio Artesanal**: Llevar las artesanías del Chocó al comercio digital
- **Empoderamiento Económico**: Generar ingresos sostenibles para los artesanos locales
- **Preservación Cultural**: Mantener vivas las técnicas y tradiciones artesanales
- **Conectividad Regional**: Eliminar barreras geográficas para la comercialización
- **Educación del Consumidor**: Informar sobre el origen, materiales y técnicas de cada pieza

## 🏗️ Arquitectura del Sistema

El proyecto está estructurado como una aplicación web moderna con arquitectura cliente-servidor:

- **Frontend**: Aplicación React con TypeScript, Vite y Tailwind CSS
- **Backend**: API REST con Express.js y TypeScript
- **Base de Datos**: PostgreSQL gestionado por Supabase
- **Autenticación**: Sistema de roles con JWT (admin, vendedor, comprador)
- **Almacenamiento**: Supabase Storage para imágenes de productos

## 🚀 Instalación Rápida

### Prerrequisitos

- Node.js >= 20.0.0
- Bun (recomendado) o npm
- Cuenta de Supabase

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd PROYECTO-SENA-Final
```

### 2. Instalar Dependencias

```bash
# Instalar dependencias del workspace
bun install

# O con npm
npm install
```

### 3. Configurar Variables de Entorno

#### Frontend (.env.local)
```bash
cd Frontend
cp env.example .env.local
```

Editar `.env.local`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_BACKEND_URL=http://localhost:3001
```

#### Backend (.env)
```bash
cd Backend
cp .env.example .env
```

Editar `.env`:
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
FRONTEND_ORIGINS=http://localhost:3000
```

### 4. Ejecutar en Desarrollo

#### Terminal 1 - Backend
```bash
cd Backend
bun run dev
# El backend estará en http://localhost:3001 (o 4000 según PORT)
```

#### Terminal 2 - Frontend
```bash
cd Frontend
bun run dev
# El frontend estará en http://localhost:3000
```

### 5. Acceder a la Aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Supabase Dashboard**: https://app.supabase.com

## 🧪 Testing

### Pruebas Unitarias

```bash
# Frontend
cd Frontend
bun run test
bun run test:coverage

# Backend
cd Backend
bun run test
```

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

#### 🔑 Credenciales de Prueba

- **Administrador**: `admin@tesoros-choco.com` / `admin123`
- **Vendedor**: `quintojessy2222@gmail.com` / `Rulexi700.`
- **Comprador**: `marianareyesgonzalez4@gmail.com` / `Rulexi700.`

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
