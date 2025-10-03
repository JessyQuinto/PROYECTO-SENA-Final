# BITÁCORA - TESOROS CHOCÓ

## 📘 Portada

**Evidencia de producto: GA11-220501098-AA1-EV04**  
**Bitácoras con los procesos documentados**

---

## 📖 Introducción

Esta bitácora documenta los procesos y avances del proyecto **Tesoros Chocó**, una plataforma educativa desarrollada para el SENA con el fin de digitalizar y promover las artesanías tradicionales del departamento del Chocó, Colombia.

El proyecto implementa un marketplace que conecta artesanos del Chocó con compradores interesados en productos únicos y auténticos, facilitando la comercialización digital de artesanías tradicionales y promoviendo la economía local.

---

## 🎯 Objetivo del Proyecto

Digitalizar y promover las artesanías tradicionales del departamento del Chocó mediante una plataforma tecnológica que facilite la conexión entre artesanos y compradores, preservando las técnicas ancestrales y fortaleciendo la economía local.

---

## 🏗️ Arquitectura del Sistema

El proyecto implementa una arquitectura moderna de cliente-servidor con separación clara de responsabilidades:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Supabase      │
│   (React/TS)    │◄──►│  (Express/TS)   │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Express.js    │    │ • Base de datos │
│ • TypeScript    │    │ • TypeScript    │    │ • Auth JWT      │
│ • Vite          │    │ • CORS          │    │ • Storage       │
│ • Tailwind CSS  │    │ • Morgan        │    │ • Edge Functions│
│ • React Router  │    │ • Zod           │    │ • RLS Policies  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Tecnologías Principales

**Frontend:**
- React 18 con TypeScript
- Vite para desarrollo rápido
- Tailwind CSS con sistema de diseño personalizado
- React Router v6 con lazy loading

**Backend:**
- Node.js con TypeScript
- Express.js con middleware personalizado
- Validación con Zod
- Configuración flexible de CORS

**Base de Datos & Infraestructura:**
- PostgreSQL gestionado por Supabase
- Supabase Auth con JWT y roles personalizados
- Supabase Storage para imágenes de productos
- Row Level Security para control de acceso granular

---

## 👥 Roles de Usuario

El sistema está diseñado para manejar múltiples roles de usuario:

1. **Administrador**
   - Aprobar/rechazar vendedores
   - Gestionar categorías
   - Ver métricas globales
   - Moderar contenido

2. **Vendedor**
   - Crear/editar productos propios
   - Ver pedidos de productos propios
   - Actualizar estado de pedidos
   - Ver estadísticas de ventas

3. **Comprador**
   - Navegar catálogo
   - Agregar productos al carrito
   - Realizar compras
   - Ver historial de pedidos

---

## 🔗 Enlaces del Proyecto

### URLs de Despliegue

- **Frontend (Azure Static Web Apps)**: https://ambitious-ground-03b86cf10.2.azurestaticapps.net
- **Backend (Azure App Service)**: https://marketplace-backend-prod.azurewebsites.net

### Documentación del Proyecto

- [Arquitectura del Sistema](Docs/ARQUITECTURA.md)
- [Diseño del Sistema](Docs/DISEÑO_SISTEMA.md)
- [Documentación Frontend](Docs/FRONTEND.md)
- [Documentación Backend](Docs/BACKEND.md)
- [Guía Completa de Pruebas con Postman](Docs/POSTMAN_TESTING.md)
- [Guía de Despliegue](Docs/DEPLOYMENT.md)
- [Documentación de Supabase](Docs/SUPABASE.md)

### Colecciones de Postman

- **Administrador**: [Tesoros Chocó - Administrador](https://www.postman.com/bold-zodiac-382577/workspace/tesoros-choco/collection/13226867-e1af0bd7-a37c-4674-9089-be540313cdf1?action=share&source=copy-link&creator=13226867)
- **Vendedor**: [Tesoros Chocó - Vendedor](https://www.postman.com/bold-zodiac-382577/workspace/tesoros-choco/collection/13226867-b84cdda9-e50f-4590-89ee-4e8febd921a8?action=share&source=copy-link&creator=13226867)
- **Comprador**: [Tesoros Chocó - Comprador](https://www.postman.com/bold-zodiac-382577/workspace/tesoros-choco/collection/13226867-1355fb2b-b951-4c75-8d65-53222eb089ec?action=share&source=copy-link&creator=13226867)

---

## 🛠️ Procesos Documentados

### 1. Configuración del Entorno de Desarrollo

**Prerrequisitos:**
- Node.js >= 20.0.0
- Bun (recomendado) o npm
- Cuenta en Supabase

**Estructura del Proyecto:**
```
PROYECTO-SENA-Final/
├── Backend/          # Servidor Express con TypeScript
├── Frontend/         # Aplicación React con Vite
└── Docs/             # Documentación del proyecto
```

### 2. Instalación de Dependencias

```bash
# En la raíz del proyecto
cd PROYECTO-SENA-Final

# Instalar dependencias (usando bun - recomendado)
bun install

# O alternativamente con npm
npm install
```

### 3. Ejecución en Modo Desarrollo

**Iniciar el Backend:**
```bash
cd Backend
bun run dev
# El servidor estará disponible en http://localhost:3001
```

**Iniciar el Frontend:**
```bash
cd Frontend
bun run dev
# La aplicación estará disponible en http://localhost:5173
```

### 4. Pruebas del Sistema

**Pruebas Unitarias:**
```bash
# Frontend
cd Frontend
bun run test

# Backend
cd Backend
bun run test
```

**Pruebas de Cobertura:**
```bash
# En el directorio Frontend
cd Frontend
bun run test:coverage
```

### 5. Despliegue

El proyecto está configurado para despliegue en:
- Azure Static Web Apps (Frontend)
- Azure App Service (Backend)

Para despliegue en producción, se deben configurar las variables de entorno apropiadas en la plataforma de hosting.

---

## 📊 Monitoreo y Observabilidad

### Métricas de Performance
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)

### Logging y Auditoría
- Operaciones de autenticación
- Creación/modificación de productos
- Procesamiento de pedidos
- Cambios de estado críticos
- Errores del sistema

---

## 🔐 Seguridad

### Control de Acceso Basado en Roles (RBAC)
- **Admin**: Acceso completo al sistema
- **Vendedor**: Gestión de productos y pedidos propios
- **Comprador**: Navegación y compra de productos

### Row Level Security (RLS)
Políticas implementadas para garantizar que cada usuario solo pueda acceder a los datos que le corresponden según su rol.

### Validación y Sanitización
- Validación con Zod en formularios
- Sanitización de inputs con DOMPurify
- Rate limiting en formularios
- Headers de seguridad (CSP, CORS)

---

## 📈 Futuras Mejoras

### Escalabilidad
- Microservicios para funcionalidades críticas
- CDN para distribución global
- Load balancing para alta disponibilidad

### Funcionalidades Avanzadas
- Sistema de recomendaciones
- Búsqueda avanzada con filtros
- Notificaciones push
- Chat en vivo entre usuarios

### Integración Externa
- Pasarelas de pago reales
- Servicios de envío
- Redes sociales
- Analytics avanzados

---

## 🎯 Conclusiones

El proyecto **Tesoros Chocó** representa una solución tecnológica integral para la digitalización del comercio de artesanías tradicionales del Chocó. Su arquitectura modular, escalable y centrada en la experiencia del usuario incorpora las mejores prácticas de la industria mientras mantiene la simplicidad necesaria para un proyecto educativo.

La implementación de controles de seguridad robustos, patrones de diseño modernos y una clara separación de responsabilidades garantizan un sistema mantenible y extensible. Las múltiples capas de validación y monitoreo aseguran la calidad y confiabilidad del sistema.

El proyecto no solo cumple con su objetivo de conectar artesanos con compradores, sino que también sirve como ejemplo de cómo la tecnología puede preservar y promover el patrimonio cultural.

---

**Desarrollado con ❤️ para preservar y promover las artesanías del Chocó**

**GFPI-F-135 V01**