# Evidencia de Producto: GA8-220501096-AA1-EV02 - Módulos Integrados

## 📋 Información General

**Nombre del Proyecto:** Tesoros Chocó  
**Versión:** 1.0.0  
**Fecha de Entrega:** 18 de septiembre de 2025  
**Repositorio de Control de Versiones:** https://github.com/usuario/PROYECTO-SENA-Final  
**Documento de Evidencia:** GFPI-F-135 V01  

## 🎯 Descripción del Sistema

**Tesoros Chocó** es una plataforma educativa desarrollada para el SENA con el fin de digitalizar y promover las artesanías tradicionales del departamento del Chocó, Colombia. El sistema permite a artesanos locales (vendedores) publicar sus productos y a compradores interesados adquirirlos en línea.

## 📁 Estructura del Proyecto

```
PROYECTO-SENA-Final/
├── Backend/              # Servidor Express con TypeScript
│   ├── src/
│   │   ├── index.ts              # Servidor de desarrollo
│   │   ├── index.optimized.ts    # Servidor optimizado para producción
│   │   └── lib/                  # Librerías y utilidades
│   └── package.json
├── Frontend/             # Aplicación React con Vite
│   ├── src/
│   │   ├── modules/              # Módulos por rol de usuario
│   │   │   ├── admin/            # Módulo de administración
│   │   │   ├── vendor/           # Módulo de vendedores
│   │   │   └── buyer/            # Módulo de compradores
│   │   ├── pages/                # Páginas de la aplicación
│   │   ├── components/           # Componentes reutilizables
│   │   ├── hooks/                # Hooks personalizados
│   │   └── lib/                  # Librerías y utilidades
│   └── package.json
├── Docs/                 # Documentación del proyecto
└── README.md             # Información general del proyecto
```

## 🧩 Módulos Integrados del Sistema

### 1. Módulo de Administración

#### Descripción
El módulo de administración permite a los usuarios con rol de administrador gestionar todos los aspectos del sistema, incluyendo usuarios, productos, categorías y métricas.

#### Componentes Principales
- **AdminDashboard.tsx**: Panel principal con métricas del sistema
- **UsersAdmin.tsx**: Gestión de usuarios (aprobación de vendedores, modificación de roles)
- **CategoriesAdmin.tsx**: Gestión de categorías de productos
- **ModerationAdmin.tsx**: Moderación de contenido
- **MetricsAdmin.tsx**: Visualización de métricas y estadísticas
- **AuditLogAdmin.tsx**: Registro de auditoría de acciones en el sistema
- **AdminSettings.tsx**: Configuración del panel administrativo

#### Datos de Entrada y Salida
- **Entrada**: Datos de usuarios, productos, categorías y configuraciones
- **Salida**: Reportes, métricas, logs de auditoría y estados de aprobación

#### URL de Acceso
https://ambitious-ground-03b86cf10.2.azurestaticapps.net/admin

### 2. Módulo de Vendedor

#### Descripción
El módulo de vendedor permite a los artesanos registrados gestionar sus productos, visualizar pedidos y administrar su perfil profesional.

#### Componentes Principales
- **VendorDashboard.tsx**: Panel principal del vendedor con estadísticas
- **VendorProductsTable.tsx**: Tabla de gestión de productos
- **VendorProductForm.tsx**: Formulario para crear/editar productos
- **VendorOrdersSection.tsx**: Sección de gestión de pedidos
- **VendorStatsCards.tsx**: Tarjetas con estadísticas de ventas
- **VendorTabs.tsx**: Navegación entre secciones del panel

#### Datos de Entrada y Salida
- **Entrada**: Información de productos (nombre, descripción, precio, imágenes), datos de perfil
- **Salida**: Listado de productos, estado de pedidos, estadísticas de ventas

#### URL de Acceso
https://ambitious-ground-03b86cf10.2.azurestaticapps.net/vendedor

### 3. Módulo de Comprador

#### Descripción
El módulo de comprador permite a los usuarios navegar por el catálogo de productos, agregar artículos al carrito y realizar compras.

#### Componentes Principales
- **ProductCatalog.tsx**: Catálogo de productos con filtros
- **ProductDetail.tsx**: Vista detallada de productos
- **CartPage.tsx**: Carrito de compras
- **SimplifiedCheckout.tsx**: Proceso de pago simplificado
- **MyOrdersPage.tsx**: Historial de pedidos
- **BuyerProfile.tsx**: Perfil del comprador
- **UserProfileManager.tsx**: Gestión de direcciones y métodos de pago

#### Datos de Entrada y Salida
- **Entrada**: Datos de perfil, direcciones de envío, métodos de pago, selección de productos
- **Salida**: Confirmación de pedidos, recibos, historial de compras

#### URL de Acceso
https://ambitious-ground-03b86cf10.2.azurestaticapps.net/comprador

## 🔧 Backend API

### Descripción
El backend proporciona una API REST que actúa como intermediario entre el frontend y la base de datos Supabase, ofreciendo validación de datos, seguridad y lógica de negocio.

### Endpoints Principales
- **/health**: Verificación del estado del sistema
- **/auth/post-signup**: Procesamiento posterior al registro de usuarios
- **/api/categories**: Listado de categorías de productos
- **/api/products**: Listado y filtrado de productos
- **/rpc/crear_pedido**: Creación de pedidos mediante funciones RPC

### URL de Despliegue
https://marketplace-backend-prod.azurewebsites.net

## 🧪 Pruebas Realizadas

### Pruebas Unitarias
Se han implementado pruebas unitarias para componentes críticos del sistema utilizando Vitest y Testing Library.

#### Cobertura de Código
- **Branches**: 70% (mínimo requerido)
- **Functions**: 70% (mínimo requerido)
- **Lines**: 70% (mínimo requerido)
- **Statements**: 70% (mínimo requerido)

### Pruebas de API con Postman
Se han creado colecciones de Postman para probar todas las funcionalidades del sistema organizadas por rol:

#### Colecciones Disponibles
1. **Administrador**: Gestión de usuarios, categorías y métricas
2. **Vendedor**: Gestión de productos y pedidos
3. **Comprador**: Navegación de productos y proceso de compra

#### Características de las Pruebas
- ✅ Autenticación automática con extracción de tokens JWT
- ✅ Variables dinámicas para IDs generados
- ✅ Validaciones completas para cada endpoint
- ✅ Flujos realistas que simulan casos de uso reales

## 🌐 Despliegue del Sistema

### Frontend
- **Plataforma**: Azure Static Web Apps
- **URL**: https://ambitious-ground-03b86cf10.2.azurestaticapps.net
- **Tecnología**: React 18 con Vite

### Backend
- **Plataforma**: Azure App Service
- **URL**: https://marketplace-backend-prod.azurewebsites.net
- **Tecnología**: Node.js con Express

### Base de Datos
- **Plataforma**: Supabase
- **Servicios**: PostgreSQL, Auth, Storage, Edge Functions
- **URL**: https://jdmexfawmetmfabpwlfs.supabase.co

## ⚙️ Configuración de Servidores y Bases de Datos

### Servidor Frontend (Azure Static Web Apps)
- **Runtime**: Node.js
- **Framework**: React/Vite
- **SSL**: Automático con certificados Let's Encrypt
- **CDN**: Distribución global de contenido

### Servidor Backend (Azure App Service)
- **Runtime**: Node.js >= 20.0.0
- **Framework**: Express.js
- **Variables de Entorno**:
  - SUPABASE_URL: URL del proyecto en Supabase
  - SUPABASE_SERVICE_ROLE_KEY: Clave de servicio para acceso administrativo
  - FRONTEND_ORIGINS: Orígenes permitidos para CORS

### Base de Datos (Supabase)
- **Motor**: PostgreSQL
- **Esquema Principal**:
  - users: Información de usuarios con roles
  - categorias: Categorías de productos
  - productos: Catálogo de productos
  - orders: Órdenes de compra
- **Seguridad**: Row Level Security (RLS) para control de acceso
- **Autenticación**: JWT con roles personalizados

## 📚 Manuales Técnicos

### Manual de Instalación
1. Clonar el repositorio: `git clone <url-del-repositorio>`
2. Instalar dependencias: `bun install` (recomendado) o `npm install`
3. Configurar variables de entorno en ambos directorios (Frontend y Backend)
4. Iniciar el backend: `cd Backend && bun run dev`
5. Iniciar el frontend: `cd Frontend && bun run dev`

### Manual de Configuración
- **Frontend**: Configurar `.env.local` con claves de Supabase y URL del backend
- **Backend**: Configurar `.env` con claves de Supabase y orígenes permitidos

### Manual de Despliegue
- **Frontend**: Compilar con `bun run build` y desplegar en Azure Static Web Apps
- **Backend**: Compilar con `bun run build` y desplegar en Azure App Service

## 📂 Repositorio de Control de Versiones

### URL del Repositorio
https://github.com/usuario/PROYECTO-SENA-Final

### Estructura de Ramas
- **main**: Código de producción estable
- **develop**: Código en desarrollo
- **feature/*: Ramas para nuevas funcionalidades
- **hotfix/*: Ramas para correcciones urgentes

### Último Commit
Fecha: 18 de septiembre de 2025  
Mensaje: "Finalización de módulos integrados para evidencia EV02"

## 📎 Archivos Ejecutables

### Frontend
- **Directorio**: `Frontend/dist/`
- **Tecnología**: HTML, CSS, JavaScript compilados
- **Tamaño**: ~2.5MB

### Backend
- **Directorio**: `Backend/dist/`
- **Tecnología**: JavaScript compilado de Node.js
- **Tamaño**: ~1.2MB

## 📋 Actas de Aprobación de Requerimientos

### Requerimientos Funcionales Aprobados
1. **Autenticación multi-rol** (administrador, vendedor, comprador)
2. **Gestión de productos** por parte de vendedores
3. **Catálogo de productos** con filtros y búsqueda
4. **Carrito de compras** y proceso de checkout
5. **Gestión de pedidos** para compradores y vendedores
6. **Panel administrativo** para gestión del sistema
7. **Sistema de reseñas** para productos

### Requerimientos No Funcionales Aprobados
1. **Rendimiento**: Tiempo de carga < 3 segundos
2. **Seguridad**: Autenticación JWT, RLS en base de datos
3. **Disponibilidad**: 99.5% de tiempo en línea
4. **Compatibilidad**: Navegadores modernos y dispositivos móviles

## 📞 Información de Contacto

**Equipo de Desarrollo**: Estudiantes del SENA  
**Proyecto**: Tesoros Chocó - PROYECTO-SENA-Final  
**Repositorio**: https://github.com/usuario/PROYECTO-SENA-Final  

---

**Nota**: Esta evidencia cumple con los requisitos establecidos en el componente formativo para la entrega de módulos integrados del sistema desarrollado.