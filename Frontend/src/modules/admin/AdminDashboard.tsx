import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useToastWithAuth } from '@/hooks/useToast';
import AdminLayout from './AdminLayout';
import Icon from '@/components/ui/Icon';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Constants
const MAX_PENDING_VENDORS_DISPLAY = 5;

// Types
interface User {
  id: string;
  email: string;
  nombre_completo?: string;
  created_at: string;
  role: string;
  vendedor_estado?: string;
}

interface Order {
  id: string;
  total: number;
  created_at: string;
}

interface Product {
  id: string;
  nombre: string;
  precio: number;
}

interface NotificationConfig {
  enabled: boolean;
  from?: string;
}

interface DashboardStats {
  totalVendedores: number;
  vendedoresPendientes: number;
  totalProductos: number;
  totalPedidos: number;
  ventasDelMes: number;
}

interface PendingVendor {
  id: string;
  email: string;
  nombre_completo?: string;
  created_at: string;
}

// Utility functions
const getNotificationConfig = async (): Promise<NotificationConfig> => {
  try {
    const [{ data: notif }, { data: sender }] = await Promise.all([
      supabase
        .from('app_config')
        .select('value')
        .eq('key', 'notify_vendor_email_enabled')
        .maybeSingle(),
      supabase
        .from('app_config')
        .select('value')
        .eq('key', 'notify_from')
        .maybeSingle(),
    ]);
    
    return {
      enabled: notif?.value?.enabled ?? true,
      from: sender?.value?.from ?? undefined,
    };
  } catch (error) {
    console.error('Error loading notification config:', error);
    return { enabled: true };
  }
};

const sendVendorNotification = async (
  action: 'aprobado' | 'rechazado',
  vendor: PendingVendor,
  config: NotificationConfig
): Promise<void> => {
  if (!config.enabled) return;

  try {
    const session = (await supabase.auth.getSession()).data.session;
    const token = session?.access_token;
    const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
    
    if (!supaUrl) {
      console.warn('VITE_SUPABASE_URL not configured');
      return;
    }

    const projectRef = new URL(supaUrl).host.split('.')[0];
    const functionsUrl = `https://${projectRef}.functions.supabase.co/notify-vendor-status`;
    
    await fetch(functionsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        action,
        email: vendor.email,
        nombre: vendor.nombre_completo,
        from: config.from,
      }),
    });
  } catch (error) {
    console.warn(`[notify] Failed to send ${action} notification:`, error);
  }
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingVendor, setProcessingVendor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToastWithAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate start of current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Execute all queries in parallel
      const [vendedoresResult, productosResult, pedidosResult, pedidosMesResult] =
        await Promise.all([
          supabase.from('users').select('*').eq('role', 'vendedor'),
          supabase.from('productos').select('*'),
          supabase.from('orders').select('*'),
          supabase
            .from('orders')
            .select('total, created_at')
            .gte('created_at', startOfMonth.toISOString()),
        ]);

      // Handle potential errors from queries
      if (vendedoresResult.error) {
        throw new Error(`Error loading vendors: ${vendedoresResult.error.message}`);
      }
      if (productosResult.error) {
        throw new Error(`Error loading products: ${productosResult.error.message}`);
      }
      if (pedidosResult.error) {
        throw new Error(`Error loading orders: ${pedidosResult.error.message}`);
      }
      if (pedidosMesResult.error) {
        throw new Error(`Error loading monthly orders: ${pedidosMesResult.error.message}`);
      }

      const vendors = vendedoresResult.data as User[];
      const products = productosResult.data as Product[];
      const orders = pedidosResult.data as Order[];
      const monthlyOrders = pedidosMesResult.data as Order[];

      // Filter pending vendors
      const vendedoresPendientes = vendors.filter(
        vendor => vendor.vendedor_estado === 'pendiente'
      );

      // Calculate monthly sales total
      const ventasDelMes = monthlyOrders.reduce(
        (acc, order) => acc + Number(order.total || 0),
        0
      );

      // Update stats state
      setStats({
        totalVendedores: vendors.length,
        vendedoresPendientes: vendedoresPendientes.length,
        totalProductos: products.length,
        totalPedidos: orders.length,
        ventasDelMes,
      });

      // Update pending vendors list (limit display)
      setPendingVendors(vendedoresPendientes.slice(0, MAX_PENDING_VENDORS_DISPLAY));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error loading dashboard data:', error);
      setError(errorMessage);
      toastError('Error al cargar los datos del panel', {
        role: 'admin',
        action: 'generic',
      });
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  const approveVendor = useCallback(async (vendorId: string) => {
    if (processingVendor) return; // Prevent concurrent operations
    
    try {
      setProcessingVendor(vendorId);
      
      // Update vendor status in database
      const { error } = await supabase
        .from('users')
        .update({ vendedor_estado: 'aprobado' })
        .eq('id', vendorId);

      if (error) {
        throw new Error(`Database update failed: ${error.message}`);
      }

      // Find the vendor for notification
      const vendor = pendingVendors.find(v => v.id === vendorId);
      if (!vendor) {
        throw new Error('Vendor not found in pending list');
      }

      // Load notification config and send notification
      const notificationConfig = await getNotificationConfig();
      await sendVendorNotification('aprobado', vendor, notificationConfig);

      // Update local state
      setPendingVendors(prev => prev.filter(v => v.id !== vendorId));
      setStats(prev =>
        prev
          ? {
              ...prev,
              vendedoresPendientes: prev.vendedoresPendientes - 1,
            }
          : null
      );

      toastSuccess('Vendedor aprobado exitosamente', {
        role: 'admin',
        action: 'approve',
      });
    } catch (error) {
      console.error('Error approving vendor:', error);
      toastError(
        error instanceof Error ? error.message : 'Error al aprobar vendedor',
        {
          role: 'admin',
          action: 'approve',
        }
      );
    } finally {
      setProcessingVendor(null);
    }
  }, [pendingVendors, processingVendor, toastSuccess, toastError]);

  const rejectVendor = useCallback(async (vendorId: string) => {
    if (processingVendor) return; // Prevent concurrent operations
    
    try {
      setProcessingVendor(vendorId);
      
      // Update vendor status in database
      const { error } = await supabase
        .from('users')
        .update({ vendedor_estado: 'rechazado' })
        .eq('id', vendorId);

      if (error) {
        throw new Error(`Database update failed: ${error.message}`);
      }

      // Find the vendor for notification
      const vendor = pendingVendors.find(v => v.id === vendorId);
      if (!vendor) {
        throw new Error('Vendor not found in pending list');
      }

      // Load notification config and send notification
      const notificationConfig = await getNotificationConfig();
      await sendVendorNotification('rechazado', vendor, notificationConfig);

      // Update local state
      setPendingVendors(prev => prev.filter(v => v.id !== vendorId));
      setStats(prev =>
        prev
          ? {
              ...prev,
              vendedoresPendientes: prev.vendedoresPendientes - 1,
            }
          : null
      );

      toastSuccess('Vendedor rechazado', { role: 'admin', action: 'reject' });
    } catch (error) {
      console.error('Error rejecting vendor:', error);
      toastError(
        error instanceof Error ? error.message : 'Error al rechazar vendedor',
        {
          role: 'admin',
          action: 'reject',
        }
      );
    } finally {
      setProcessingVendor(null);
    }
  }, [pendingVendors, processingVendor, toastSuccess, toastError]);

  if (loading) {
    return (
      <div className='container py-8'>
        <LoadingSpinner size='lg' text='Cargando panel de administración...' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='container py-8'>
        <div className='flex flex-col items-center justify-center space-y-4'>
          <Icon
            category='Estados y Feedback'
            name='BiExclamationTriangle'
            className='w-12 h-12 text-red-500'
          />
          <h2 className='text-xl font-semibold text-gray-900'>Error al cargar datos</h2>
          <p className='text-gray-600 text-center max-w-md'>{error}</p>
          <button
            onClick={loadDashboardData}
            className='btn btn-primary'
          >
            <Icon
              category='Estados y Feedback'
              name='HugeiconsReload'
              className='w-4 h-4 mr-2'
            />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      title='Panel de Administración'
      subtitle='Gestiona vendedores, productos y supervisa las métricas del marketplace'
    >
      {/* Header Actions */}
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className='btn btn-outline btn-sm'
          title='Actualizar datos'
        >
          <Icon
            category='Estados y Feedback'
            name='HugeiconsReload'
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
          />
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>
      {/* Estadísticas */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
          <div className='card'>
            <div className='card-body'>
              <div className='flex items-center'>
                <div className='p-3 rounded-lg bg-blue-100 text-blue-600'>
                  <Icon
                    category='Administrador'
                    name='Users'
                    className='w-6 h-6'
                  />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-500'>
                    Total Vendedores
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.totalVendedores}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='card'>
            <div className='card-body'>
              <div className='flex items-center'>
                <div className='p-3 rounded-lg bg-yellow-100 text-yellow-600'>
                  <Icon
                    category='Pedidos'
                    name='CarbonPendingFilled'
                    className='w-6 h-6'
                  />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-500'>
                    Pendientes
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.vendedoresPendientes}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='card'>
            <div className='card-body'>
              <div className='flex items-center'>
                <div className='p-3 rounded-lg bg-green-100 text-green-600'>
                  <Icon
                    category='Catálogo y producto'
                    name='BxsPackage'
                    className='w-6 h-6'
                  />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-500'>
                    Total Productos
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.totalProductos}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='card'>
            <div className='card-body'>
              <div className='flex items-center'>
                <div className='p-3 rounded-lg bg-purple-100 text-purple-600'>
                  <Icon
                    category='Pedidos'
                    name='MaterialSymbolsOrdersOutlineRounded'
                    className='w-6 h-6'
                  />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-500'>
                    Total Pedidos
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {stats.totalPedidos}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='card'>
            <div className='card-body'>
              <div className='flex items-center'>
                <div className='p-3 rounded-lg bg-indigo-100 text-indigo-600'>
                  <Icon
                    category='Carrito y checkout'
                    name='VaadinWallet'
                    className='w-6 h-6'
                  />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-500'>
                    Ventas del Mes
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    ${stats.ventasDelMes}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vendedores Pendientes */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div className='card'>
          <div className='card-header'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Vendedores Pendientes de Aprobación
            </h2>
          </div>
          <div className='card-body'>
            {pendingVendors.length === 0 ? (
              <p className='text-gray-500 text-center py-4'>
                No hay vendedores pendientes
              </p>
            ) : (
              <div className='space-y-4'>
                {pendingVendors.map(vendor => (
                  <div
                    key={vendor.id}
                    className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                  >
                    <div>
                      <h3 className='font-medium text-gray-900'>
                        {vendor.nombre_completo || vendor.email}
                      </h3>
                      <p className='text-sm text-gray-500'>{vendor.email}</p>
                      <p className='text-xs text-gray-400'>
                        Registrado:{' '}
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className='flex space-x-2'>
                      <button
                        onClick={() => approveVendor(vendor.id)}
                        disabled={processingVendor === vendor.id}
                        className='btn btn-accent btn-sm'
                      >
                        {processingVendor === vendor.id ? (
                          <>
                            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                            Procesando...
                          </>
                        ) : (
                          'Aprobar'
                        )}
                      </button>
                      <button
                        onClick={() => rejectVendor(vendor.id)}
                        disabled={processingVendor === vendor.id}
                        className='btn btn-danger btn-sm'
                      >
                        {processingVendor === vendor.id ? (
                          <>
                            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                            Procesando...
                          </>
                        ) : (
                          'Rechazar'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className='card'>
          <div className='card-header'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Acciones Rápidas
            </h2>
          </div>
          <div className='card-body'>
            <div className='space-y-4'>
              <button
                className='w-full btn btn-primary justify-start'
                onClick={() => navigate('/admin/categorias')}
              >
                <Icon
                  category='Navegación principal'
                  name='MdiGrid'
                  className='w-5 h-5 mr-2'
                />
                Crear Nueva Categoría
              </button>

              <button
                className='w-full btn btn-outline justify-start'
                onClick={() => navigate('/admin/metricas')}
              >
                <Icon
                  category='Administrador'
                  name='BarChart3'
                  className='w-5 h-5 mr-2'
                />
                Ver Métricas Detalladas
              </button>

              <button
                className='w-full btn btn-outline justify-start'
                onClick={() => navigate('/admin/usuarios')}
              >
                <Icon
                  category='Administrador'
                  name='Users'
                  className='w-5 h-5 mr-2'
                />
                Gestionar Usuarios
              </button>

              <button
                className='w-full btn btn-outline justify-start'
                onClick={() => navigate('/admin/moderacion')}
              >
                <Icon
                  category='Administrador'
                  name='Gavel'
                  className='w-5 h-5 mr-2'
                />
                Moderación de Contenido
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
