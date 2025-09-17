import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useCart } from '../../modules/buyer/CartContext';
import AdminLayout from './AdminLayout';
import Icon from '../../components/ui/Icon';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';

type UserRole = 'admin' | 'vendedor' | 'comprador';
type VendedorEstado = 'pendiente' | 'aprobado' | 'rechazado' | null;

// Definir un tipo específico para los estados que se pueden notificar
// (removed) NotifiableVendorStatus unused

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
  
  // Nuevos estados para filtros avanzados
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [vendorStatusFilter, setVendorStatusFilter] = useState<'all' | 'pendiente' | 'aprobado' | 'rechazado'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'email' | 'role'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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
  // Expandible en línea (mobile-first) para detalles de usuario
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  
  // Super admin único autorizado (el único que puede modificar otros admins)
  const SUPER_ADMIN_EMAIL = 'admin@tesoros-choco.com';

  const filtered = useMemo(() => {
    let result = users;
    
    // Filtro de búsqueda
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        u =>
          (u.email || '').toLowerCase().includes(q) ||
          (u.nombre_completo || '').toLowerCase().includes(q)
      );
    }
    
    // Filtro por rol
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    
    // Filtro por estado de cuenta
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        result = result.filter(u => !u.bloqueado);
      } else if (statusFilter === 'blocked') {
        result = result.filter(u => u.bloqueado);
      }
    }
    
    // Filtro por estado de vendedor
    if (vendorStatusFilter !== 'all') {
      result = result.filter(u => 
        (u.vendedor_estado === vendorStatusFilter) || 
        (u.vendedor_estado === null && vendorStatusFilter === 'pendiente')
      );
    }
    
    // Ordenamiento
    result = [...result].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '');
          break;
        case 'role':
          comparison = (a.role || '').localeCompare(b.role || '');
          break;
        case 'created_at':
        default:
          comparison = new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [users, query, roleFilter, statusFilter, vendorStatusFilter, sortBy, sortOrder]);

  // Paginación
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

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

  // (removed) vendedoresConProductos tracking - not used anymore

  const setVendorStatus = async (
    id: string,
    estado: Exclude<VendedorEstado, null>
  ) => {
    // Usar la función RPC simplificada en lugar de UPDATE directo
    const { error } = await supabase.rpc('simple_admin_update_vendor_status', {
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

    // Notificar por correo usando el servicio unificado
    try {
      const user = users.find(u => u.id === id);
      if (user?.email) {
        const { notificationService } = await import('../../services/notificationService');
        // Solo pasar valores válidos a la función de notificación
        if (estado === 'aprobado' || estado === 'rechazado') {
          await notificationService.sendVendorStatusNotification(
            user.email,
            estado,
            user.nombre_completo || undefined
          );
        }
      }
    } catch (e) {
      console.warn('[notification-service] status warning', e);
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

      // Notificar por correo usando el servicio unificado
      try {
        const u = users.find(x => x.id === id);
        if (u?.email) {
          const { notificationService } = await import('../../services/notificationService');
          const action: 'bloqueado' | 'reactivado' = blocked ? 'bloqueado' : 'reactivado';
          await notificationService.sendVendorStatusNotification(
            u.email,
            action,
            u.nombre_completo || undefined
          );
        }
      } catch (e) {
        console.warn('[notification-service] suspend warning', e);
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

        // Notificar por correo usando el servicio unificado
        try {
          if (u?.email) {
            const { notificationService } = await import('../../services/notificationService');
            await notificationService.sendVendorStatusNotification(
              u.email,
              'eliminado', // Usar el valor válido directamente
              u.nombre_completo || undefined
            );
          }
        } catch (e) {
          console.warn('[notification-service] delete warning', e);
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
        throw new Error(`Error de Supabase: ${error.message || 'Error desconocido'}`);
      }

      // ✅ MEJORADO: Verificar la estructura de la respuesta
      console.log('[changeUserRole] Estructura de data:', data);
      console.log('[changeUserRole] Tipo de data:', typeof data);
      console.log('[changeUserRole] data es array:', Array.isArray(data));
      
      // Si data es un array, tomar el primer elemento
      const result = Array.isArray(data) ? data[0] : data;
      
      if (!result) {
        throw new Error('Respuesta vacía de la función RPC');
      }

      console.log('[changeUserRole] Resultado procesado:', result);

      if (result.success === false) {
        throw new Error(result.error || 'Error desconocido al cambiar rol');
      }

      // Verificar que result tenga las propiedades esperadas
      if (typeof result !== 'object' || result === null) {
        throw new Error('Respuesta inválida de la función RPC');
      }

      // ✅ MEJORADO: Actualizar estado local con datos de la RPC
      setUsers(list =>
        list.map(u =>
          u.id === id
            ? {
                ...u,
                role: result.new_role || newRole,
                vendedor_estado: (result.new_role || newRole) === 'vendedor' ? 'pendiente' : null,
              }
            : u
        )
      );

      // ✅ NUEVO: Mostrar mensaje de éxito más informativo
      (window as any).toast?.success(
        `✅ Rol cambiado exitosamente: ${result.old_role || 'desconocido'} → ${result.new_role || newRole}`, 
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
              oldRole: result.old_role,
              newRole: result.new_role,
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
          {/* Panel de filtros y búsqueda */}
          <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Búsqueda</label>
                <input
                  type='text'
                  placeholder='Email o nombre...'
                  className='input input-bordered w-full'
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setCurrentPage(1); // Resetear a primera página al buscar
                  }}
                />
              </div>
              
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Rol</label>
                <select
                  className='select select-bordered w-full'
                  value={roleFilter}
                  onChange={e => {
                    setRoleFilter(e.target.value as 'all' | UserRole);
                    setCurrentPage(1);
                  }}
                >
                  <option value='all'>Todos los roles</option>
                  <option value='admin'>Administrador</option>
                  <option value='vendedor'>Vendedor</option>
                  <option value='comprador'>Comprador</option>
                </select>
              </div>
              
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Estado</label>
                <select
                  className='select select-bordered w-full'
                  value={statusFilter}
                  onChange={e => {
                    setStatusFilter(e.target.value as 'all' | 'active' | 'blocked');
                    setCurrentPage(1);
                  }}
                >
                  <option value='all'>Todos los estados</option>
                  <option value='active'>Activo</option>
                  <option value='blocked'>Bloqueado</option>
                </select>
              </div>
              
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Estado Vendedor</label>
                <select
                  className='select select-bordered w-full'
                  value={vendorStatusFilter}
                  onChange={e => {
                    setVendorStatusFilter(e.target.value as 'all' | 'pendiente' | 'aprobado' | 'rechazado');
                    setCurrentPage(1);
                  }}
                >
                  <option value='all'>Todos</option>
                  <option value='pendiente'>Pendiente</option>
                  <option value='aprobado'>Aprobado</option>
                  <option value='rechazado'>Rechazado</option>
                </select>
              </div>
            </div>
            
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div className='flex items-center gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Ordenar por</label>
                  <select
                    className='select select-bordered'
                    value={sortBy}
                    onChange={e => {
                      setSortBy(e.target.value as 'created_at' | 'email' | 'role');
                      setCurrentPage(1);
                    }}
                  >
                    <option value='created_at'>Fecha de registro</option>
                    <option value='email'>Email</option>
                    <option value='role'>Rol</option>
                  </select>
                </div>
                
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Dirección</label>
                  <select
                    className='select select-bordered'
                    value={sortOrder}
                    onChange={e => {
                      setSortOrder(e.target.value as 'asc' | 'desc');
                      setCurrentPage(1);
                    }}
                  >
                    <option value='desc'>Descendente</option>
                    <option value='asc'>Ascendente</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setVendorStatusFilter('all');
                  setSortBy('created_at');
                  setSortOrder('desc');
                  setCurrentPage(1);
                }}
                className='btn btn-outline'
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {/* Controles de auto-refresh y estado */}
          <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
            {/* ✅ MEJORADO: Panel de control de auto-refresh más elegante */}
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

          {/* Tabla de usuarios con paginación */}
          {paginatedUsers.length === 0 ? (
            <div className='text-center py-12 text-muted-foreground'>
              <Icon category='Interface' name='MdiAccountGroup' className='w-16 h-16 mx-auto mb-4 text-gray-300' />
              <h3 className='text-lg font-medium mb-2'>No se encontraron usuarios</h3>
              <p className='text-sm'>
                {query || roleFilter !== 'all' || statusFilter !== 'all' || vendorStatusFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'No hay usuarios registrados en el sistema'}
              </p>
            </div>
          ) : (
            <>
              <Card className='shadow-sm'>
                <CardContent className='p-0'>
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead className='bg-gray-50 border-b border-gray-200'>
                        <tr>
                          <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Usuario</th>
                          <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Rol</th>
                          <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Estado</th>
                          <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Detalles</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-200'>
                        {paginatedUsers.map(u => (
                          <React.Fragment key={u.id}>
                          <tr className='hover:bg-gray-50 transition-colors duration-150'>
                            {/* Información básica del usuario */}
                            <td className='px-6 py-4'>
                              <div className='flex items-center space-x-3'>
                                <div className='h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold'>
                                  {(u.nombre_completo || u.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className='text-sm font-semibold text-gray-900'>
                                    {u.nombre_completo || 'Sin nombre'}
                                  </p>
                                  <p className='text-sm text-gray-600'>{u.email}</p>
                                </div>
                              </div>
                            </td>
                            
                            {/* Rol del usuario */}
                            <td className='px-6 py-4'>
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                u.role === 'admin' ? 'bg-red-100 text-red-800'
                                : u.role === 'vendedor' ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                              }`}>
                                {u.role === 'admin' ? '🛡️ Admin' : u.role === 'vendedor' ? '🏪 Vendedor' : '🛒 Comprador'}
                              </span>
                            </td>
                            
                            {/* Estado del usuario */}
                            <td className='px-6 py-4'>
                              <div className='flex flex-col space-y-1'>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  u.bloqueado ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {u.bloqueado ? '🚫 Bloqueado' : '✓ Activo'}
                                </span>
                                {u.role === 'vendedor' && (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    u.vendedor_estado === 'aprobado' ? 'bg-emerald-100 text-emerald-800'
                                    : u.vendedor_estado === 'rechazado' ? 'bg-orange-100 text-orange-800'
                                    : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {u.vendedor_estado === 'aprobado' ? '✓ Aprobado'
                                     : u.vendedor_estado === 'rechazado' ? '❌ Rechazado'
                                     : '🕰️ Pendiente'}
                                  </span>
                                )}
                              </div>
                            </td>
                            
                            {/* Detalles (toggle) */}
                            <td className='px-6 py-4'>
                              <Button
                                onClick={() => setExpandedUserId(prev => prev === u.id ? null : u.id)}
                                className='inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white'
                                size='sm'
                                aria-expanded={expandedUserId === u.id}
                                aria-controls={`user-details-${u.id}`}
                              >
                                <Icon category='Interface' name='MdiEye' className='w-4 h-4' />
                                {expandedUserId === u.id ? 'Ocultar detalles' : 'Ver detalles'}
                              </Button>
                            </td>
                          </tr>
                          {expandedUserId === u.id && (
                            <tr>
                              <td id={`user-details-${u.id}`} colSpan={4} className='px-6 pb-6 bg-gray-50'>
                                <div className='border rounded-lg p-4 bg-white shadow-sm'>
                                  {/* Información general */}
                                  <div className='mb-4'>
                                    <h3 className='text-base font-semibold mb-3 flex items-center gap-2'>
                                      <Icon category='Interface' name='MdiInformation' className='w-5 h-5' />
                                      Información General
                                    </h3>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                      <div>
                                        <label className='text-sm font-medium text-gray-700'>ID de Usuario</label>
                                        <p className='text-sm text-gray-900 font-mono break-all'>{u.id}</p>
                                      </div>
                                      <div>
                                        <label className='text-sm font-medium text-gray-700'>Fecha de Registro</label>
                                        <p className='text-sm text-gray-900'>
                                          {u.created_at ? new Date(u.created_at).toLocaleString() : 'No disponible'}
                                        </p>
                                      </div>
                                      <div>
                                        <label className='text-sm font-medium text-gray-700'>Rol Actual</label>
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                          u.role === 'admin' ? 'bg-red-100 text-red-800'
                                          : u.role === 'vendedor' ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-blue-100 text-blue-800'
                                        }`}>
                                          {u.role === 'admin' ? '🛡️ Administrador' 
                                           : u.role === 'vendedor' ? '🏪 Vendedor' 
                                           : '🛒 Comprador'}
                                        </span>
                                      </div>
                                      <div>
                                        <label className='text-sm font-medium text-gray-700'>Estado de Cuenta</label>
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                          u.bloqueado ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                          {u.bloqueado ? '🚫 Bloqueado' : '✅ Activo'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Gestión de rol */}
                                  {u.role !== 'admin' && canShowButton(u, 'changeRole') && (
                                    <div className='mb-4'>
                                      <h3 className='text-base font-semibold mb-3 flex items-center gap-2'>
                                        <Icon category='Interface' name='MdiAccountSwitch' className='w-5 h-5' />
                                        Gestión de Rol
                                      </h3>
                                      <div className='space-y-3'>
                                        <div>
                                          <label className='block text-sm font-medium text-gray-700 mb-2'>Cambiar rol de usuario:</label>
                                          <select
                                            className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
                                            value={u.role || 'comprador'}
                                            disabled={changingRoles.has(u.id)}
                                            onChange={e => {
                                              const newRole = e.target.value as 'vendedor' | 'comprador' | 'admin';
                                              if (confirm(`¿Estás seguro de que quieres cambiar el rol de ${u.email} de "${u.role}" a "${newRole}"?`)) {
                                                changeUserRole(u.id, newRole);
                                              } else {
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
                                        <div className='space-y-2'>
                                          {u.role === 'vendedor' && (
                                            <div className='text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded'>
                                              ⚠️ Al cambiar a comprador, se perderán todos los productos registrados
                                            </div>
                                          )}
                                          {u.role === 'comprador' && (
                                            <div className='text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded'>
                                              ℹ️ Al cambiar a vendedor, el usuario requerirá aprobación administrativa
                                            </div>
                                          )}
                                          {u.role === 'vendedor' && (vendorProducts.get(u.id) || 0) > 0 && (
                                            <div className='text-sm text-red-600 bg-red-50 px-3 py-2 rounded font-medium'>
                                              🔒 No se puede cambiar el rol: el usuario tiene {vendorProducts.get(u.id)} productos registrados
                                            </div>
                                          )}
                                          {changingRoles.has(u.id) && (
                                            <div className='flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded'>
                                              <div className='loading loading-spinner loading-sm'></div>
                                              <span>Procesando cambio de rol...</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Gestión específica para vendedores */}
                                  {u.role === 'vendedor' && (
                                    <div className='mb-4'>
                                      <h3 className='text-base font-semibold mb-3 flex items-center gap-2'>
                                        <Icon category='Interface' name='MdiStore' className='w-5 h-5' />
                                        Gestión de Vendedor
                                      </h3>
                                      <div className='space-y-3'>
                                        <div>
                                          <label className='block text-sm font-medium text-gray-700 mb-2'>Estado de aprobación:</label>
                                          <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                                            u.vendedor_estado === 'aprobado' ? 'bg-green-100 text-green-800'
                                            : u.vendedor_estado === 'rechazado' ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {u.vendedor_estado === 'aprobado' && <Icon category='Interface' name='MdiCheckCircle' className='w-4 h-4' />}
                                            {u.vendedor_estado === 'pendiente' && <Icon category='Interface' name='MdiClock' className='w-4 h-4' />}
                                            {u.vendedor_estado === 'rechazado' && <Icon category='Interface' name='MdiCloseCircle' className='w-4 h-4' />}
                                            {u.vendedor_estado === 'aprobado' ? 'Aprobado' 
                                             : u.vendedor_estado === 'rechazado' ? 'Rechazado'
                                             : 'Pendiente de aprobación'}
                                          </span>
                                        </div>
                                        {canShowButton(u, 'vendorActions') && (
                                          <div className='flex flex-wrap gap-3'>
                                            <Button onClick={() => setVendorStatus(u.id, 'aprobado')} className='bg-green-600 hover:bg-green-700 text-white' size='sm'>
                                              <Icon category='Interface' name='MdiCheck' className='w-4 h-4 mr-2' />
                                              Aprobar Vendedor
                                            </Button>
                                            <Button onClick={() => setVendorStatus(u.id, 'rechazado')} className='bg-red-600 hover:bg-red-700 text-white' size='sm'>
                                              <Icon category='Interface' name='MdiClose' className='w-4 h-4 mr-2' />
                                              Rechazar Vendedor
                                            </Button>
                                          </div>
                                        )}
                                        <div>
                                          <label className='block text-sm font-medium text-gray-700 mb-2'>Productos registrados:</label>
                                          <span className='inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full'>
                                            <Icon category='Interface' name='MdiPackageVariant' className='w-4 h-4' />
                                            {vendorProducts.get(u.id) || 0} productos
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Acciones de administración */}
                                  <div className='mb-2'>
                                    <h3 className='text-base font-semibold mb-3 flex items-center gap-2'>
                                      <Icon category='Interface' name='MdiCog' className='w-5 h-5' />
                                      Acciones de Administración
                                    </h3>
                                    <div className='flex flex-wrap gap-3'>
                                      {canShowButton(u, 'blockActions') && (
                                        <>
                                          {!u.bloqueado && (
                                            <Button onClick={() => suspend(u.id, true)} className='bg-orange-600 hover:bg-orange-700 text-white' size='sm'>
                                              <Icon category='Interface' name='MdiBlockHelper' className='w-4 h-4 mr-2' />
                                              Bloquear Usuario
                                            </Button>
                                          )}
                                          {u.bloqueado && (
                                            <Button onClick={() => suspend(u.id, false)} className='bg-green-600 hover:bg-green-700 text-white' size='sm'>
                                              <Icon category='Interface' name='MdiCheckCircle' className='w-4 h-4 mr-2' />
                                              Desbloquear Usuario
                                            </Button>
                                          )}
                                        </>
                                      )}
                                      {canShowButton(u, 'deleteUser') && (
                                        <Button onClick={() => removeUser(u.id)} className='bg-red-600 hover:bg-red-700 text-white' size='sm'>
                                          <Icon category='Interface' name='MdiDelete' className='w-4 h-4 mr-2' />
                                          Eliminar Usuario
                                        </Button>
                                      )}
                                    </div>
                                    {u.email === SUPER_ADMIN_EMAIL && (
                                      <div className='mt-3 text-sm text-green-600 bg-green-50 px-3 py-2 rounded'>
                                        👑 Este es el Super Administrador del sistema. Solo puede ser modificado por sí mismo.
                                      </div>
                                    )}
                                  </div>

                                  <div className='mt-4'>
                                    <Button variant='outline' size='sm' onClick={() => setExpandedUserId(null)}>
                                      Cerrar
                                    </Button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              {/* Paginación */}
              {totalPages > 1 && (
                <div className='flex justify-between items-center'>
                  <div className='text-sm text-gray-600'>
                    Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}-
                    {Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length} usuarios
                  </div>
                  
                  <div className='flex gap-2'>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className='px-3 py-1 rounded border disabled:opacity-50'
                    >
                      Anterior
                    </button>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const page = 
                        totalPages <= 5 
                          ? i + 1 
                          : currentPage <= 3 
                            ? i + 1 
                            : currentPage >= totalPages - 2 
                              ? totalPages - 4 + i 
                              : currentPage - 2 + i;
                              
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded ${
                            currentPage === page 
                              ? 'bg-blue-600 text-white' 
                              : 'border'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className='px-3 py-1 rounded border disabled:opacity-50'
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal eliminado: detalles ahora se muestran en línea */}
        </div>
      </div>
    </AdminLayout>
  );
};
export default UsersAdmin;
