# Diseño del Sistema - Tesoros Chocó

## 🎯 Visión General del Sistema

**Tesoros Chocó** es un marketplace de artesanías que conecta artesanos del departamento del Chocó con compradores interesados en productos únicos y auténticos. El sistema está diseñado para facilitar la comercialización digital de artesanías tradicionales, promoviendo la economía local y preservando las técnicas ancestrales.

## 🏗️ Componentes Principales del Sistema

### 1. Módulos de Usuario por Rol

#### Módulo de Administración (`admin/`)
- **AdminDashboard**: Panel principal con métricas y resumen
- **AdminLayout**: Layout específico para administradores
- **AdminSettings**: Configuración del sistema
- **AuditLogAdmin**: Logs de auditoría del sistema
- **CategoriesAdmin**: Gestión de categorías de productos
- **MetricsAdmin**: Métricas y reportes del sistema
- **ModerationAdmin**: Moderación de contenido y usuarios
- **UsersAdmin**: Gestión de usuarios y roles

#### Módulo de Vendedor (`vendor/`)
- **VendorDashboard**: Panel principal del vendedor
- **VendorLayout**: Layout específico para vendedores
- **Gestión de Productos**: Crear, editar, eliminar productos
- **Gestión de Pedidos**: Ver y procesar pedidos recibidos
- **Estadísticas de Ventas**: Métricas de rendimiento
- **Perfil del Vendedor**: Información y configuración

#### Módulo de Comprador (`buyer/`)
- **ProductCatalog**: Catálogo de productos disponibles
- **ProductDetail**: Detalle completo de cada producto
- **CartContext**: Gestión del carrito de compras
- **CartPage**: Página del carrito
- **CheckoutPage**: Proceso de checkout
- **MyOrdersPage**: Historial de pedidos
- **OrderDetailPage**: Detalle de pedidos específicos
- **OrderReceiptPage**: Recibo de confirmación
- **ReviewsPage**: Sistema de calificaciones
- **BuyerProfile**: Perfil del comprador
- **UserProfileManager**: Gestión de perfiles reutilizable
- **UserProfileSettings**: Configuración de perfiles de usuario

### 2. Componentes de UI Reutilizables

#### Layout Components
- **MainLayout**: Layout principal de la aplicación
- **Header**: Encabezado con navegación
- **Navbar**: Barra de navegación principal
- **Footer**: Pie de página
- **MobileTabBar**: Navegación móvil
- **MobileMenu**: Menú móvil desplegable
- **NavigationMenu**: Menú de navegación
- **UserMenu**: Menú de usuario
- **CartDropdown**: Dropdown del carrito
- **GlobalModals**: Modales globales

#### UI Components (shadcn/ui)
- **Button**: Botones con variantes
- **Card**: Contenedores de contenido
- **Input**: Campos de entrada
- **Dialog**: Modales y diálogos
- **Checkbox**: Casillas de verificación
- **Label**: Etiquetas para formularios
- **Toaster**: Sistema de notificaciones

#### Componentes Especializados
- **OptimizedImage**: Imágenes optimizadas
- **Skeleton**: Indicadores de carga
- **Icon**: Sistema de iconos
- **FormValidation**: Validación de formularios
- **ErrorBoundary**: Manejo de errores
- **ThemeProvider**: Gestión de temas
- **ThemeToggle**: Cambio de temas
- **CookieConsent**: Consentimiento de cookies
- **Accessibility**: Componentes de accesibilidad

### 3. Hooks Personalizados

#### Gestión de Datos
- **useSupabase**: Cliente de Supabase
- **useCache**: Sistema de cache
- **useForm**: Formularios con validación
- **useDebounce**: Debounce para inputs

#### Lógica de Negocio
- **useAuth**: Autenticación y sesión
- **useCart**: Estado del carrito
- **useToast**: Notificaciones
- **usePerformance**: Métricas de rendimiento

#### Seguridad y Validación
- **useSecurity**: Utilidades de seguridad
- **useRateLimit**: Rate limiting
- **useErrorHandling**: Manejo de errores
- **useDatabaseMonitoring**: Monitoreo de BD

### 4. Utilidades y Servicios

#### Gestión de Errores
- **errorHandler.ts**: Manejo centralizado de errores
- **errors.ts**: Definiciones de errores personalizados
- **ErrorBoundary**: Captura de errores en React

#### Performance y Optimización
- **performance.ts**: Métricas de rendimiento
- **cache.ts**: Sistema de cache
- **OptimizedImage**: Optimización de imágenes
- **Lazy Loading**: Carga diferida de componentes

#### Seguridad
- **security.ts**: Utilidades de seguridad
- **csp.ts**: Content Security Policy
- **ProtectedRoute**: Rutas protegidas
- **Role-based Access**: Control de acceso por roles

## 🔄 Flujo de Datos del Sistema

### 1. Flujo de Autenticación y Autorización

```
Usuario → Login/Register → Supabase Auth → JWT Token → AuthContext → Protected Routes
```

**Detalle del flujo:**
1. **Registro**: Usuario se registra con email/password
2. **Verificación**: Supabase envía email de verificación
3. **Login**: Usuario inicia sesión con credenciales
4. **JWT**: Se genera token JWT con claims de rol
5. **Context**: AuthContext mantiene estado de sesión
6. **Protección**: ProtectedRoute valida acceso a rutas

### 2. Flujo de Gestión de Productos

```
Vendedor → Crear Producto → Validación → Supabase Storage → Database → Frontend Display
```

**Detalle del flujo:**
1. **Formulario**: Vendedor llena formulario de producto
2. **Validación**: Frontend valida con Zod
3. **Imagen**: Se sube a Supabase Storage
4. **Datos**: Se insertan en tabla productos
5. **RLS**: Row Level Security valida permisos
6. **Display**: Producto aparece en catálogo

### 3. Flujo de Compra

```
Comprador → Carrito → Checkout → Validación → Supabase RPC → Confirmación → Email
```

**Detalle del flujo:**
1. **Carrito**: Comprador agrega productos
2. **Checkout**: Llena información de envío/pago
3. **Validación**: Se validan datos y stock
4. **RPC**: Se llama función `crear_pedido` (vía /rpc/crear_pedido)
5. **Transacción**: Supabase procesa transacción
6. **Confirmación**: Se confirma orden y se notifica

### 4. Flujo de Gestión de Pedidos

```
Pedido Creado → Procesando → Enviado → Entregado → Calificación
```

**Estados del pedido:**
- **Pendiente**: Pedido creado, esperando procesamiento
- **Procesando**: Vendedor está preparando el pedido
- **Enviado**: Pedido enviado al comprador
- **Entregado**: Pedido recibido por el comprador
- **Cancelado**: Pedido cancelado (si aplica)

## 🎭 Casos de Uso Clave

### 1. Registro y Aprobación de Vendedores

**Actor Principal**: Vendedor potencial
**Precondiciones**: Usuario no registrado
**Flujo Principal**:
1. Usuario se registra como vendedor
2. Sistema asigna rol "vendedor" con estado "pendiente"
3. Administrador revisa solicitud
4. Administrador aprueba o rechaza
5. Sistema actualiza estado del vendedor
6. Vendedor puede crear productos (si aprobado)

**Postcondiciones**: Vendedor aprobado puede gestionar productos

### 2. Creación y Gestión de Productos

**Actor Principal**: Vendedor aprobado
**Precondiciones**: Vendedor autenticado y aprobado
**Flujo Principal**:
1. Vendedor accede al panel de vendedor
2. Crea nuevo producto con información y imagen
3. Sistema valida datos y sube imagen
4. Producto se guarda en base de datos
5. Producto aparece en catálogo público
6. Vendedor puede editar/eliminar sus productos

**Postcondiciones**: Producto disponible para compra

### 3. Proceso de Compra

**Actor Principal**: Comprador
**Precondiciones**: Usuario autenticado como comprador
**Flujo Principal**:
1. Comprador navega catálogo de productos
2. Agrega productos al carrito
3. Procede al checkout
4. Llena información de envío y pago
5. Sistema valida stock y datos
6. Se procesa la orden
7. Se confirma la compra
8. Se envía email de confirmación

**Postcondiciones**: Orden creada y confirmada

### 4. Gestión de Pedidos por Vendedor

**Actor Principal**: Vendedor
**Precondiciones**: Vendedor con productos vendidos
**Flujo Principal**:
1. Vendedor recibe notificación de nuevo pedido
2. Revisa detalles del pedido
3. Prepara y empaca el producto
4. Actualiza estado a "enviado"
5. Proporciona información de seguimiento
6. Comprador recibe y confirma entrega
7. Vendedor puede solicitar calificación

**Postcondiciones**: Pedido completado exitosamente

### 5. Administración del Sistema

**Actor Principal**: Administrador
**Precondiciones**: Usuario con rol admin
**Flujo Principal**:
1. Administrador accede al panel de administración
2. Revisa solicitudes de vendedores pendientes
3. Aprueba o rechaza solicitudes
4. Monitorea métricas del sistema
5. Gestiona categorías de productos
6. Revisa logs de auditoría
7. Modera contenido inapropiado

**Postcondiciones**: Sistema mantenido y moderado

## 🔐 Modelo de Seguridad

### 1. Control de Acceso Basado en Roles (RBAC)

**Roles del Sistema:**
- **admin**: Acceso completo al sistema
- **vendedor**: Gestión de productos y pedidos propios
- **comprador**: Navegación y compra de productos

**Permisos por Rol:**
```
Admin:
├── Aprobar/rechazar vendedores
├── Gestionar categorías
├── Ver métricas globales
├── Moderar contenido
└── Acceso a logs de auditoría

Vendedor:
├── Crear/editar productos propios
├── Ver pedidos de productos propios
├── Actualizar estado de pedidos
└── Ver estadísticas de ventas

Comprador:
├── Navegar catálogo
├── Agregar productos al carrito
├── Realizar compras
├── Ver historial de pedidos
└── Calificar productos comprados
```

### 2. Row Level Security (RLS)

**Políticas Implementadas:**
- **Usuarios**: Solo ven sus propios datos
- **Productos**: Vendedores solo gestionan productos propios
- **Pedidos**: Vendedores solo ven pedidos de sus productos
- **Evaluaciones**: Solo en productos comprados

### 3. Validación y Sanitización

**Frontend:**
- Validación con Zod en formularios
- Sanitización de inputs con DOMPurify
- Rate limiting en formularios

**Backend:**
- Validación de esquemas con Zod
- Headers de seguridad (CSP, CORS)
- Logging de operaciones críticas

## 📱 Experiencia de Usuario

### 1. Diseño Responsivo

**Mobile-First Approach:**
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Navegación móvil optimizada con tabs
- Formularios adaptados para touch

**Componentes Adaptativos:**
- Grids responsivos
- Imágenes adaptativas
- Tipografía escalable

### 2. Accesibilidad

**Estándares WCAG 2.1:**
- Navegación por teclado
- Soporte para lectores de pantalla
- Contraste de colores adecuado
- Textos alternativos para imágenes

### 3. Performance

**Optimizaciones Implementadas:**
- Lazy loading de componentes
- Code splitting por rutas
- Optimización de imágenes
- Cache inteligente
- Skeleton loaders

## 🔄 Integración de Sistemas

### 1. Supabase como Backend-as-a-Service

**Servicios Utilizados:**
- **Auth**: Autenticación y autorización
- **Database**: PostgreSQL con RLS
- **Storage**: Almacenamiento de imágenes
- **Edge Functions**: Lógica de negocio compleja
- **Real-time**: Actualizaciones en tiempo real

### 2. Frontend-Backend Communication

**Patrones de Comunicación:**
- **Direct**: Frontend → Supabase (CRUD básico)
- **Via Backend**: Frontend → Backend → Supabase (lógica compleja)
- **RPC**: Llamadas a funciones personalizadas
- **Webhooks**: Notificaciones de eventos

### 3. Manejo de Estados

**Estados del Sistema:**
- **Usuario**: pendiente, activo, suspendido
- **Vendedor**: pendiente, aprobado, rechazado
- **Producto**: activo, inactivo, bloqueado
- **Pedido**: pendiente, procesando, enviado, entregado, cancelado

## 📊 Monitoreo y Observabilidad

### 1. Métricas de Performance

**Web Vitals:**
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)

### 2. Logging y Auditoría

**Logs Estructurados:**
- Operaciones de autenticación
- Creación/modificación de productos
- Procesamiento de pedidos
- Cambios de estado críticos
- Errores del sistema

### 3. Dashboards de Monitoreo

**Paneles Disponibles:**
- **Performance Dashboard**: Métricas de rendimiento
- **Security Dashboard**: Estado de seguridad
- **Database Dashboard**: Monitoreo de base de datos
- **Admin Dashboard**: Métricas del sistema

## 🔮 Futuras Mejoras del Sistema

### 1. Escalabilidad

**Arquitectura:**
- Microservicios para funcionalidades críticas
- CDN para distribución global
- Load balancing para alta disponibilidad
- Cache distribuido (Redis)

### 2. Funcionalidades Avanzadas

**Características:**
- Sistema de recomendaciones
- Búsqueda avanzada con filtros
- Notificaciones push
- Chat en vivo entre usuarios
- Sistema de afiliados

### 3. Integración Externa

**APIs y Servicios:**
- Pasarelas de pago reales
- Servicios de envío
- Redes sociales
- Analytics avanzados
- Herramientas de marketing

---

Este diseño del sistema proporciona una base sólida para el marketplace de artesanías, con una arquitectura modular, escalable y centrada en la experiencia del usuario, manteniendo la simplicidad necesaria para un proyecto educativo mientras incorpora las mejores prácticas de la industria.
