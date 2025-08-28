import React, { Suspense, lazy } from 'react';
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

// Lazy load pages for better performance
const LoginPage = lazy(() => import('@/pages/Login'));
const RegisterPage = lazy(() => import('@/pages/Register'));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmail'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPassword'));

// Admin modules
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const CategoriesAdmin = lazy(() => import('./admin/CategoriesAdmin'));
const UsersAdmin = lazy(() => import('./admin/UsersAdmin'));
const ModerationAdmin = lazy(() => import('./admin/ModerationAdmin'));
const MetricsAdmin = lazy(() => import('./admin/MetricsAdmin'));
const AuditLogAdmin = lazy(() => import('./admin/AuditLogAdmin'));
const AdminSettings = lazy(() => import('./admin/AdminSettings'));

// Vendor modules
const VendorDashboard = lazy(() => import('./vendor/VendorDashboard'));

// Buyer modules
const ProductCatalog = lazy(() => import('./buyer/ProductCatalog'));
const ProductDetail = lazy(() => import('./buyer/ProductDetail'));
const CartPage = lazy(() => import('./buyer/CartPage'));
const MyOrdersPage = lazy(() => import('./buyer/MyOrdersPage'));
const ReviewsPage = lazy(() => import('./buyer/ReviewsPage'));
const CheckoutPage = lazy(() => import('./buyer/CheckoutPage'));
const OrderReceiptPage = lazy(() => import('./buyer/OrderReceiptPage'));
const OrderDetailPage = lazy(() => import('./buyer/OrderDetailPage'));
const BuyerProfile = lazy(() => import('./buyer/BuyerProfile'));
const BuyerProfilesManager = lazy(() => import('./buyer/ProfilesManager'));

// Loading component
const LoadingSpinner = () => (
  <div className='container py-10 flex items-center justify-center'>
    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
    <span className='ml-2'>Cargando…</span>
  </div>
);

export const App: React.FC = () => (
  <PageErrorBoundary>
    <ThemeProvider>
      <CacheProvider>
        <AuthProvider>
          <BrowserRouter
            future={
              {
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              } as unknown as FutureConfig
            }
          >
            <CartProvider>
              <ToastProvider>
                <MainLayout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      {/* Public routes */}
                      <Route path='/' element={<Home />} />
                      <Route path='/productos' element={<ProductCatalog />} />
                      <Route
                        path='/productos/:id'
                        element={<ProductDetail />}
                      />
                      <Route path='/demo' element={<Landing />} />
                      <Route path='/login' element={<LoginPage />} />
                      <Route path='/register' element={<RegisterPage />} />
                      <Route
                        path='/verifica-tu-correo'
                        element={<VerifyEmailPage />}
                      />
                      <Route
                        path='/forgot-password'
                        element={<ForgotPasswordPage />}
                      />
                      <Route
                        path='/reset-password'
                        element={<ResetPasswordPage />}
                      />

                      {/* Protected buyer routes */}
                      <Route
                        path='/carrito'
                        element={
                          <ProtectedRoute roles={['comprador']}>
                            <CartPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/pagar'
                        element={
                          <ProtectedRoute roles={['comprador']}>
                            <CheckoutPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/checkout'
                        element={
                          <ProtectedRoute roles={['comprador']}>
                            <CheckoutPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/recibo/:id'
                        element={
                          <ProtectedRoute roles={['comprador', 'admin']}>
                            <OrderReceiptPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/pedido/:id'
                        element={
                          <ProtectedRoute roles={['comprador', 'admin']}>
                            <OrderDetailPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/mis-pedidos'
                        element={
                          <ProtectedRoute roles={['comprador']}>
                            <MyOrdersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/mis-calificaciones'
                        element={
                          <ProtectedRoute roles={['comprador']}>
                            <ReviewsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/perfil'
                        element={
                          <ProtectedRoute roles={['comprador']}>
                            <BuyerProfile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/perfil/perfiles'
                        element={
                          <ProtectedRoute roles={['comprador']}>
                            <BuyerProfilesManager />
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected admin routes */}
                      <Route
                        path='/admin'
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/admin/categorias'
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <CategoriesAdmin />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/admin/usuarios'
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <UsersAdmin />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/admin/moderacion'
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <ModerationAdmin />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/admin/metricas'
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <MetricsAdmin />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/admin/auditoria'
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <AuditLogAdmin />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path='/admin/configuracion'
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <AdminSettings />
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected vendor routes */}
                      <Route
                        path='/vendedor'
                        element={
                          <ProtectedRoute roles={['vendedor']}>
                            <VendorDashboard />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </Suspense>
                </MainLayout>
                <Toaster position='top-right' richColors closeButton />
              </ToastProvider>
            </CartProvider>
          </BrowserRouter>
        </AuthProvider>
      </CacheProvider>
    </ThemeProvider>
  </PageErrorBoundary>
);
