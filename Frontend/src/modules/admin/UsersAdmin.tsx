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

  // Super admin autorizado (el único que puede degradar otros admins)
  const SUPER_ADMIN_EMAIL = 'quitojessy@gmail.com';

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
    const { error } = await supabase
      .from('users')
      .update({ vendedor_estado: estado })
      .eq('id', id);
    if (error) {
      (window as any).toast?.error(error.message, {
        role: 'admin',
        action: 'approve',
      });
      return;
    }
    setUsers(list =>
      list.map(u => (u.id === id ? { ...u, vendedor_estado: estado } : u))
    );
    (window as any).toast?.success(`Vendedor ${estado}`, {
      role: 'admin',
      action: estado === 'aprobado' ? 'approve' : 'reject',
    });

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
      if (!enabled || !user?.email) return;
      const resp = await fetch(
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
      );
      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        console.warn(
          '[notify-vendor-status] respuesta no OK',
          resp.status,
          errText
        );
      }
    } catch (e) {
      // Silencioso; solo log a consola para no bloquear UI
      console.warn('[notify-vendor-status] warning', e);
    }
  };

  const setBlocked = async (id: string, bloqueado: boolean) => {
    const { error } = await supabase
      .from('users')
      .update({ bloqueado })
      .eq('id', id);
    if (error) {
      (window as any).toast?.error(error.message, {
        role: 'admin',
        action: 'update',
      });
      return;
    }
    setUsers(list => list.map(u => (u.id === id ? { ...u, bloqueado } : u)));
    (window as any).toast?.success(
      bloqueado ? 'Usuario bloqueado' : 'Usuario desbloqueado',
      { role: 'admin', action: 'update' }
    );
  };

  const setRole = async (id: string, role: UserRole) => {
    try {
      const user = users.find(u => u.id === id);

      // Validación: Si es vendedor y tiene productos, no permitir cambio de rol
      if (user?.role === 'vendedor' && role !== 'vendedor') {
        // Verificar si tiene productos
        const { data: productos, error: productosError } = await supabase
          .from('productos')
          .select('id, nombre')
          .eq('vendedor_id', id);

        if (productosError) throw productosError;

        if (productos && productos.length > 0) {
          const productosList = productos.map(p => `• ${p.nombre}`).join('\n');
          const errorMessage =
            `❌ NO SE PUEDE CAMBIAR EL ROL ❌\n\n` +
            `El vendedor "${user.nombre_completo}" tiene ${productos.length} producto(s) en su inventario:\n\n` +
            `${productosList}\n\n` +
            `Para cambiar el rol, primero debe:\n` +
            `1. Eliminar todos sus productos, o\n` +
            `2. Transferir los productos a otro vendedor\n\n` +
            `Esta restricción protege la integridad de los datos de productos.`;

          alert(errorMessage);
          (window as any).toast?.error(
            `No se puede cambiar rol: vendedor tiene ${productos.length} producto(s)`,
            { role: 'admin', action: 'update' }
          );
          return;
        }
      }

      // Si está degradando un admin, pedir confirmación adicional
      if (user?.role === 'admin' && role !== 'admin') {
        const confirmMessage =
          `⚠️ DEGRADAR ADMINISTRADOR ⚠️\n\n` +
          `Estás a punto de quitar privilegios de administrador a:\n` +
          `${user.email} - ${user.nombre_completo}\n\n` +
          `Esta acción es IRREVERSIBLE y solo tú como super-admin puedes revertirla.\n\n` +
          `¿Estás SEGURO de que quieres continuar?`;

        if (!confirm(confirmMessage)) {
          return;
        }

        // Segunda confirmación para admins
        if (
          !confirm(
            `SEGUNDA CONFIRMACIÓN:\n\n¿Realmente quieres degradar a este administrador?\n\nEsto quitará TODOS sus privilegios administrativos.`
          )
        ) {
          return;
        }
      }

      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as
        | string
        | undefined;
      if (supaUrl && token) {
        const projectRef = new URL(supaUrl).host.split('.')[0];
        const resp = await fetch(
          `https://${projectRef}.functions.supabase.co/admin-users`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: 'setRole', user_id: id, role }),
          }
        );
        const j = await resp.json();
        if (!resp.ok) throw new Error(j?.error || 'No se pudo actualizar rol');
        setUsers(list => list.map(u => (u.id === id ? { ...u, role } : u)));

        // Mensaje especial para degradación de admin
        if (user?.role === 'admin' && role !== 'admin') {
          (window as any).toast?.success(
            `⚠️ Admin degradado exitosamente a ${role}`,
            { role: 'admin', action: 'update' }
          );
        } else {
          (window as any).toast?.success(`Rol actualizado a ${role}`, {
            role: 'admin',
            action: 'update',
          });
        }
      }
    } catch (e: any) {
      (window as any).toast?.error(e?.message || 'No se pudo actualizar rol', {
        role: 'admin',
        action: 'update',
      });
    }
  };

  const suspend = async (id: string, blocked: boolean) => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as
        | string
        | undefined;
      if (supaUrl && token) {
        const projectRef = new URL(supaUrl).host.split('.')[0];
        const resp = await fetch(
          `https://${projectRef}.functions.supabase.co/admin-users`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: 'suspend', user_id: id, blocked }),
          }
        );
        const j = await resp.json();
        if (!resp.ok) throw new Error(j?.error || 'No se pudo suspender');
        setUsers(list =>
          list.map(u => (u.id === id ? { ...u, bloqueado: blocked } : u))
        );
        (window as any).toast?.success(
          blocked ? 'Usuario suspendido' : 'Usuario reactivado',
          { role: 'admin', action: 'update' }
        );

        // Notificar por correo (bloqueado/reactivado)
        try {
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
        action: 'update',
      });
    }
  };

  const isSuperAdmin = currentUser?.email === SUPER_ADMIN_EMAIL;

  return (
    <AdminLayout
      title='Usuarios'
      subtitle={
        isSuperAdmin
          ? '🔑 Super-Admin: Gestiona roles, bloqueos y puedes degradar otros administradores'
          : 'Gestiona roles, bloqueos y aprobación de vendedores'
      }
    >
      <div className='mb-6 flex items-center justify-between'>
        <input
          className='input-hero max-w-md'
          placeholder='Buscar usuarios por correo o nombre...'
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {isSuperAdmin && (
          <div className='flex items-center gap-2 text-sm text-orange-600 font-medium'>
            <Icon
              category='Administrador'
              name='MdiShieldCheck'
              className='w-4 h-4'
              alt=''
            />
            Super-Admin: Privilegios completos
          </div>
        )}
      </div>

      <div className='card card-hover'>
        <div className='card-body overflow-x-auto'>
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <table className='min-w-full text-sm table-auto'>
              <thead>
                <tr className='text-left text-gray-500 whitespace-nowrap'>
                  <th className='py-2 pr-4 w-[32%]'>Email</th>
                  <th className='py-2 pr-4 w-[20%]'>Nombre</th>
                  <th className='py-2 pr-4 w-[14%]'>Rol</th>
                  <th className='py-2 pr-4 w-[22%]'>Estados</th>
                  <th className='py-2 pr-4 w-[6%]'>Bloqueado</th>
                  <th className='py-2 w-[6%]'>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className='border-t'>
                    <td className='py-2 pr-4'>
                      <div
                        className='max-w-[280px] truncate'
                        title={u.email || ''}
                      >
                        {u.email}
                      </div>
                    </td>
                    <td className='py-2 pr-4'>
                      <div
                        className='max-w-[200px] truncate'
                        title={u.nombre_completo || '-'}
                      >
                        {u.nombre_completo || '-'}
                      </div>
                    </td>
                    <td className='py-2 pr-4'>
                      {canShowButton(u, 'changeRole') ? (
                        <div className='flex flex-col gap-1'>
                          <select
                            className='form-select w-36'
                            value={u.role || 'comprador'}
                            onChange={e =>
                              setRole(u.id, e.target.value as UserRole)
                            }
                          >
                            <option value='comprador'>comprador</option>
                            <option value='vendedor'>vendedor</option>
                            <option value='admin'>admin</option>
                          </select>
                          {u.role === 'admin' &&
                            currentUser?.email === SUPER_ADMIN_EMAIL && (
                              <span className='text-xs text-orange-600 font-medium'>
                                ⚠️ Super-admin: Puedes degradar
                              </span>
                            )}
                          {u.role === 'vendedor' &&
                            vendedoresConProductos.has(u.id) && (
                              <span className='text-xs text-red-600 font-medium'>
                                ⚠️ Tiene productos: No se puede cambiar rol
                              </span>
                            )}
                        </div>
                      ) : (
                        <div className='flex flex-col gap-1'>
                          <span
                            className={`badge ${u.role === 'admin' ? 'badge-error' : u.role === 'vendedor' ? 'badge-warning' : 'badge-info'}`}
                          >
                            {u.role || 'comprador'}
                          </span>
                          {u.role === 'admin' &&
                            currentUser?.email !== SUPER_ADMIN_EMAIL && (
                              <span className='text-xs text-gray-500'>
                                🔒 Solo super-admin puede modificar
                              </span>
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
                                  category='Administrador'
                                  name='FluentGavelProhibited16Filled'
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
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default UsersAdmin;
