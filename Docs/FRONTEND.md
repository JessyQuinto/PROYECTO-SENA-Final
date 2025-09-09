# Frontend - Tesoros Chocó

## 🚀 Tecnologías Utilizadas

### Core Technologies
- **React 18.3.1**: Framework principal con características modernas
- **TypeScript 5.4.0**: Tipado estático para mayor robustez
- **Vite 5.4.0**: Build tool ultra-rápido para desarrollo
- **React Router 6.23.0**: Enrutamiento declarativo con lazy loading

### Styling & UI
- **Tailwind CSS 4.1.11**: Framework CSS utility-first
- **Radix UI**: Componentes primitivos accesibles
- **shadcn/ui**: Sistema de componentes basado en Radix
- **Lucide React**: Iconografía moderna y consistente
- **clsx + tailwind-merge**: Utilidades para clases CSS dinámicas

### State Management & Data
- **React Context API**: Estado global para auth, cart, theme
- **Custom Hooks**: Lógica de negocio encapsulada
- **Supabase Client**: Cliente oficial para integración con backend
- **Zod 3.23.8**: Validación de esquemas en tiempo de ejecución

### Development Tools
- **ESLint 9.34.0**: Linting de código con reglas personalizadas
- **Prettier 3.6.2**: Formateo automático de código
- **Vitest 3.2.4**: Framework de testing moderno
- **Testing Library**: Utilidades para testing de componentes
- **TypeScript ESLint**: Reglas específicas para TypeScript

### Performance & UX
- **Web Vitals**: Monitoreo de métricas de rendimiento
- **Lazy Loading**: Carga diferida de componentes y rutas
- **Skeleton Loaders**: Indicadores de carga elegantes
- **Optimized Images**: Componente de imágenes optimizadas
- **Service Worker**: Soporte para PWA (deshabilitado en desarrollo)

## 📁 Estructura de Carpetas

```
Frontend/src/
├── auth/
├── components/
├── hooks/
├── lib/                     # Utilidades clave
│   ├── csp.ts               # Configuración de Content-Security-Policy
│   ├── errorHandler.ts      # Manejador global de errores
│   ├── serviceWorker.ts     # Registro SW (producción)
│   ├── supabaseClient.ts    # Cliente de Supabase
│   └── logger(.unified).ts  # Utilidades de logging
├── modules/
│   ├── admin/
│   ├── buyer/
│   ├── vendor/
│   ├── App.tsx
│   ├── AuthForms.tsx
│   ├── Landing.tsx
│   └── ProtectedRoute.tsx
├── pages/                   # Pages como Home, Login, Products, etc.
├── services/                # Servicios (p.ej., notificationService)
├── styles/
├── test/
├── types/
├── main.tsx
└── vite-env.d.ts
```

## 🎨 Sistema de Diseño

### Paleta de Colores
```css
/* Colores principales */
--color-primary: #ea751a        /* Naranja principal */
--color-secondary: #22c55e      /* Verde secundario */
--color-accent: #f59e0b        /* Amarillo acento */

/* Colores del Chocó */
--color-terracotta-suave: #d97706
--color-marfil: #fef7ee
--color-marron-cacao: #752d14

/* Estados */
--color-success: #16a34a
--color-warning: #d97706
--color-error: #dc2626
--color-info: #2563eb
```

### Tipografía
- **Fuente Principal**: Inter (sans-serif)
- **Fuente Display**: Poppins (títulos y encabezados)
- **Escalas**: sm (0.875), md (1), lg (1.125)

### Espaciado y Layout
- **Grid System**: CSS Grid con breakpoints responsivos
- **Spacing Scale**: Sistema de espaciado consistente (4px base)
- **Container**: Contenedores responsivos con max-width
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)

## 🔧 Configuración de Vite

### Alias de Paths
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@/components': path.resolve(__dirname, './src/components'),
    '@/hooks': path.resolve(__dirname, './src/hooks'),
    '@/lib': path.resolve(__dirname, './src/lib'),
    '@/types': path.resolve(__dirname, './src/types'),
    '@/utils': path.resolve(__dirname, './src/utils'),
    '@/auth': path.resolve(__dirname, './src/auth'),
    '@/modules': path.resolve(__dirname, './src/modules'),
    '@/pages': path.resolve(__dirname, './src/pages'),
  }
}
```

### Code Splitting
```typescript
rollupOptions: {
  output: {
    manualChunks: {
      vendor: ['react', 'react-dom'],
      supabase: ['@supabase/supabase-js'],
      ui: [
        '@radix-ui/react-dialog',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-label',
        '@radix-ui/react-slot',
      ],
    },
  },
}
```

## 🧩 Componentes Principales

### 1. Layout Components
- **MainLayout**: Layout principal con header, footer y navegación
- **Header**: Encabezado con navegación y controles de usuario
- **Navbar**: Barra de navegación principal
- **Footer**: Pie de página con enlaces y información
- **MobileTabBar**: Navegación móvil optimizada para touch

### 2. UI Components (shadcn/ui)
- **Button**: Botones con variantes y estados
- **Card**: Contenedores de contenido
- **Input**: Campos de entrada con validación
- **Dialog**: Modales y diálogos
- **Checkbox**: Casillas de verificación
- **Label**: Etiquetas para formularios
- **Toaster**: Sistema de notificaciones toast

### 3. Specialized Components
- **OptimizedImage**: Imágenes con lazy loading y placeholders
- **Skeleton**: Indicadores de carga animados
- **Icon**: Sistema de iconos organizado por categorías
- **FormValidation**: Validación en tiempo real de formularios
- **ErrorBoundary**: Captura y manejo de errores
- **ThemeProvider**: Gestión de temas claro/oscuro

## 🎣 Hooks Personalizados

### 1. Data Management
- **useSupabase**: Cliente de Supabase con manejo de errores
- **useCache**: Sistema de cache con TTL y localStorage
- **useForm**: Formularios con validación Zod
- **useDebounce**: Debounce para inputs de búsqueda

### 2. Business Logic
- **useAuth**: Autenticación y gestión de sesión
- **useCart**: Estado del carrito de compras
- **useToast**: Sistema de notificaciones
- **usePerformance**: Monitoreo de métricas de rendimiento

### 3. Security & Validation
- **useSecurity**: Utilidades de seguridad y sanitización
- **useRateLimit**: Rate limiting para formularios
- **useErrorHandling**: Manejo estructurado de errores
- **useDatabaseMonitoring**: Monitoreo de base de datos

## 🚦 Sistema de Rutas

### Rutas Públicas
```typescript
// Rutas accesibles sin autenticación
<Route path="/" element={<Home />} />
<Route path="/productos" element={<ProductCatalog />} />
<Route path="/productos/:id" element={<ProductDetail />} />
<Route path="/auth" element={<AuthPage />} />
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
```

### Rutas Protegidas por Rol
```typescript
// Rutas de comprador
<Route path="/carrito" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
<Route path="/mis-pedidos" element={<ProtectedRoute roles={['comprador']}><MyOrdersPage /></ProtectedRoute>} />

// Rutas de vendedor
<Route path="/vendedor" element={<ProtectedRoute roles={['vendedor']}><VendorDashboard /></ProtectedRoute>} />

// Rutas de administrador
<Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
```

### Lazy Loading
```typescript
// Carga diferida de módulos por rol
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const VendorDashboard = lazy(() => import('./vendor/VendorDashboard'));
const ProductCatalog = lazy(() => import('./buyer/ProductCatalog'));
```

## 🎨 Sistema de Temas

### Configuración de Temas
```typescript
interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'sm' | 'md' | 'lg';
  reducedMotion: boolean;
  autoSwitchTime?: {
    lightStart: string;
    darkStart: string;
  };
}
```

### Implementación
- **ThemeProvider**: Contexto para gestión de temas
- **ThemeToggle**: Componente para cambiar temas
- **CSS Variables**: Variables CSS para colores y espaciado
- **LocalStorage**: Persistencia de preferencias de usuario

## 📱 Responsive Design

### Mobile-First Approach
- **Breakpoints**: Diseño optimizado para móviles primero
- **Touch Interactions**: Interfaz optimizada para dispositivos táctiles
- **Mobile Tab Bar**: Navegación móvil con tabs principales
- **Responsive Grids**: Layouts que se adaptan al tamaño de pantalla

### Adaptive Components
- **Navigation**: Menú hamburguesa para móviles
- **Forms**: Formularios optimizados para diferentes dispositivos
- **Images**: Imágenes responsivas con diferentes tamaños
- **Typography**: Escalas de texto adaptativas

## 🧪 Testing Strategy

### Testing Stack
- **Vitest**: Framework de testing moderno
- **Testing Library**: Utilidades para testing de componentes
- **Happy DOM**: Entorno de testing ligero
- **Coverage**: Reportes de cobertura de código

### Test Files
Ubicados en `src/test/` con Vitest + Testing Library.

### Component Testing
```typescript
// Ejemplo de test de componente
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('should display product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(mockProduct.nombre)).toBeInTheDocument();
    expect(screen.getByText(`$${mockProduct.precio}`)).toBeInTheDocument();
  });
});
```

## 🚀 Performance Optimization

### 1. Code Splitting
- **Route-based**: Separación por rutas principales
- **Component-based**: Carga diferida de componentes pesados
- **Vendor chunks**: Separación de librerías de terceros

### 2. Image Optimization
- **Lazy Loading**: Carga de imágenes solo cuando son visibles
- **Placeholders**: Skeleton loaders durante la carga
- **Responsive Images**: Diferentes tamaños según dispositivo
- **WebP Support**: Formato moderno de imágenes

### 3. Caching Strategy
- **In-memory Cache**: Cache en memoria con TTL configurable
- **LocalStorage**: Persistencia de datos no sensibles
- **Cache Invalidation**: Estrategias inteligentes de invalidación
- **Service Worker**: Cache offline (en producción)

## 🔒 Security Features

### 1. Input Sanitization
- **DOMPurify**: Sanitización de HTML para prevenir XSS
- **Zod Validation**: Validación de esquemas en tiempo de ejecución
- **Rate Limiting**: Protección contra abuso de formularios
- **Content Security Policy**: Headers de seguridad

### 2. Authentication
- **JWT Tokens**: Tokens seguros con expiración
- **Role-based Access**: Control de acceso basado en roles
- **Protected Routes**: Rutas protegidas por autenticación
- **Session Management**: Gestión segura de sesiones

### 3. Error Handling
- **Error Boundaries**: Captura de errores en React
- **Structured Logging**: Logs estructurados sin información sensible
- **User Feedback**: Mensajes de error amigables
- **Fallback UI**: Interfaz de respaldo en caso de errores

## 📊 Monitoring & Analytics

### 1. Performance Monitoring
- **Web Vitals**: LCP, FID, CLS, FCP, TTFB
- **Custom Metrics**: Tiempo de renderizado, navegación
- **Real-time Dashboard**: Dashboard de performance en desarrollo

### 2. Error Tracking
- **Error Boundaries**: Captura de errores en componentes
- **Structured Logging**: Logs con contexto y metadata
- **User Feedback**: Notificaciones para usuarios
- **Retry Logic**: Lógica de reintento para operaciones fallidas

### 3. Security Monitoring
- **CSP Violations**: Monitoreo de violaciones de CSP
- **Rate Limiting**: Estado de límites de tasa
- **Security Level**: Nivel de seguridad actual
- **Audit Logs**: Logs de auditoría para operaciones críticas

## 🔮 Futuras Mejoras

### 1. Performance
- **Service Workers**: Caching offline y PWA
- **WebAssembly**: Cálculos intensivos en el cliente
- **Virtual Scrolling**: Para listas largas de productos
- **Preloading**: Precarga inteligente de recursos

### 2. User Experience
- **Real-time Updates**: WebSockets para actualizaciones en tiempo real
- **Offline Support**: Funcionalidad offline con Service Workers
- **Progressive Web App**: Características de PWA
- **Accessibility**: Mejoras en accesibilidad WCAG 2.1

### 3. Developer Experience
- **Storybook**: Documentación de componentes
- **Design System**: Sistema de diseño más robusto
- **Component Testing**: Mejor cobertura de tests
- **Performance Budgets**: Límites de performance

---

Esta documentación proporciona una visión completa del frontend de Tesoros Chocó, mostrando las tecnologías utilizadas, la arquitectura de componentes y las estrategias implementadas para crear una aplicación web moderna, performante y mantenible.
