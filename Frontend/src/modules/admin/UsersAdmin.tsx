import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
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

  const load = async () => {
    setLoading(true);

    // Cargar usuarios
    const { data, error } = await supabase
      .from('users')
      .select(
        'id,email,role,vendedor_estado,bloqueado,nombre_completo,created_at'
      )
      .order('created_at', { ascending: false });

    if (error) console.error(error.message);
    setUsers((data || []) as UsuarioRow[]);

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

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

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
        // Para otros roles, cualquier admin puede cambiar
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

  // Función para cambiar el rol de un usuario (solo vendedor o comprador)
  const changeUserRole = async (
    id: string,
    newRole: 'vendedor' | 'comprador'
  ) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          role: newRole,
          vendedor_estado: newRole === 'vendedor' ? 'pendiente' : null,
        })
        .eq('id', id);

      if (error) throw error;

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

      (window as any).toast?.success(`Rol cambiado a ${newRole}`, {
        role: 'admin',
        action: 'update',
      });
    } catch (e: any) {
      (window as any).toast?.error(e?.message || 'No se pudo cambiar el rol', {
        role: 'admin',
        action: 'update',
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
          {/* Filtros y búsqueda */}
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <input
                type='text'
                placeholder='Buscar usuarios por email o nombre...'
                className='input input-bordered w-full'
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Tabla de usuarios */}
          {filtered.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              No se encontraron usuarios
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='table table-zebra w-full'>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                    <th>Gestión</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td className='py-2 pr-4'>
                        <div className='flex flex-col'>
                          <span className='font-medium'>
                            {u.nombre_completo || 'Sin nombre'}
                          </span>
                          <span className='text-sm text-muted-foreground'>
                            {u.email}
                          </span>
                          {u.created_at && (
                            <span className='text-xs text-muted-foreground'>
                              Registrado:{' '}
                              {new Date(u.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='py-2 pr-4'>
                        {u.role === 'admin' ? (
                          <div className='flex flex-col gap-1'>
                            <span className='badge badge-error flex items-center gap-1'>
                              <Icon
                                category='Administrador'
                                name='MdiShieldCheck'
                                className='w-3 h-3'
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
                          <div className='flex flex-col gap-1'>
                            <span
                              className={`badge ${u.role === 'vendedor' ? 'badge-warning' : 'badge-info'}`}
                            >
                              {u.role || 'comprador'}
                            </span>
                            {/* Selector de rol solo para vendedores y compradores */}
                            {canShowButton(u, 'changeRole') && (
                              <select
                                className='select select-sm select-bordered w-full'
                                value={u.role || 'comprador'}
                                onChange={e =>
                                  changeUserRole(
                                    u.id,
                                    e.target.value as 'vendedor' | 'comprador'
                                  )
                                }
                              >
                                <option value='comprador'>Comprador</option>
                                <option value='vendedor'>Vendedor</option>
                              </select>
                            )}
                          </div>
                        )}
                      </td>
                      <td className='py-2 pr-4'>
                        {u.role === 'vendedor' ? (
                          // Para vendedores: mostrar estado de aprobación y botones
                          <div className='flex items-center gap-2 flex-wrap'>
                            <span
                              className={`badge ${u.vendedor_estado === 'aprobado' ? 'badge-success' : u.vendedor_estado === 'pendiente' ? 'badge-warning' : 'badge-secondary'} flex items-center gap-1`}
                              title={u.vendedor_estado || ''}
                            >
                              {u.vendedor_estado === 'aprobado' && (
                                <Icon
                                  category='Administrador'
                                  name='MdiShieldCheck'
                                  className='w-3 h-3'
                                  alt=''
                                />
                              )}
                              {u.vendedor_estado === 'pendiente' && (
                                <Icon
                                  category='Pedidos'
                                  name='CarbonPendingFilled'
                                  className='w-3 h-3'
                                  alt=''
                                />
                              )}
                              {u.vendedor_estado === 'rechazado' && (
                                <Icon
                                  category='Estados y Feedback'
                                  name='IconoirWarningSquare'
                                  className='w-3 h-3'
                                  alt=''
                                />
                              )}
                              {u.vendedor_estado || 'pendiente'}
                            </span>
                            {canShowButton(u, 'vendorActions') && (
                              <>
                                <button
                                  className='btn btn-outline btn-sm flex items-center min-w-[100px] h-8'
                                  onClick={() =>
                                    setVendorStatus(u.id, 'aprobado')
                                  }
                                  title='Aprobar vendedor'
                                  aria-label='Aprobar vendedor'
                                >
                                  <Icon
                                    category='Administrador'
                                    name='MdiShieldCheck'
                                    className='w-4 h-4 md:mr-1'
                                    alt=''
                                  />
                                  <span className='hidden md:inline'>
                                    Aprobar
                                  </span>
                                </button>
                                <button
                                  className='btn btn-outline btn-sm flex items-center min-w-[100px] h-8'
                                  onClick={() =>
                                    setVendorStatus(u.id, 'rechazado')
                                  }
                                  title='Rechazar vendedor'
                                  aria-label='Rechazar vendedor'
                                >
                                  <Icon
                                    category='Vendedor'
                                    name='LineMdTrash'
                                    className='w-4 h-4 md:mr-1'
                                    alt=''
                                  />
                                  <span className='hidden md:inline'>
                                    Rechazar
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        ) : u.role === 'comprador' ? (
                          // Para compradores: mostrar estado de cuenta
                          <div className='flex items-center gap-2'>
                            <span className='badge badge-info flex items-center gap-1'>
                              <Icon
                                category='Usuario'
                                name='IconamoonProfileFill'
                                className='w-3 h-3'
                                alt=''
                              />
                              Activo
                            </span>
                          </div>
                        ) : u.role === 'admin' ? (
                          // Para admins: mostrar privilegios
                          <div className='flex items-center gap-2'>
                            <span className='badge badge-error flex items-center gap-1'>
                              <Icon
                                category='Administrador'
                                name='MdiShieldCheck'
                                className='w-3 h-3'
                                alt=''
                              />
                              Admin
                            </span>
                          </div>
                        ) : (
                          // Fallback
                          <span className='badge badge-secondary'>-</span>
                        )}
                      </td>
                      <td className='py-2 pr-4'>
                        {canShowButton(u, 'blockActions') ? (
                          <div className='flex items-center gap-2'>
                            <button
                              className={`btn btn-outline btn-sm w-8 h-8 p-0 flex items-center justify-center ${u.bloqueado ? 'opacity-50 pointer-events-none' : ''}`}
                              onClick={() => suspend(u.id, true)}
                              title='Bloquear'
                              aria-label='Bloquear'
                            >
                              <Icon
                                category='Usuario'
                                name='MdiShieldOff'
                                className='w-4 h-4'
                                alt=''
                              />
                            </button>
                            <button
                              className={`btn btn-outline btn-sm w-8 h-8 p-0 flex items-center justify-center ${!u.bloqueado ? 'opacity-50 pointer-events-none' : ''}`}
                              onClick={() => suspend(u.id, false)}
                              title='Desbloquear'
                              aria-label='Desbloquear'
                            >
                              <Icon
                                category='Administrador'
                                name='FluentGavel32Filled'
                                className='w-4 h-4'
                                alt=''
                              />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`badge ${u.bloqueado ? 'badge-error' : 'badge-success'}`}
                          >
                            {u.bloqueado ? 'Bloqueado' : 'Activo'}
                          </span>
                        )}
                      </td>
                      <td className='py-2'>
                        <div className='flex gap-2'>
                          <button
                            className='btn btn-outline btn-sm flex items-center min-w-[100px] h-8'
                            onClick={() =>
                              alert(
                                'Historial y métricas del usuario próximamente'
                              )
                            }
                            title='Detalles'
                            aria-label='Detalles'
                          >
                            <Icon
                              category='Administrador'
                              name='LucideFileClock'
                              className='w-4 h-4 md:mr-1'
                              alt=''
                            />
                            <span className='hidden md:inline'>Detalles</span>
                          </button>
                          {canShowButton(u, 'deleteUser') && (
                            <button
                              className='btn btn-danger btn-sm flex items-center min-w-[100px] h-8'
                              onClick={() => removeUser(u.id)}
                              title='Eliminar'
                              aria-label='Eliminar'
                            >
                              <Icon
                                category='Vendedor'
                                name='LineMdTrash'
                                className='w-4 h-4 md:mr-1'
                                alt=''
                              />
                              <span className='hidden md:inline'>Eliminar</span>
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
