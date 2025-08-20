import React, { Suspense, lazy } from 'react';
import { AuthProvider } from '../auth/AuthContext';
import { BrowserRouter, Routes, Route, FutureConfig } from 'react-router-dom';
import MainLayout from '../components/ui/Layout/MainLayout';
import { Home } from '../pages/Home';
const AuthPage = lazy(() => import('../pages/Auth'));
const LoginPage = lazy(() => import('../pages/Login'));
const RegisterPage = lazy(() => import('../pages/Register'));
const VerifyEmailPage = lazy(() => import('../pages/VerifyEmail'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPassword'));
import { ProtectedRoute } from './ProtectedRoute';
import { Landing } from './Landing';

// Import new role-based modules
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const CategoriesAdmin = lazy(() => import('./admin/CategoriesAdmin'));
const UsersAdmin = lazy(() => import('./admin/UsersAdmin'));
const ModerationAdmin = lazy(() => import('./admin/ModerationAdmin'));
const MetricsAdmin = lazy(() => import('./admin/MetricsAdmin'));
const AuditLogAdmin = lazy(() => import('./admin/AuditLogAdmin'));
const AdminSettings = lazy(() => import('./admin/AdminSettings'));
const VendorDashboard = lazy(() => import('./vendor/VendorDashboard'));
const ProductCatalog = lazy(() => import('./buyer/ProductCatalog'));
import { CartProvider } from './buyer/CartContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { Toaster } from '../components/ui/shadcn/toaster';
const ProductDetail = lazy(() => import('./buyer/ProductDetail'));
const CartPage = lazy(() => import('./buyer/CartPage'));
const MyOrdersPage = lazy(() => import('./buyer/MyOrdersPage'));
const ReviewsPage = lazy(() => import('./buyer/ReviewsPage'));
const CheckoutPage = lazy(() => import('./buyer/CheckoutPage'));
const OrderReceiptPage = lazy(() => import('./buyer/OrderReceiptPage'));
const OrderDetailPage = lazy(() => import('./buyer/OrderDetailPage'));
const BuyerProfile = lazy(() => import('./buyer/BuyerProfile'));
const BuyerProfilesManager = lazy(() => import('./buyer/ProfilesManager'));

export const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true } as unknown as FutureConfig}>
      <CartProvider>
        <ToastProvider>
          <MainLayout>
          <Suspense fallback={<div className="container py-10">Cargando…</div>}>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<ProductCatalog />} />
          <Route path="/productos/:id" element={<ProductDetail />} />
          <Route path="/carrito" element={<ProtectedRoute roles={["comprador"]}><CartPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute roles={["comprador"]}><CheckoutPage /></ProtectedRoute>} />
          <Route path="/recibo/:id" element={<ProtectedRoute roles={["comprador","admin"]}><OrderReceiptPage /></ProtectedRoute>} />
          <Route path="/pedido/:id" element={<ProtectedRoute roles={["comprador","admin"]}><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/mis-pedidos" element={<ProtectedRoute roles={["comprador"]}><MyOrdersPage /></ProtectedRoute>} />
          <Route path="/mis-calificaciones" element={<ProtectedRoute roles={["comprador"]}><ReviewsPage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute roles={["comprador"]}><BuyerProfile /></ProtectedRoute>} />
          <Route path="/perfil/perfiles" element={<ProtectedRoute roles={["comprador"]}><BuyerProfilesManager /></ProtectedRoute>} />
          <Route path="/demo" element={<Landing />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verifica-tu-correo" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Protected Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/categorias" 
            element={
              <ProtectedRoute roles={["admin"]}>
                <CategoriesAdmin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/usuarios" 
            element={
              <ProtectedRoute roles={["admin"]}>
                <UsersAdmin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/moderacion" 
            element={
              <ProtectedRoute roles={["admin"]}>
                <ModerationAdmin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/metricas" 
            element={
              <ProtectedRoute roles={["admin"]}>
                <MetricsAdmin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/auditoria" 
            element={
              <ProtectedRoute roles={["admin"]}>
                <AuditLogAdmin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/configuracion" 
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vendedor" 
            element={
              <ProtectedRoute roles={["vendedor"]}>
                <VendorDashboard />
              </ProtectedRoute>
            } 
          />
          </Routes>
          </Suspense>
          </MainLayout>
          <Toaster position="top-right" richColors closeButton />
        </ToastProvider>
      </CartProvider>
    </BrowserRouter>
  </AuthProvider>
);
