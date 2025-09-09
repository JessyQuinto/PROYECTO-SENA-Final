# Arquitectura del Sistema - Tesoros Chocó

## 🏗️ Visión General de la Arquitectura

**Tesoros Chocó** implementa una arquitectura moderna de **cliente-servidor** con separación clara de responsabilidades, escalabilidad y mantenibilidad. El sistema está diseñado para manejar múltiples roles de usuario, transacciones seguras y una experiencia de usuario fluida.

## 📐 Diagrama de Arquitectura

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
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Componentes   │    │   Middleware    │    │   Servicios     │
│   de UI         │    │   de Seguridad  │    │   de Negocio    │
│                 │    │                 │    │                 │
│ • Layouts       │    │ • CORS          │    │ • Auth          │
│ • Formularios   │    │ • Headers       │    │ • Products      │
│ • Navegación    │    │ • Rate Limiting │    │ • Orders        │
│ • Modales       │    │ • Validation    │    │ • Notifications │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Stack Tecnológico

### Frontend (Cliente)
- **Framework**: React 18 con TypeScript
- **Build Tool**: Vite para desarrollo rápido
- **Styling**: Tailwind CSS con sistema de diseño personalizado
- **Routing**: React Router v6 con lazy loading
- **State Management**: Context API + Hooks personalizados
- **UI Components**: Radix UI + componentes shadcn/ui
- **Forms**: Zod para validación + hooks personalizados
- **Testing**: Vitest + Testing Library

### Backend (Servidor)
- **Runtime**: Node.js con TypeScript
- **Framework**: Express.js con middleware personalizado
- **Validation**: Zod para validación de esquemas
- **CORS**: Configuración flexible para múltiples orígenes
- **Logging**: Morgan para logs HTTP
- **Optimizado**: Build de producción con Helmet, Compression, caching y rate headers
- **Environment**: dotenv para configuración

### Base de Datos & Infraestructura
- **Database**: PostgreSQL gestionado por Supabase
- **Auth**: Supabase Auth con JWT y roles personalizados
- **Storage**: Supabase Storage para imágenes de productos
- **Edge Functions**: Funciones serverless para lógica compleja
- **RLS**: Row Level Security para control de acceso granular

## 🏛️ Patrones Arquitectónicos

### 1. Arquitectura en Capas
```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  (React Components, Pages, Layouts, UI Components)        │
├─────────────────────────────────────────────────────────────┤
│                     Business Logic Layer                    │
│  (Hooks, Contexts, Services, Business Rules)              │
├─────────────────────────────────────────────────────────────┤
│                      Data Access Layer                      │
│  (Supabase Client, API Calls, Data Transformations)       │
├─────────────────────────────────────────────────────────────┤
│                     Infrastructure Layer                    │
│  (Supabase, Storage, Auth, Database)                      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Patrón de Componentes Modulares
- **Módulos por Rol**: `admin/`, `vendor/`, `buyer/`
- **Componentes Reutilizables**: UI components en `components/ui/`
- **Layouts Especializados**: Layouts específicos para cada rol
- **Hooks Personalizados**: Lógica de negocio encapsulada

### 3. Patrón de Contexto para Estado Global
- **AuthContext**: Manejo de autenticación y sesión
- **CartContext**: Estado del carrito de compras
- **ToastContext**: Sistema de notificaciones
- **ThemeContext**: Gestión de temas y preferencias

## 🔐 Arquitectura de Seguridad

### 1. Autenticación Multi-Rol
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Admin     │    │  Vendedor   │    │  Comprador  │
│             │    │             │    │             │
│ • Aprobar   │    │ • Pendiente │    │ • Acceso    │
│   vendedores│    │ • Aprobado  │    │   inmediato │
│ • Moderar   │    │ • Rechazado │    │ • Comprar   │
│ • Métricas  │    │ • Productos │    │ • Calificar │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 2. Row Level Security (RLS)
- **Políticas por Rol**: Cada usuario solo ve sus datos
- **Validación de Estado**: Vendedores solo gestionan productos aprobados
- **Auditoría**: Log de todas las operaciones críticas

### 3. Middleware de Seguridad
- **CORS Configurable**: Orígenes permitidos configurables
- **Headers de Seguridad**: Prevención de ataques comunes
- **Rate Limiting**: Protección contra abuso de API

## 📱 Arquitectura de Componentes

### 1. Estructura de Componentes
```
src/
├── components/
│   ├── ui/           # Componentes base (shadcn/ui)
│   ├── Layout/       # Layouts de la aplicación
│   └── security/     # Componentes de seguridad
├── modules/
│   ├── admin/        # Módulo de administración
│   ├── vendor/       # Módulo de vendedores
│   └── buyer/        # Módulo de compradores
├── hooks/            # Hooks personalizados
├── lib/              # Utilidades y servicios
└── types/            # Definiciones de TypeScript
```

### 2. Sistema de Layouts
- **MainLayout**: Layout principal con header, footer y navegación
- **AdminLayout**: Layout específico para administradores
- **VendorLayout**: Layout para panel de vendedores
- **BuyerLayout**: Layout para perfil de compradores

## 🚀 Características de Rendimiento

### 1. Lazy Loading
- **Code Splitting**: Carga diferida de módulos por rol
- **Route-based**: Separación de código por rutas
- **Component-based**: Carga diferida de componentes pesados

### 2. Optimización de Imágenes
- **OptimizedImage**: Componente con lazy loading
- **Placeholders**: Skeleton loaders durante la carga
- **Responsive**: Diferentes tamaños según dispositivo

### 3. Caching Inteligente
- **In-memory Cache**: Cache en memoria con TTL
- **LocalStorage**: Persistencia de datos no sensibles
- **Invalidation**: Estrategias de invalidación de cache

## 🔄 Flujo de Datos

### 1. Flujo de Autenticación
```
Usuario → Login → Supabase Auth → JWT Token → AuthContext → Protected Routes
```

### 2. Flujo de Productos
```
Vendedor → Crear Producto → Supabase Storage → Database → Frontend Display
```

### 3. Flujo de Compra
```
Comprador → Carrito → Checkout → Backend API (RPC crear_pedido) → Supabase → Confirmación
```

## 📊 Monitoreo y Observabilidad

### 1. Performance Monitoring
- **Web Vitals**: LCP, FID, CLS, FCP, TTFB
- **Custom Metrics**: Tiempo de renderizado, navegación
- **Real-time**: Dashboard de performance en desarrollo

### 2. Error Handling
- **Error Boundaries**: Captura de errores en React
- **Structured Logging**: Logs estructurados con contexto
- **User Feedback**: Notificaciones amigables para usuarios

### 3. Security Dashboard
- **CSP Status**: Content Security Policy
- **Rate Limiting**: Estado de límites de tasa
- **Security Level**: Nivel de seguridad actual

## 🎯 Principios de Diseño

### 1. Responsive First
- **Mobile-First**: Diseño optimizado para móviles
- **Adaptive Layouts**: Layouts que se adaptan al dispositivo
- **Touch-Friendly**: Interfaz optimizada para touch

### 2. Accessibility
- **WCAG 2.1**: Cumplimiento de estándares de accesibilidad
- **Screen Readers**: Soporte para lectores de pantalla
- **Keyboard Navigation**: Navegación completa por teclado

### 3. Progressive Enhancement
- **Core Functionality**: Funcionalidad básica sin JavaScript
- **Enhanced Experience**: Mejoras con JavaScript habilitado
- **Graceful Degradation**: Degradación elegante en navegadores antiguos

## 🔮 Futuras Mejoras

### 1. Escalabilidad
- **Microservicios**: Separación en servicios independientes
- **CDN**: Distribución global de contenido estático
- **Load Balancing**: Balanceo de carga para alta disponibilidad

### 2. Performance
- **Service Workers**: Caching offline y PWA
- **GraphQL**: API más eficiente para consultas complejas
- **Real-time**: WebSockets para actualizaciones en tiempo real

### 3. Seguridad
- **2FA**: Autenticación de dos factores
- **OAuth**: Integración con proveedores externos
- **Audit Logs**: Logs detallados de auditoría

Nota: La especificación de endpoints está en API.md.

---

Esta arquitectura proporciona una base sólida para el crecimiento futuro del proyecto, manteniendo la simplicidad necesaria para un proyecto educativo mientras incorpora las mejores prácticas de la industria.
