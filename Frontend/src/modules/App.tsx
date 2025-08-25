import React, { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { CartProvider } from '@/modules/buyer/CartContext';
import { CacheProvider } from '@/components/cache/CacheProvider';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toaster } from '@/components/ui/shadcn/toaster';
import MainLayout from '@/components/ui/Layout/MainLayout';
import LoadingSpinner from '@/components/ui/Skeleton';

// Lazy load pages for better performance
const Landing = lazy(() => import('@/modules/Landing').then(module => ({ default: module.Landing })));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));

// Buyer pages
const ProductCatalog = lazy(() => import('@/modules/buyer/ProductCatalog'));
const ProductDetail = lazy(() => import('@/modules/buyer/ProductDetail'));
const CartPage = lazy(() => import('@/modules/buyer/CartPage'));
const CheckoutPage = lazy(() => import('@/modules/buyer/CheckoutPage'));
const MyOrdersPage = lazy(() => import('@/modules/buyer/MyOrdersPage'));
const OrderDetailPage = lazy(() => import('@/modules/buyer/OrderDetailPage'));
const OrderReceiptPage = lazy(() => import('@/modules/buyer/OrderReceiptPage'));
const BuyerProfile = lazy(() => import('@/modules/buyer/BuyerProfile'));
const ReviewsPage = lazy(() => import('@/modules/buyer/ReviewsPage'));

// Admin pages
const AdminDashboard = lazy(() => import('@/modules/admin/AdminDashboard'));
const UsersAdmin = lazy(() => import('@/modules/admin/UsersAdmin'));
const CategoriesAdmin = lazy(() => import('@/modules/admin/CategoriesAdmin'));
const MetricsAdmin = lazy(() => import('@/modules/admin/MetricsAdmin'));
const ModerationAdmin = lazy(() => import('@/modules/admin/ModerationAdmin'));
const AuditLogAdmin = lazy(() => import('@/modules/admin/AuditLogAdmin'));
const AdminSettings = lazy(() => import('@/modules/admin/AdminSettings'));

// Vendor pages
const VendorDashboard = lazy(() => import('@/modules/vendor/VendorDashboard'));

// Memoized LoadingSpinner to prevent unnecessary re-renders
const MemoizedLoadingSpinner = React.memo(LoadingSpinner);

// Memoized future config for BrowserRouter
const futureConfig = useMemo(() => ({
  v7_startTransition: true,
}), []);

// Memoized Routes component tree
const AppRoutes = useMemo(() => (
  <Routes>
    {/* Public routes */}
    <Route path='/' element={<Landing />} />
    <Route path='/login' element={<Login />} />
    <Route path='/register' element={<Register />} />
    <Route path='/forgot-password' element={<ForgotPassword />} />
    <Route path='/reset-password' element={<ResetPassword />} />
    <Route path='/verify-email' element={<VerifyEmail />} />

    {/* Protected buyer routes */}
    <Route
      path='/productos'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <ProductCatalog />
          </Suspense>
        </MainLayout>
      }
    />

    <Route
      path='/producto/:id'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <ProductDetail />
          </Suspense>
        </MainLayout>
      }
    />

    <Route
      path='/carrito'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <CartPage />
          </Suspense>
        </MainLayout>
      }
    />

    <Route
      path='/checkout'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <CheckoutPage />
          </Suspense>
        </MainLayout>
      }
    />

    <Route
      path='/mis-pedidos'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <MyOrdersPage />
          </Suspense>
        </MainLayout>
      }
    />

    <Route
      path='/pedido/:id'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <OrderDetailPage />
          </Suspense>
        </MainLayout>
      }
    />

    <Route
      path='/recibo/:id'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <OrderReceiptPage />
          </Suspense>
        </MainLayout>
      }
    />

    <Route
      path='/perfil'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <BuyerProfile />
          </Suspense>
        </MainLayout>
      }
    />

    <Route
      path='/reviews'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <ReviewsPage />
          </Suspense>
        </MainLayout>
      }
    />

    {/* Protected admin routes */}
    <Route
      path='/admin'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <AdminDashboard />
          </Suspense>
        </MainLayout>
      }
    />

    <Route
      path='/admin/users'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <UsersAdmin />
          </Suspense>
        </MainLayout>
      }
    />

    <Route
      path='/admin/categories'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <CategoriesAdmin />
          </Suspense>
        </MainLayout>
      }
    />

    <Route
      path='/admin/metrics'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <MetricsAdmin />
          </Suspense>
        </MainLayout>
      }
    />

    <Route
      path='/admin/moderation'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <ModerationAdmin />
          </Suspense>
        </MainLayout>
      }
    />

    <Route
      path='/admin/audit'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <AuditLogAdmin />
          </Suspense>
        </MainLayout>
      }
    />

    <Route
      path='/admin/settings'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <AdminSettings />
          </Suspense>
        </MainLayout>
      }
    />

    {/* Protected vendor routes */}
    <Route
      path='/vendedor'
      element={
        <MainLayout>
          <Suspense fallback={<MemoizedLoadingSpinner />}>
            <VendorDashboard />
          </Suspense>
        </MainLayout>
      }
    />

    {/* Catch-all route */}
    <Route
      path='*'
      element={
        <MainLayout>
          <div className='container mx-auto px-4 py-8 text-center'>
            <h1 className='text-4xl font-bold text-destructive mb-4'>404</h1>
            <p className='text-xl text-muted-foreground mb-6'>
              Página no encontrada
            </p>
            <a
              href='/'
              className='inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
            >
              Volver al inicio
            </a>
          </div>
        </MainLayout>
      }
    />
  </Routes>
), []);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter future={futureConfig}>
        <AuthProvider>
          <CartProvider>
            <CacheProvider>
              <ThemeProvider>
                {AppRoutes}
                <Toaster position='top-right' richColors closeButton />
              </ThemeProvider>
            </CacheProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
