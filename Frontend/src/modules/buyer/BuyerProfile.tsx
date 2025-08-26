import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import Icon from '../../components/ui/Icon';

const BuyerProfile: React.FC = () => {
  const { user } = useAuth();

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
    <div className='container py-6 sm:py-8'>
      <h1 className='heading-lg mb-4 sm:mb-6 flex items-center gap-3'>
        <Icon
          category='Usuario'
          name='IconamoonProfileFill'
          className='w-6 h-6 sm:w-8 sm:h-8'
        />
        <span className='text-xl sm:text-2xl'>Mi perfil</span>
      </h1>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6'>
        <Card className='xl:col-span-2'>
          <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
            <div>
              <h2 className='font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg'>
                <Icon
                  category='Usuario'
                  name='IconamoonProfileFill'
                  className='w-4 h-4 sm:w-5 sm:h-5'
                />
                <span>Información de la cuenta</span>
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm'>
                <div>
                  <div className='text-gray-500 flex items-center gap-1 mb-1'>
                    <Icon
                      category='Usuario'
                      name='IconamoonProfileFill'
                      className='w-3 h-3'
                    />
                    <span>Nombre</span>
                  </div>
                  <div className='font-medium text-sm sm:text-base truncate'>{user?.nombre || '—'}</div>
                </div>
                <div>
                  <div className='text-gray-500 flex items-center gap-1 mb-1'>
                    <Icon
                      category='Autenticacion'
                      name='MdiMail'
                      className='w-3 h-3'
                    />
                    <span>Correo</span>
                  </div>
                  <div className='font-medium text-sm sm:text-base truncate'>{user?.email || '—'}</div>
                </div>
                <div className='sm:col-span-2'>
                  <div className='text-gray-500 flex items-center gap-1 mb-1'>
                    <Icon
                      category='Usuario'
                      name='MaterialSymbolsShieldLocked'
                      className='w-3 h-3'
                    />
                    <span>Rol</span>
                  </div>
                  <div className='font-medium text-sm sm:text-base capitalize'>{user?.role}</div>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4'>
              <Link to='/mis-pedidos' className='select-card p-4 sm:p-5 block min-h-[80px] sm:min-h-[100px]'>
                <div className='flex items-start gap-3'>
                  <div className='p-2 bg-gray-100 rounded-md flex-shrink-0'>
                    <Icon
                      category='Pedidos'
                      name='MaterialSymbolsOrdersOutlineRounded'
                      className='w-5 h-5 sm:w-6 sm:h-6'
                      alt=''
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-semibold mb-1 text-sm sm:text-base'>Mis pedidos</h3>
                    <p className='text-xs sm:text-sm text-gray-600 line-clamp-2'>
                      Revisa el estado de tus compras y descarga recibos.
                    </p>
                  </div>
                </div>
              </Link>
              <Link to='/mis-calificaciones' className='select-card p-4 sm:p-5 block min-h-[80px] sm:min-h-[100px]'>
                <div className='flex items-start gap-3'>
                  <div className='p-2 bg-gray-100 rounded-md flex-shrink-0'>
                    <Icon
                      category='Catálogo y producto'
                      name='LucideHeart'
                      className='w-5 h-5 sm:w-6 sm:h-6'
                      alt=''
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-semibold mb-1 text-sm sm:text-base'>Mis calificaciones</h3>
                    <p className='text-xs sm:text-sm text-gray-600 line-clamp-2'>
                      Califica tus compras y revisa opiniones anteriores.
                    </p>
                  </div>
                </div>
              </Link>
              <Link
                to='/perfil/perfiles'
                className='select-card p-4 sm:p-5 block lg:col-span-2 min-h-[80px] sm:min-h-[100px]'
              >
                <div className='flex items-start gap-3'>
                  <div className='p-2 bg-gray-100 rounded-md flex-shrink-0'>
                    <Icon
                      category='Usuario'
                      name='RivetIconsSettings'
                      className='w-5 h-5 sm:w-6 sm:h-6'
                      alt=''
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-semibold mb-1 text-sm sm:text-base'>
                      Perfiles de pago y envío
                    </h3>
                    <p className='text-xs sm:text-sm text-gray-600 line-clamp-2'>
                      Gestiona tus direcciones y métodos de pago guardados.
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            <div className='pt-4 border-t'>
              <h2 className='font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg'>
                <Icon
                  category='Usuario'
                  name='MdiShieldOff'
                  className='w-4 h-4 sm:w-5 sm:h-5'
                />
                <span>Privacidad</span>
              </h2>
              <button
                className='btn btn-danger flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto text-sm sm:text-base'
                onClick={deleteAccount}
              >
                <Icon
                  category='Estados y Feedback'
                  name='BxErrorCircle'
                  className='w-4 h-4'
                />
                <span>Eliminar mi cuenta</span>
              </button>
            </div>
          </CardContent>
        </Card>

        <div className='space-y-4 sm:space-y-6'>
          <Card>
            <CardContent className='p-4 sm:p-6 space-y-3'>
              <h2 className='font-semibold flex items-center gap-2 text-base sm:text-lg'>
                <Icon
                  category='Navegación principal'
                  name='MdiGrid'
                  className='w-4 h-4 sm:w-5 sm:h-5'
                />
                <span>Accesos rápidos</span>
              </h2>
              <div className='grid grid-cols-1 gap-2 sm:gap-3'>
                <Link
                  to='/carrito'
                  className='btn btn-outline text-center flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base'
                >
                  <Icon
                    category='Carrito y checkout'
                    name='WhhShoppingcart'
                    className='w-4 h-4'
                  />
                  <span>Ver carrito</span>
                </Link>
                <Link
                  to='/checkout'
                  className='btn btn-outline text-center flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base'
                >
                  <Icon
                    category='Carrito y checkout'
                    name='StreamlinePlumpPaymentRecieve7Solid'
                    className='w-4 h-4'
                  />
                  <span>Ir a pagar</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4 sm:p-6 space-y-3'>
              <h2 className='font-semibold flex items-center gap-2 text-base sm:text-lg'>
                <Icon
                  category='Navegación principal'
                  name='MaterialSymbolsContactSupportRounded'
                  className='w-4 h-4 sm:w-5 sm:h-5'
                />
                <span>Soporte</span>
              </h2>
              <p className='text-xs sm:text-sm text-gray-600'>
                ¿Necesitas ayuda con tu compra? Contáctanos.
              </p>
              <Button
                asChild
                variant='secondary'
                className='flex items-center justify-center gap-2 min-h-[44px] w-full text-sm sm:text-base'
              >
                <a href='mailto:soporte@tesoroschoco.local'>
                  <Icon
                    category='Autenticacion'
                    name='MdiMail'
                    className='w-4 h-4'
                  />
                  <span>Contactar soporte</span>
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
