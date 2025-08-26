import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { CartProvider } from '@/modules/buyer/CartContext';
import { CacheProvider } from '@/components/cache/CacheProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import MainLayout from '@/components/ui/Layout/MainLayout';
import ProtectedRoute from '@/modules/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Lazy load pages for better performance
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Profile = lazy(() => import('@/pages/Profile'));
const VendorDashboard = lazy(() => import('@/pages/VendorDashboard'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const Products = lazy(() => import('@/pages/Products'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Cart = lazy(() => import('@/pages/Cart'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const Orders = lazy(() => import('@/pages/Orders'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <CacheProvider>
              <CartProvider>
                <Router
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <MainLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/productos" element={<Products />} />
                        <Route path="/productos/:id" element={<ProductDetail />} />
                        
                        {/* Protected routes */}
                        <Route
                          path="/perfil"
                          element={
                            <ProtectedRoute>
                              <Profile />
                            </ProtectedRoute>
                          }
                        />
                        
                        <Route
                          path="/vendedor/*"
                          element={
                            <ProtectedRoute requiredRole="vendedor">
                              <VendorDashboard />
                            </ProtectedRoute>
                          }
                        />
                        
                        <Route
                          path="/admin/*"
                          element={
                            <ProtectedRoute requiredRole="admin">
                              <AdminDashboard />
                            </ProtectedRoute>
                          }
                        />
                        
                        <Route
                          path="/carrito"
                          element={
                            <ProtectedRoute requiredRole="comprador">
                              <Cart />
                            </ProtectedRoute>
                          }
                        />
                        
                        <Route
                          path="/checkout"
                          element={
                            <ProtectedRoute requiredRole="comprador">
                              <Checkout />
                            </ProtectedRoute>
                          }
                        />
                        
                        <Route
                          path="/pedidos"
                          element={
                            <ProtectedRoute requiredRole="comprador">
                              <Orders />
                            </ProtectedRoute>
                          }
                        />
                        
                        {/* 404 route */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </MainLayout>
                </Router>
              </CartProvider>
            </CacheProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
