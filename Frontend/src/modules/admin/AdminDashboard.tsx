import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/ui/ToastProvider';
import AdminLayout from './AdminLayout';
import Icon from '@/components/ui/Icon';

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

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Cargar estadísticas
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [vendedoresResult, productosResult, pedidosResult, pedidosMesResult] = await Promise.all([
        supabase.from('users').select('*').eq('role', 'vendedor'),
        supabase.from('productos').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('orders').select('total, created_at').gte('created_at', startOfMonth.toISOString())
      ]);

      if (vendedoresResult.data && productosResult.data && pedidosResult.data) {
        const vendedoresPendientes = vendedoresResult.data.filter(v => v.vendedor_estado === 'pendiente');
        
        const ventasDelMes = (pedidosMesResult.data || []).reduce((acc, o: any) => acc + Number(o.total || 0), 0);

        setStats({
          totalVendedores: vendedoresResult.data.length,
          vendedoresPendientes: vendedoresPendientes.length,
          totalProductos: productosResult.data.length,
          totalPedidos: pedidosResult.data.length,
          ventasDelMes
        });

        setPendingVendors(vendedoresPendientes.slice(0, 5)); // Mostrar solo los primeros 5
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveVendor = async (vendorId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ vendedor_estado: 'aprobado' })
        .eq('id', vendorId);

      if (error) throw error;

      // Leer configuración de notificaciones (toggle y from)
      let notifyEnabled = true;
      let notifyFrom: string | undefined = undefined;
      try {
        const [{ data: notif }, { data: sender }] = await Promise.all([
          supabase.from('app_config').select('value').eq('key', 'notify_vendor_email_enabled').maybeSingle(),
          supabase.from('app_config').select('value').eq('key', 'notify_from').maybeSingle(),
        ]);
        notifyEnabled = (notif?.value?.enabled ?? true);
        notifyFrom = sender?.value?.from ?? undefined;
      } catch {}

      try {
        const vendor = pendingVendors.find(v => v.id === vendorId);
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
        if (supaUrl && notifyEnabled) {
          const projectRef = new URL(supaUrl).host.split('.')[0];
          const functionsUrl = `https://${projectRef}.functions.supabase.co/notify-vendor-status`;
          await fetch(functionsUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              action: 'aprobado',
              email: vendor?.email,
              nombre: vendor?.nombre_completo,
              from: notifyFrom
            })
          });
        }
      } catch (e) {
        console.warn('[notify] fallo al notificar aprobación (continuando):', e);
      }

      // Actualizar la lista local
      setPendingVendors(prev => prev.filter(v => v.id !== vendorId));
      
      // Actualizar estadísticas
      setStats(prev => prev ? {
        ...prev,
        vendedoresPendientes: prev.vendedoresPendientes - 1
      } : null);

      toastSuccess('Vendedor aprobado exitosamente', { role: 'admin', action: 'approve' });
    } catch (error) {
      console.error('Error approving vendor:', error);
      toastError('Error al aprobar vendedor', { role: 'admin', action: 'approve' });
    }
  };

  const rejectVendor = async (vendorId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ vendedor_estado: 'rechazado' })
        .eq('id', vendorId);

      if (error) throw error;

      // Leer configuración de notificaciones (toggle y from)
      let notifyEnabled2 = true;
      let notifyFrom2: string | undefined = undefined;
      try {
        const [{ data: notif }, { data: sender }] = await Promise.all([
          supabase.from('app_config').select('value').eq('key', 'notify_vendor_email_enabled').maybeSingle(),
          supabase.from('app_config').select('value').eq('key', 'notify_from').maybeSingle(),
        ]);
        notifyEnabled2 = (notif?.value?.enabled ?? true);
        notifyFrom2 = sender?.value?.from ?? undefined;
      } catch {}

      try {
        const vendor = pendingVendors.find(v => v.id === vendorId);
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
        if (supaUrl && notifyEnabled2) {
          const projectRef = new URL(supaUrl).host.split('.')[0];
          const functionsUrl = `https://${projectRef}.functions.supabase.co/notify-vendor-status`;
          await fetch(functionsUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              action: 'rechazado',
              email: vendor?.email,
              nombre: vendor?.nombre_completo,
              from: notifyFrom2
            })
          });
        }
      } catch (e) {
        console.warn('[notify] fallo al notificar rechazo (continuando):', e);
      }

      // Actualizar la lista local
      setPendingVendors(prev => prev.filter(v => v.id !== vendorId));
      
      // Actualizar estadísticas
      setStats(prev => prev ? {
        ...prev,
        vendedoresPendientes: prev.vendedoresPendientes - 1
      } : null);

      toastSuccess('Vendedor rechazado', { role: 'admin', action: 'reject' });
    } catch (error) {
      console.error('Error rejecting vendor:', error);
      toastError('Error al rechazar vendedor', { role: 'admin', action: 'reject' });
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Panel de Administración" subtitle="Gestiona vendedores, productos y supervisa las métricas del marketplace">

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Icon category="Administrador" name="Users" className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Vendedores</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalVendedores}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                  <Icon category="Pedidos" name="CarbonPendingFilled" className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.vendedoresPendientes}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <Icon category="Catálogo y producto" name="BxsPackage" className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProductos}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <Icon category="Pedidos" name="MaterialSymbolsOrdersOutlineRounded" className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Pedidos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPedidos}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
                  <Icon category="Carrito y checkout" name="VaadinWallet" className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ventas del Mes</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.ventasDelMes}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vendedores Pendientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Vendedores Pendientes de Aprobación</h2>
          </div>
          <div className="card-body">
            {pendingVendors.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay vendedores pendientes</p>
            ) : (
              <div className="space-y-4">
                {pendingVendors.map((vendor) => (
                  <div key={vendor.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {vendor.nombre_completo || vendor.email}
                      </h3>
                      <p className="text-sm text-gray-500">{vendor.email}</p>
                      <p className="text-xs text-gray-400">
                        Registrado: {new Date(vendor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => approveVendor(vendor.id)}
                        className="btn btn-accent btn-sm"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => rejectVendor(vendor.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <button className="w-full btn btn-primary justify-start" onClick={() => navigate('/admin/categorias')}>
                <Icon category="Navegación principal" name="MdiGrid" className="w-5 h-5 mr-2" />
                Crear Nueva Categoría
              </button>
              
              <button className="w-full btn btn-outline justify-start" onClick={() => navigate('/admin/metricas')}>
                <Icon category="Administrador" name="BarChart3" className="w-5 h-5 mr-2" />
                Ver Métricas Detalladas
              </button>
              
              <button className="w-full btn btn-outline justify-start" onClick={() => navigate('/admin/usuarios')}>
                <Icon category="Administrador" name="Users" className="w-5 h-5 mr-2" />
                Gestionar Usuarios
              </button>
              
              <button className="w-full btn btn-outline justify-start" onClick={() => navigate('/admin/moderacion')}>
                <Icon category="Administrador" name="Gavel" className="w-5 h-5 mr-2" />
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
