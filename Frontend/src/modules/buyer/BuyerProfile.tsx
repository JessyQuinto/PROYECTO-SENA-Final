import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import Icon from '../../components/ui/Icon';

const BuyerProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  const deleteAccount = async () => {
    if (!confirm('¿Eliminar tu cuenta? Esta acción es irreversible.')) return;
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      const supaUrl = (import.meta as any).env?.VITE_SUPABASE_URL as
        | string
        | undefined;
      if (supaUrl && token) {
        const projectRef = new URL(supaUrl).host.split('.')[0];
        const resp = await fetch(
          `https://${projectRef}.functions.supabase.co/self-account`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const j = await resp.json();
        if (!resp.ok) throw new Error(j?.error || 'No se pudo eliminar');
        (window as any).toast?.success('Cuenta eliminada', {
          action: 'delete',
        });
        await supabase.auth.signOut();
        window.location.href = '/';
      }
    } catch (e: any) {
      (window as any).toast?.error(
        e?.message || 'No se pudo eliminar la cuenta',
        { action: 'delete' }
      );
    }
  };

  return (
    <div className='container py-8'>
      <h1 className='heading-lg mb-6 flex items-center gap-3'>
        <Icon
          category='Usuario'
          name='IconamoonProfileFill'
          className='w-8 h-8'
        />
        Mi perfil
      </h1>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Sidebar de navegación */}
        <Card className='lg:col-span-1'>
          <CardContent className='p-4'>
            <nav className='space-y-1'>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'profile'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Información del perfil
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'preferences'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Preferencias
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'security'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Seguridad
              </button>
            </nav>
          </CardContent>
        </Card>

        {/* Contenido principal */}
        <div className='lg:col-span-3'>
          {activeTab === 'profile' && (
            <Card>
              <CardContent className='p-6'>
                <h2 className='text-xl font-semibold mb-6'>Información del perfil</h2>
                
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <h3 className='font-medium mb-4'>Datos personales</h3>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Nombre completo</label>
                        <input
                          type='text'
                          className='input input-bordered w-full'
                          value={user?.nombre || ''}
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
                        <input
                          type='email'
                          className='input input-bordered w-full'
                          value={user?.email || ''}
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Rol</label>
                        <div className='px-3 py-2 bg-gray-100 rounded-md'>
                          <span className='capitalize'>{user?.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className='font-medium mb-4'>Foto de perfil</h3>
                    <div className='flex flex-col items-center'>
                      <div className='h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mb-4'>
                        {(user?.nombre || user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <button className='btn btn-outline btn-sm'>
                        Cambiar foto
                      </button>
                      <p className='text-xs text-gray-500 mt-2'>
                        PNG, JPG de máximo 2MB
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'preferences' && (
            <Card>
              <CardContent className='p-6'>
                <h2 className='text-xl font-semibold mb-6'>Preferencias</h2>
                
                <div className='space-y-6'>
                  <div>
                    <h3 className='font-medium mb-3'>Notificaciones</h3>
                    <div className='space-y-3'>
                      <label className='flex items-center gap-3'>
                        <input type='checkbox' className='checkbox' defaultChecked />
                        <span className='text-sm'>Notificarme sobre pedidos</span>
                      </label>
                      <label className='flex items-center gap-3'>
                        <input type='checkbox' className='checkbox' defaultChecked />
                        <span className='text-sm'>Notificarme sobre ofertas y promociones</span>
                      </label>
                      <label className='flex items-center gap-3'>
                        <input type='checkbox' className='checkbox' />
                        <span className='text-sm'>Notificarme sobre nuevos productos de mis vendedores favoritos</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className='font-medium mb-3'>Idioma y región</h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Idioma</label>
                        <select className='select select-bordered w-full'>
                          <option>Español</option>
                          <option>English</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Moneda</label>
                        <select className='select select-bordered w-full'>
                          <option>Peso Colombiano (COP)</option>
                          <option>US Dollar (USD)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'security' && (
            <Card>
              <CardContent className='p-6'>
                <h2 className='text-xl font-semibold mb-6'>Seguridad</h2>
                
                <div className='space-y-6'>
                  <div className='p-4 bg-blue-50 rounded-lg'>
                    <h3 className='font-medium text-blue-900 mb-2'>Cambiar contraseña</h3>
                    <p className='text-sm text-blue-700 mb-3'>
                      Para cambiar tu contraseña, ve a la configuración de tu cuenta en el panel de autenticación.
                    </p>
                    <button className='btn btn-outline btn-sm'>
                      Ir a configuración de cuenta
                    </button>
                  </div>
                  
                  <div className='border-t pt-4'>
                    <h3 className='font-medium text-red-600 mb-2 flex items-center gap-2'>
                      <Icon
                        category='Estados y Feedback'
                        name='BxErrorCircle'
                        className='w-5 h-5'
                      />
                      Eliminar cuenta
                    </h3>
                    <p className='text-sm text-gray-600 mb-3'>
                      Esta acción es irreversible y eliminará todos tus datos del sistema.
                    </p>
                    <button
                      className='btn btn-danger flex items-center gap-2'
                      onClick={deleteAccount}
                    >
                      <Icon
                        category='Estados y Feedback'
                        name='BxErrorCircle'
                        className='w-4 h-4'
                      />
                      Eliminar mi cuenta
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Accesos rápidos y soporte (mantenidos de la versión original) */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6'>
        <Card className='lg:col-span-2'>
          <CardContent className='p-6 space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Link to='/mis-pedidos' className='select-card p-5 block'>
                <div className='flex items-start gap-3'>
                  <div className='p-2 bg-gray-100 rounded-md'>
                    <Icon
                      category='Pedidos'
                      name='MaterialSymbolsOrdersOutlineRounded'
                      className='w-6 h-6'
                      alt=''
                    />
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-semibold mb-1'>Mis pedidos</h3>
                    <p className='text-sm text-gray-600'>
                      Revisa el estado de tus compras y descarga recibos.
                    </p>
                  </div>
                </div>
              </Link>
              <Link to='/mis-calificaciones' className='select-card p-5 block'>
                <div className='flex items-start gap-3'>
                  <div className='p-2 bg-gray-100 rounded-md'>
                    <Icon
                      category='Catálogo y producto'
                      name='LucideHeart'
                      className='w-6 h-6'
                      alt=''
                    />
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-semibold mb-1'>Mis calificaciones</h3>
                    <p className='text-sm text-gray-600'>
                      Califica tus compras y revisa opiniones anteriores.
                    </p>
                  </div>
                </div>
              </Link>
              <Link
                to='/perfil/perfiles'
                className='select-card p-5 block md:col-span-2'
              >
                <div className='flex items-start gap-3'>
                  <div className='p-2 bg-gray-100 rounded-md'>
                    <Icon
                      category='Usuario'
                      name='RivetIconsSettings'
                      className='w-6 h-6'
                      alt=''
                    />
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-semibold mb-1'>
                      Perfiles de pago y envío
                    </h3>
                    <p className='text-sm text-gray-600'>
                      Gestiona tus direcciones y métodos de pago guardados.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className='space-y-6'>
          <Card>
            <CardContent className='p-6 space-y-3'>
              <h2 className='font-semibold flex items-center gap-2'>
                <Icon
                  category='Navegación principal'
                  name='MdiGrid'
                  className='w-5 h-5'
                />
                Accesos rápidos
              </h2>
              <div className='grid grid-cols-1 gap-2'>
                <Link
                  to='/carrito'
                  className='btn btn-outline text-center flex items-center justify-center gap-2'
                >
                  <Icon
                    category='Carrito y checkout'
                    name='WhhShoppingcart'
                    className='w-4 h-4'
                  />
                  Ver carrito
                </Link>
                <Link
                  to='/checkout'
                  className='btn btn-outline text-center flex items-center justify-center gap-2'
                >
                  <Icon
                    category='Carrito y checkout'
                    name='StreamlinePlumpPaymentRecieve7Solid'
                    className='w-4 h-4'
                  />
                  Ir a pagar
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6 space-y-3'>
              <h2 className='font-semibold flex items-center gap-2'>
                <Icon
                  category='Navegación principal'
                  name='MaterialSymbolsContactSupportRounded'
                  className='w-5 h-5'
                />
                Soporte
              </h2>
              <p className='text-sm text-gray-600'>
                ¿Necesitas ayuda con tu compra? Contáctanos.
              </p>
              <Button
                asChild
                variant='secondary'
                className='flex items-center gap-2'
              >
                <a href='mailto:soporte@tesoroschoco.local'>
                  <Icon
                    category='Autenticacion'
                    name='MdiMail'
                    className='w-4 h-4'
                  />
                  Contactar soporte
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BuyerProfile;