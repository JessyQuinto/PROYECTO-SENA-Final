import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useCart } from '../../modules/buyer/CartContext';
import AdminLayout from './AdminLayout';
import Icon from '../../components/ui/Icon';

type UserRole = 'admin' | 'vendedor' | 'comprador';
type VendedorEstado = 'pendiente' | 'aprobado' | 'rechazado' | null;

interface UsuarioRow {
  id: string;
  email: string | null;
  role: UserRole | null;
  vendedor_estado: VendedorEstado;
  bloqueado: boolean | null;
  nombre_completo: string | null;
  created_at?: string;
}

const UsersAdmin: React.FC = () => {
  const [users, setUsers] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: string;
    email?: string;
  } | null>(null);
  
  // ✅ NUEVO: Hook para acceder al carrito
  const { items: cartItems } = useCart();
  
  // ✅ NUEVO: Estado para tracking de cambios de rol
  const [changingRoles, setChangingRoles] = useState<Set<string>>(new Set());
  
  // ✅ NUEVO: Estado para tracking de productos por vendedor
  const [vendorProducts, setVendorProducts] = useState<Map<string, number>>(new Map());

  // ✅ MEJORADO: Estado para auto-refresh con mejor control
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false); // Deshabilitado por defecto
  const [refreshInterval, setRefreshInterval] = useState(60000); // 60 segundos por defecto

  // Super admin único autorizado (el único que puede modificar otros admins)
  const SUPER_ADMIN_EMAIL = 'admin@tesoros-choco.com';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      u =>
        (u.email || '').toLowerCase().includes(q) ||
        (u.nombre_completo || '').toLowerCase().includes(q)
    );
  }, [users, query]);

  // ✅ MEJORADO: Función de carga más robusta
  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      // Cargar usuarios
      const { data, error } = await supabase
        .from('users')
        .select(
          'id,email,role,vendedor_estado,bloqueado,nombre_completo,created_at'
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error.message);
        return;
      }

      setUsers((data || []) as UsuarioRow[]);

      // ✅ NUEVO: Cargar conteo de productos por vendedor
      const { data: productsData, error: productsError } = await supabase
        .from('productos')
        .select('vendedor_id')
        .eq('estado', 'activo');

      if (!productsError && productsData) {
        const productCounts = new Map<string, number>();
        productsData.forEach((product: { vendedor_id: string }) => {
          const vendorId = product.vendedor_id;
          productCounts.set(vendorId, (productCounts.get(vendorId) || 0) + 1);
        });
        setVendorProducts(productCounts);
      }

      // Cargar usuario actual
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: currentUserData } = await supabase
          .from('users')
          .select('id, role, email')
          .eq('id', session.user.id)
          .single();

        if (currentUserData) {
          setCurrentUser(currentUserData);
        }
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Unexpected error loading users:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // ✅ NUEVO: Auto-refresh automático
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      console.log('[UsersAdmin] Auto-refreshing users...');
      load(false); // Cargar sin mostrar loading
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval, load]);

  // ✅ NUEVO: Listener para cambios en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload: any) => {
          console.log('[UsersAdmin] Real-time change detected:', payload);
          
          // ✅ MEJORADO: Actualizar lista inmediatamente
          if (payload.eventType === 'INSERT') {
            setUsers(prev => [payload.new as UsuarioRow, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setUsers(prev => prev.map(user => 
              user.id === payload.new.id ? payload.new as UsuarioRow : user
            ));
          } else if (payload.eventType === 'DELETE') {
            setUsers(prev => prev.filter(user => user.id !== payload.old.id));
          }
          
          setLastRefresh(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ NUEVO: Listener para cambios de estado de vendedor
  useEffect(() => {
    const handleVendorStatusChange = (event: CustomEvent) => {
      console.log('[UsersAdmin] Vendor status change detected:', event.detail);
      
      // Actualizar el usuario específico
      setUsers(prev => prev.map(user => {
        if (user.id === event.detail.vendorId) {
          return { ...user, vendedor_estado: event.detail.newStatus };
        }
        return user;
      }));
      
      setLastRefresh(new Date());
    };

    // ✅ NUEVO: Listener para cambios de rol
    const handleUserRoleChange = (event: CustomEvent) => {
      console.log('[UsersAdmin] User role change detected:', event.detail);
      
      // Actualizar el usuario específico
      setUsers(prev => prev.map(user => {
        if (user.id === event.detail.userId) {
          return { 
            ...user, 
            role: event.detail.newRole,
            vendedor_estado: event.detail.newRole === 'vendedor' ? 'pendiente' : null
          };
        }
        return user;
      }));
      
      setLastRefresh(new Date());
    };

    window.addEventListener('vendorStatusChanged', handleVendorStatusChange as EventListener);
    window.addEventListener('userRoleChanged', handleUserRoleChange as EventListener);
    
    return () => {
      window.removeEventListener('vendorStatusChanged', handleVendorStatusChange as EventListener);
      window.removeEventListener('userRoleChanged', handleUserRoleChange as EventListener);
    };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Función para determinar si se pueden mostrar ciertos botones
  const canShowButton = (user: UsuarioRow, buttonType: string): boolean => {
    if (!currentUser) return false;

    // El usuario actual no puede modificar su propia cuenta
    if (user.id === currentUser.id) return false;

    // Solo admins pueden hacer cambios
    if (currentUser.role !== 'admin') return false;

    // Verificar si es super admin
    const isSuperAdmin = currentUser.email === SUPER_ADMIN_EMAIL;

    switch (buttonType) {
      case 'changeRole':
        // Solo el super admin puede degradar otros admins
        if (user.role === 'admin') {
          return isSuperAdmin;
        }
        // ✅ MEJORADO: Para otros roles, cualquier admin puede cambiar
        // Pero con restricciones adicionales
        if (user.role === 'vendedor') {
          // Si es vendedor, solo permitir cambiar a comprador (no a admin)
          // ✅ NUEVA REGLA: Verificar si tiene productos
          const productCount = vendorProducts.get(user.id) || 0;
          if (productCount > 0) {
            return false; // No permitir cambio si tiene productos
          }
          return true;
        }
        if (user.role === 'comprador') {
          // Si es comprador, permitir cambiar a vendedor
          // ✅ NUEVA REGLA: Verificar si tiene carrito (solo si es el usuario actual)
          if (user.id === currentUser?.id && cartItems.length > 0) {
            return false;
          }
          return true;
        }
        return true;

      case 'vendorActions':
        // Solo mostrar acciones de vendedor si el usuario es vendedor o comprador
        return user.role === 'vendedor' || user.role === 'comprador';

      case 'blockActions':
        // Solo el super admin puede bloquear otros admins
        if (user.role === 'admin') {
          return isSuperAdmin;
        }
        // Para otros roles, cualquier admin puede bloquear
        return true;

      case 'deleteUser':
        // Solo el super admin puede eliminar otros admins
        if (user.role === 'admin') {
          return isSuperAdmin;
        }
        // Para otros roles, cualquier admin puede eliminar
        return true;

      default:
        return false;
    }
  };

  // Función para verificar si un vendedor tiene productos (para mostrar advertencia)
  const [vendedoresConProductos, setVendedoresConProductos] = useState<
    Set<string>
  >(new Set());

  const checkVendedorProductos = async (vendedorId: string) => {
    try {
      const { data: productos, error } = await supabase
        .from('productos')
        .select('id')
        .eq('vendedor_id', vendedorId)
        .limit(1);

      if (!error && productos && productos.length > 0) {
        setVendedoresConProductos(prev => new Set(prev).add(vendedorId));
      }
    } catch (e) {
      console.warn('Error checking vendor products:', e);
    }
  };

  // Verificar productos de vendedores al cargar
  useEffect(() => {
    const vendedores = users.filter(u => u.role === 'vendedor');
    vendedores.forEach(v => checkVendedorProductos(v.id));
  }, [users]);

  const setVendorStatus = async (
    id: string,
    estado: Exclude<VendedorEstado, null>
  ) => {
    // Usar la función RPC simplificada en lugar de UPDATE directo
    const { data, error } = await supabase.rpc('simple_admin_update_vendor_status', {
      target_user_id: id,
      new_status: estado
    });
    
    if (error) {
      (window as any).toast?.error(error.message, {
        role: 'admin',
        action: 'approve',
      });
      return;
    }
    
    // Actualizar el estado local
    setUsers(list =>
      list.map(u => (u.id === id ? { ...u, vendedor_estado: estado } : u))
    );
    
    (window as any).toast?.success(`Vendedor ${estado}`, {
      role: 'admin',
      action: estado === 'aprobado' ? 'approve' : 'reject',
    });

    // 🔄 ACTUALIZAR ESTADO DEL USUARIO EN TIEMPO REAL
    // Si el usuario afectado está actualmente logueado, notificar el cambio
    try {
      const currentSession = (await supabase.auth.getSession()).data.session;
      if (currentSession?.user?.id === id) {
        // El usuario afectado está logueado, notificar el cambio
        window.dispatchEvent(new CustomEvent('vendorStatusChanged', {
          detail: { 
            vendorId: id, 
            newStatus: estado,
            timestamp: Date.now()
          }
        }));
      }
    } catch (e) {
      console.warn('[refresh] No se pudo notificar cambio de estado:', e);
    }

    // Notificar por correo si está habilitado en app_config
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as
        | string
        | undefined;
      if (!token || !supaUrl) return;
      const projectRef = new URL(supaUrl).host.split('.')[0];
      const user = users.find(u => u.id === id);
      // Leer configuración
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
      // Por defecto habilitado si no existe registro/config (alineado con la Edge Function)
      const enabled = (notif?.value?.enabled ?? true) as boolean;
      const from = sender?.value?.from as string | undefined;
      if (enabled && from && user?.email) {
        await fetch(
          `https://${projectRef}.functions.supabase.co/notify-vendor-status`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: estado,
              email: user.email,
              nombre: user.nombre_completo,
              from,
            }),
          }
        ).catch(() => {});
      }
    } catch (e) {
      console.warn('[notify-vendor-status] status warning', e);
    }
  };

  const suspend = async (id: string, blocked: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ bloqueado: blocked })
        .eq('id', id);
      if (error) throw error;

      setUsers(list =>
        list.map(u => (u.id === id ? { ...u, bloqueado: blocked } : u))
      );

      (window as any).toast?.success(
        `Usuario ${blocked ? 'bloqueado' : 'reactivado'}`,
        {
          role: 'admin',
          action: 'update',
        }
      );

      // Notificar por correo si está habilitado en app_config
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as
          | string
          | undefined;
        if (!token || !supaUrl) return;
        const projectRef = new URL(supaUrl).host.split('.')[0];
        const u = users.find(x => x.id === id);
        if (u?.email) {
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
          const enabled = (notif?.value?.enabled ?? true) as boolean;
          const from = sender?.value?.from as string | undefined;
          if (enabled) {
            const action = blocked ? 'bloqueado' : 'reactivado';
            await fetch(
              `https://${projectRef}.functions.supabase.co/notify-vendor-status`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  action,
                  email: u.email,
                  nombre: u.nombre_completo,
                  from,
                }),
              }
            ).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('[notify-vendor-status] suspend warning', e);
      }
    } catch (e: any) {
      (window as any).toast?.error(e?.message || 'No se pudo suspender', {
        role: 'admin',
        action: 'update',
      });
    }
  };

  const removeUser = async (id: string) => {
    if (!confirm('¿Eliminar usuario? Esta acción es irreversible.')) return;
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as
        | string
        | undefined;
      if (supaUrl && token) {
        const projectRef = new URL(supaUrl).host.split('.')[0];
        const u = users.find(x => x.id === id);
        const resp = await fetch(
          `https://${projectRef}.functions.supabase.co/admin-users`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: 'delete', user_id: id }),
          }
        );
        const j = await resp.json();
        if (!resp.ok) throw new Error(j?.error || 'No se pudo eliminar');
        setUsers(list => list.filter(u => u.id !== id));
        (window as any).toast?.success('Usuario eliminado', {
          role: 'admin',
          action: 'delete',
        });

        // Notificar por correo (eliminado)
        try {
          if (u?.email) {
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
            const enabled = (notif?.value?.enabled ?? true) as boolean;
            const from = sender?.value?.from as string | undefined;
            if (enabled) {
              await fetch(
                `https://${projectRef}.functions.supabase.co/notify-vendor-status`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    action: 'eliminado',
                    email: u.email,
                    nombre: u.nombre_completo,
                    from,
                  }),
                }
              ).catch(() => {});
            }
          }
        } catch (e) {
          console.warn('[notify-vendor-status] delete warning', e);
        }
      }
    } catch (e: any) {
      (window as any).toast?.error(e?.message || 'No se pudo eliminar', {
        role: 'admin',
        action: 'delete',
      });
    }
  };

  // ✅ MEJORADO: Función para cambiar el rol de un usuario usando RPC
  const changeUserRole = async (
    id: string,
    newRole: 'vendedor' | 'comprador' | 'admin'
  ) => {
    // ✅ NUEVO: Marcar que se está cambiando el rol
    setChangingRoles(prev => new Set(prev).add(id));
    
    console.log('[changeUserRole] Iniciando cambio de rol:', { id, newRole });
    
    try {
      // ✅ NUEVO: Validaciones del frontend antes de llamar RPC
      const targetUser = users.find(u => u.id === id);
      if (!targetUser) {
        throw new Error('Usuario no encontrado');
      }
      
      // ✅ REGLA 1: Verificar si vendedor tiene productos (frontend)
      if (targetUser.role === 'vendedor') {
        const { data: products, error: productsError } = await supabase
          .from('productos')
          .select('id, nombre')
          .eq('vendedor_id', id);
          
        if (productsError) {
          console.error('[changeUserRole] Error verificando productos:', productsError);
        } else if (products && products.length > 0) {
          throw new Error(`No se puede cambiar el rol de un vendedor que tiene ${products.length} productos registrados. Debe eliminar o transferir los productos primero.`);
        }
      }
      
      // ✅ REGLA 2: Verificar si comprador tiene carrito local
      if (targetUser.role === 'comprador' && targetUser.id === currentUser?.id) {
        if (cartItems.length > 0) {
          throw new Error(`No se puede cambiar el rol de un comprador que tiene ${cartItems.length} productos en el carrito. Debe vaciar el carrito primero.`);
        }
      }
      
      // ✅ NUEVO: Usar la función RPC en lugar de UPDATE directo
      console.log('[changeUserRole] Llamando RPC admin_change_user_role...');
      const { data, error } = await supabase.rpc('admin_change_user_role', {
        p_target_user_id: id,
        p_new_role: newRole
      });
      
      console.log('[changeUserRole] Respuesta RPC:', { data, error });

      if (error) {
        console.error('[changeUserRole] Error de Supabase:', error);
        throw error;
      }

      // Check if the RPC returned an error in the data
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error(data.error || 'Error desconocido al cambiar rol');
      }

      // ✅ MEJORADO: Actualizar estado local con datos de la RPC
      setUsers(list =>
        list.map(u =>
          u.id === id
            ? {
                ...u,
                role: newRole,
                vendedor_estado: newRole === 'vendedor' ? 'pendiente' : null,
              }
            : u
        )
      );

      // ✅ NUEVO: Mostrar mensaje de éxito más informativo
      (window as any).toast?.success(
        `✅ Rol cambiado exitosamente a ${newRole}`, 
        {
          role: 'admin',
          action: 'update',
        }
      );

      // ✅ NUEVO: Actualizar timestamp de última actualización
      setLastRefresh(new Date());

      // ✅ NUEVO: Notificar cambio en tiempo real si el usuario está logueado
      try {
        const currentSession = (await supabase.auth.getSession()).data.session;
        if (currentSession?.user?.id === id) {
          window.dispatchEvent(new CustomEvent('userRoleChanged', {
            detail: { 
              userId: id, 
              oldRole: targetUser.role,
              newRole: newRole,
              timestamp: Date.now()
            }
          }));
        }
      } catch (e) {
        console.warn('[refresh] No se pudo notificar cambio de rol:', e);
      }

    } catch (e: any) {
      console.error('[changeUserRole] Error:', e);
      
      // ✅ MEJORADO: Manejo de errores más específico
      let errorMessage = 'Error desconocido al cambiar rol';
      
      if (e?.message) {
        if (e.message.includes('vendedor_estado')) {
          errorMessage = 'Error de tipo de datos en el estado del vendedor';
        } else if (e.message.includes('admin')) {
          errorMessage = 'Error de permisos: solo administradores pueden cambiar roles';
        } else if (e.message.includes('no encontrado')) {
          errorMessage = 'Usuario no encontrado en la base de datos';
        } else {
          errorMessage = e.message;
        }
      }
      
      (window as any).toast?.error(
        `❌ ${errorMessage}`, 
        {
          role: 'admin',
          action: 'update',
        }
      );
    } finally {
      // ✅ NUEVO: Remover del estado de cambios
      setChangingRoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout title='Cargando usuarios...'>
        <div className='flex items-center justify-center h-64'>
          <div className='loading loading-spinner loading-lg'></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title='Gestión de Usuarios'>
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Gestión de Usuarios
            </h1>
            <p className='text-muted-foreground'>
              Administra usuarios, roles y permisos del sistema
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          {/* ✅ NUEVO: Controles de auto-refresh y estado */}
          <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
            <div className='flex-1'>
              <input
                type='text'
                placeholder='Buscar usuarios por email o nombre...'
                className='input input-bordered w-full'
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            
            {/* ✅ MEJORADO: Panel de control de auto-refresh más elegante */}
            <div className='flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
              <div className='flex items-center gap-6'>
                <div className='flex items-center gap-3'>
                  <input
                    type='checkbox'
                    id='autoRefresh'
                    className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2'
                    checked={autoRefreshEnabled}
                    onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                  />
                  <label htmlFor='autoRefresh' className='text-sm font-medium text-gray-700'>
                    Auto-refresh
                  </label>
                </div>
                
                {autoRefreshEnabled && (
                  <div className='flex items-center gap-2'>
                    <label className='text-sm text-gray-600'>Cada:</label>
                    <select
                      className='px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    >
                      <option value={30000}>30 segundos</option>
                      <option value={60000}>1 minuto</option>
                      <option value={120000}>2 minutos</option>
                      <option value={300000}>5 minutos</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className='flex items-center gap-4'>
                <button
                  onClick={() => load(true)}
                  className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  disabled={loading}
                >
                  {loading ? (
                    <div className='loading loading-spinner loading-xs'></div>
                  ) : (
                    <Icon category='Interface' name='MdiRefresh' className='w-4 h-4' />
                  )}
                  Actualizar
                </button>
                
                <div className='text-sm text-gray-500'>
                  Última actualización: {lastRefresh.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* ✅ MEJORADO: Tabla de usuarios con mejor espaciado */}
          {filtered.length === 0 ? (
            <div className='text-center py-12 text-muted-foreground'>
              <Icon
                category='Interface'
                name='MdiAccountGroup'
                className='w-16 h-16 mx-auto mb-4 text-gray-300'
              />
              <h3 className='text-lg font-medium mb-2'>No se encontraron usuarios</h3>
              <p className='text-sm'>Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className='overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                      Usuario
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                      Rol
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                      Estado
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                      Acciones
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                      Gestión
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {filtered.map(u => (
                    <tr key={u.id} className='hover:bg-gray-50 transition-colors duration-150'>
                      <td className='px-6 py-6'>
                        <div className='flex flex-col space-y-2'>
                          <span className='font-semibold text-gray-900 text-base'>
                            {u.nombre_completo || 'Sin nombre'}
                          </span>
                          <span className='text-sm text-gray-600'>
                            {u.email}
                          </span>
                          {u.created_at && (
                            <span className='text-xs text-gray-500'>
                              Registrado: {new Date(u.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-6'>
                        {u.role === 'admin' ? (
                          <div className='flex flex-col space-y-3'>
                            <span className='inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800'>
                              <Icon
                                category='Administrador'
                                name='MdiShieldCheck'
                                className='w-4 h-4'
                                alt=''
                              />
                              Admin
                            </span>
                            {u.email === SUPER_ADMIN_EMAIL ? (
                              <span className='text-xs text-green-600 font-medium'>
                                👑 Super Administrador
                              </span>
                            ) : (
                              <span className='text-xs text-gray-500'>
                                🔒 Solo super-admin puede modificar
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className='flex flex-col space-y-4'>
                            {/* ✅ MEJORADO: Badge del rol actual */}
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                u.role === 'vendedor' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {u.role === 'vendedor' ? (
                                <Icon category='Interface' name='MdiStore' className='w-4 h-4' />
                              ) : (
                                <Icon category='Interface' name='MdiShopping' className='w-4 h-4' />
                              )}
                              {u.role === 'vendedor' ? 'Vendedor' : 'Comprador'}
                            </span>
                            
                            {/* ✅ MEJORADO: Selector de rol más funcional */}
                            {canShowButton(u, 'changeRole') && (
                              <div className='space-y-3'>
                                <div>
                                  <label className='block text-xs font-medium text-gray-700 mb-2'>
                                    Cambiar rol:
                                  </label>
                                  <select
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
                                    value={u.role || 'comprador'}
                                    disabled={changingRoles.has(u.id)}
                                    onChange={e => {
                                      const newRole = e.target.value as 'vendedor' | 'comprador' | 'admin';
                                      // ✅ NUEVO: Confirmación antes de cambiar
                                      if (confirm(`¿Estás seguro de que quieres cambiar el rol de ${u.email} de "${u.role}" a "${newRole}"?`)) {
                                        changeUserRole(u.id, newRole);
                                      } else {
                                        // Resetear el select al valor original
                                        e.target.value = u.role || 'comprador';
                                      }
                                    }}
                                  >
                                    <option value='comprador'>🛒 Comprador</option>
                                    <option value='vendedor'>🏪 Vendedor</option>
                                    {currentUser?.email === SUPER_ADMIN_EMAIL && (
                                      <option value='admin'>🛡️ Administrador</option>
                                    )}
                                  </select>
                                </div>
                                
                                {/* ✅ MEJORADO: Información adicional con reglas de negocio */}
                                <div className='space-y-2'>
                                  {u.role === 'vendedor' && (
                                    <div className='text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded'>
                                      ⚠️ Al cambiar a comprador, se perderán productos
                                    </div>
                                  )}
                                  {u.role === 'comprador' && (
                                    <div className='text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded'>
                                      ℹ️ Al cambiar a vendedor, requerirá aprobación
                                    </div>
                                  )}
                                  
                                  {/* ✅ NUEVO: Indicadores de restricciones */}
                                  {u.role === 'vendedor' && (
                                    <div className='text-xs text-red-600 bg-red-50 px-2 py-1 rounded font-medium'>
                                      🔒 No se puede cambiar si tiene productos
                                      {(() => {
                                        const productCount = vendorProducts.get(u.id) || 0;
                                        return productCount > 0 ? ` (${productCount} productos)` : '';
                                      })()}
                                    </div>
                                  )}
                                  {u.role === 'comprador' && u.id === currentUser?.id && (
                                    <div className='text-xs text-red-600 bg-red-50 px-2 py-1 rounded font-medium'>
                                      🔒 No se puede cambiar si tiene carrito
                                    </div>
                                  )}
                                  
                                  {/* ✅ NUEVO: Indicador de cambio en progreso */}
                                  {changingRoles.has(u.id) && (
                                    <div className='flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded'>
                                      <div className='loading loading-spinner loading-xs'></div>
                                      <span>Cambiando rol...</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className='px-6 py-6'>
                        {u.role === 'vendedor' ? (
                          // Para vendedores: mostrar estado de aprobación y botones
                          <div className='space-y-3'>
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                u.vendedor_estado === 'aprobado'
                                  ? 'bg-green-100 text-green-800'
                                  : u.vendedor_estado === 'rechazado'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                              title={u.vendedor_estado || ''}
                            >
                              {u.vendedor_estado === 'aprobado' && (
                                <Icon
                                  category='Interface'
                                  name='MdiCheckCircle'
                                  className='w-4 h-4'
                                />
                              )}
                              {u.vendedor_estado === 'pendiente' && (
                                <Icon
                                  category='Interface'
                                  name='MdiClock'
                                  className='w-4 h-4'
                                />
                              )}
                              {u.vendedor_estado === 'rechazado' && (
                                <Icon
                                  category='Interface'
                                  name='MdiCloseCircle'
                                  className='w-4 h-4'
                                />
                              )}
                              {u.vendedor_estado || 'pendiente'}
                            </span>
                            <div className='flex flex-col space-y-2'>
                              {canShowButton(u, 'vendorActions') && (
                                <>
                                  <button
                                    className='inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors'
                                    onClick={() =>
                                      setVendorStatus(u.id, 'aprobado')
                                    }
                                    title='Aprobar vendedor'
                                    aria-label='Aprobar vendedor'
                                  >
                                    <Icon
                                      category='Interface'
                                      name='MdiCheck'
                                      className='w-3 h-3'
                                    />
                                    Aprobar
                                  </button>
                                  <button
                                    className='inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors'
                                    onClick={() =>
                                      setVendorStatus(u.id, 'rechazado')
                                    }
                                    title='Rechazar vendedor'
                                    aria-label='Rechazar vendedor'
                                  >
                                    <Icon
                                      category='Interface'
                                      name='MdiClose'
                                      className='w-3 h-3'
                                    />
                                    Rechazar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ) : u.role === 'comprador' ? (
                          // Para compradores: mostrar estado de cuenta
                          <div className='flex items-center gap-2'>
                            <span className='inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
                              <Icon
                                category='Interface'
                                name='MdiAccount'
                                className='w-4 h-4'
                              />
                              Activo
                            </span>
                          </div>
                        ) : u.role === 'admin' ? (
                          // Para admins: mostrar privilegios
                          <div className='flex items-center gap-2'>
                            <span className='inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800'>
                              <Icon
                                category='Administrador'
                                name='MdiShieldCheck'
                                className='w-4 h-4'
                              />
                              Admin
                            </span>
                          </div>
                        ) : (
                          // Fallback
                          <span className='inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800'>
                            -
                          </span>
                        )}
                      </td>
                      <td className='px-6 py-6'>
                        {canShowButton(u, 'blockActions') ? (
                          <div className='space-y-2'>
                            <button
                              className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                u.bloqueado 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                              onClick={() => !u.bloqueado && suspend(u.id, true)}
                              title='Bloquear usuario'
                              aria-label='Bloquear usuario'
                              disabled={u.bloqueado || false}
                            >
                              <Icon
                                category='Interface'
                                name='MdiBlockHelper'
                                className='w-3 h-3'
                              />
                              Bloquear
                            </button>
                            <button
                              className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                !u.bloqueado 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                              onClick={() => u.bloqueado && suspend(u.id, false)}
                              title='Desbloquear usuario'
                              aria-label='Desbloquear usuario'
                              disabled={!u.bloqueado || false}
                            >
                              <Icon
                                category='Interface'
                                name='MdiCheckCircle'
                                className='w-3 h-3'
                              />
                              Desbloquear
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                              u.bloqueado ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {u.bloqueado ? (
                              <Icon category='Interface' name='MdiBlockHelper' className='w-4 h-4' />
                            ) : (
                              <Icon category='Interface' name='MdiCheckCircle' className='w-4 h-4' />
                            )}
                            {u.bloqueado ? 'Bloqueado' : 'Activo'}
                          </span>
                        )}
                      </td>
                      <td className='px-6 py-6'>
                        <div className='space-y-2'>
                          <button
                            className='inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors'
                            onClick={() =>
                              alert(
                                'Historial y métricas del usuario próximamente'
                              )
                            }
                            title='Ver detalles del usuario'
                            aria-label='Ver detalles del usuario'
                          >
                            <Icon
                              category='Interface'
                              name='MdiInformation'
                              className='w-3 h-3'
                            />
                            Detalles
                          </button>
                          {canShowButton(u, 'deleteUser') && (
                            <button
                              className='inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors'
                              onClick={() => removeUser(u.id)}
                              title='Eliminar usuario'
                              aria-label='Eliminar usuario'
                            >
                              <Icon
                                category='Interface'
                                name='MdiDelete'
                                className='w-3 h-3'
                              />
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default UsersAdmin;
