import React, { Suspense, useMemo, useEffect } from 'react';
import { AuthProvider } from '@/auth/AuthContext';
import { BrowserRouter, Routes, Route, FutureConfig } from 'react-router-dom';
import MainLayout from '@/components/ui/Layout/MainLayout';
import { Home } from '@/pages/Home';
import { ProtectedRoute } from './ProtectedRoute';
import { Landing } from './Landing';
import { CartProvider } from './buyer/CartContext';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { Toaster } from '@/components/ui/shadcn/toaster';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary';
import { CacheProvider } from '@/components/cache/CacheProvider';
import {
  createRouteComponent,
  preloadRoutes,
  routePrefetcher,
  routePerformanceMonitor,
  RouteConfig
} from '@/lib/routePreloading';

// Optimized lazy-loaded components with intelligent preloading
const AuthPage = createRouteComponent(
  () => import('@/pages/Auth'),
  'auth',
  { preload: false, priority: 'low' }
);

const LoginPage = createRouteComponent(
  () => import('@/pages/Login'),
  'login',
  { preload: true, priority: 'high' }
);

const RegisterPage = createRouteComponent(
  () => import('@/pages/Register'),
  'register',
  { preload: true, priority: 'medium' }
);

const VerifyEmailPage = createRouteComponent(
  () => import('@/pages/VerifyEmail'),
  'verify-email',
  { preload: false, priority: 'low' }
);

const ForgotPasswordPage = createRouteComponent(
  () => import('@/pages/ForgotPassword'),
  'forgot-password',
  { preload: false, priority: 'low' }
);

const ResetPasswordPage = createRouteComponent(
  () => import('@/pages/ResetPassword'),
  'reset-password',
  { preload: false, priority: 'low' }
);

// Admin modules - preload for admin users
const AdminDashboard = createRouteComponent(
  () => import('./admin/AdminDashboard'),
  'admin-dashboard',
  { preload: false, priority: 'medium' }
);

const CategoriesAdmin = createRouteComponent(
  () => import('./admin/CategoriesAdmin'),
  'admin-categories',
  { preload: false, priority: 'low' }
);

const UsersAdmin = createRouteComponent(
  () => import('./admin/UsersAdmin'),
  'admin-users',
  { preload: false, priority: 'low' }
);

const ModerationAdmin = createRouteComponent(
  () => import('./admin/ModerationAdmin'),
  'admin-moderation',
  { preload: false, priority: 'low' }
);

const MetricsAdmin = createRouteComponent(
  () => import('./admin/MetricsAdmin'),
  'admin-metrics',
  { preload: false, priority: 'low' }
);

const AuditLogAdmin = createRouteComponent(
  () => import('./admin/AuditLogAdmin'),
  'admin-audit',
  { preload: false, priority: 'low' }
);

const AdminSettings = createRouteComponent(
  () => import('./admin/AdminSettings'),
  'admin-settings',
  { preload: false, priority: 'low' }
);

// Vendor modules
const VendorDashboard = createRouteComponent(
  () => import('./vendor/VendorDashboard'),
  'vendor-dashboard',
  { preload: false, priority: 'medium' }
);

// Buyer modules - high priority for main user flows
const ProductCatalog = createRouteComponent(
  () => import('./buyer/ProductCatalog'),
  'product-catalog',
  { preload: true, priority: 'high' }
);

const ProductDetail = createRouteComponent(
  () => import('./buyer/ProductDetail'),
  'product-detail',
  { preload: true, priority: 'high' }
);

const CartPage = createRouteComponent(
  () => import('./buyer/CartPage'),
  'cart',
  { preload: true, priority: 'medium' }
);

const MyOrdersPage = createRouteComponent(
  () => import('./buyer/MyOrdersPage'),
  'my-orders',
  { preload: false, priority: 'medium' }
);

const ReviewsPage = createRouteComponent(
  () => import('./buyer/ReviewsPage'),
  'reviews',
  { preload: false, priority: 'low' }
);

const CheckoutPage = createRouteComponent(
  () => import('./buyer/CheckoutPage'),
  'checkout',
  { preload: true, priority: 'medium' }
);

const OrderReceiptPage = createRouteComponent(
  () => import('./buyer/OrderReceiptPage'),
  'order-receipt',
  { preload: false, priority: 'low' }
);

const OrderDetailPage = createRouteComponent(
  () => import('./buyer/OrderDetailPage'),
  'order-detail',
  { preload: false, priority: 'medium' }
);

const BuyerProfile = createRouteComponent(
  () => import('./buyer/BuyerProfile'),
  'buyer-profile',
  { preload: false, priority: 'medium' }
);

const BuyerProfilesManager = createRouteComponent(
  () => import('./buyer/ProfilesManager'),
  'profiles-manager',
  { preload: false, priority: 'low' }
);

// Enhanced loading component with progressive states
const LoadingSpinner = React.memo(() => {
  const [loadingText, setLoadingText] = React.useState('Cargando…');
  
  React.useEffect(() => {
    const texts = ['Cargando…', 'Preparando contenido…', 'Casi listo…'];
    let index = 0;
    
    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setLoadingText(texts[index]);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="container py-10 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-2">{loadingText}</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

// Memoized future config
const futureConfig: FutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as unknown as FutureConfig;

// Route configuration for intelligent preloading
const routeConfigs: RouteConfig[] = [
  {
    path: '/productos',
    component: () => import('./buyer/ProductCatalog'),
    preload: true,
    priority: 'high'
  },
  {
    path: '/login',
    component: () => import('@/pages/Login'),
    preload: true,
    priority: 'high'
  },
  {
    path: '/register',
    component: () => import('@/pages/Register'),
    preload: true,
    priority: 'medium'
  },
  {
    path: '/carrito',
    component: () => import('./buyer/CartPage'),
    preload: true,
    priority: 'medium'
  },
  {
    path: '/checkout',
    component: () => import('./buyer/CheckoutPage'),
    preload: true,
    priority: 'medium'
  }
];

export const App: React.FC = () => {
  // Initialize route prefetching and performance monitoring
  useEffect(() => {
    // Start performance monitoring
    routePerformanceMonitor.startTiming('app-init');
    
    // Preload critical routes
    preloadRoutes(routeConfigs);
    
    // Setup intersection observer for link prefetching
    const timer = setTimeout(() => {
      routePrefetcher.observeLinks();
    }, 1000); // Delay to avoid blocking initial render
    
    // End performance monitoring
    routePerformanceMonitor.endTiming('app-init');
    
    return () => {
      clearTimeout(timer);
      routePrefetcher.destroy();
    };
  }, []);

  // Memoized routes to prevent unnecessary re-renders
  const routes = useMemo(() => (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/productos" element={<ProductCatalog />} />
      <Route path="/productos/:id" element={<ProductDetail />} />
      <Route path="/demo" element={<Landing />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verifica-tu-correo" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected buyer routes */}
      <Route
        path="/carrito"
        element={
          <ProtectedRoute roles={['comprador']}>
            <CartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pagar"
        element={
          <ProtectedRoute roles={['comprador']}>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute roles={['comprador']}>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recibo/:id"
        element={
          <ProtectedRoute roles={['comprador', 'admin']}>
            <OrderReceiptPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pedido/:id"
        element={
          <ProtectedRoute roles={['comprador', 'admin']}>
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-pedidos"
        element={
          <ProtectedRoute roles={['comprador']}>
            <MyOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-calificaciones"
        element={
          <ProtectedRoute roles={['comprador']}>
            <ReviewsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute roles={['comprador']}>
            <BuyerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil/perfiles"
        element={
          <ProtectedRoute roles={['comprador']}>
            <BuyerProfilesManager />
          </ProtectedRoute>
        }
      />

      {/* Protected admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categorias"
        element={
          <ProtectedRoute roles={['admin']}>
            <CategoriesAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute roles={['admin']}>
            <UsersAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/moderacion"
        element={
          <ProtectedRoute roles={['admin']}>
            <ModerationAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/metricas"
        element={
          <ProtectedRoute roles={['admin']}>
            <MetricsAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/auditoria"
        element={
          <ProtectedRoute roles={['admin']}>
            <AuditLogAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/configuracion"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminSettings />
          </ProtectedRoute>
        }
      />

      {/* Protected vendor routes */}
      <Route
        path="/vendedor"
        element={
          <ProtectedRoute roles={['vendedor']}>
            <VendorDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  ), []);

  return (
    <PageErrorBoundary>
      <ThemeProvider>
        <CacheProvider>
          <AuthProvider>
            <BrowserRouter future={futureConfig}>
              <CartProvider>
                <ToastProvider>
                  <MainLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      {routes}
                    </Suspense>
                  </MainLayout>
                  <Toaster position="top-right" richColors closeButton />
                </ToastProvider>
              </CartProvider>
            </BrowserRouter>
          </AuthProvider>
        </CacheProvider>
      </ThemeProvider>
    </PageErrorBoundary>
  );
};
