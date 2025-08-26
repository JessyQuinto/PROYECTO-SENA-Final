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
    <div className='container py-8'>
      <h1 className='heading-lg mb-6 flex items-center gap-3'>
        <Icon
          category='Usuario'
          name='IconamoonProfileFill'
          className='w-8 h-8'
        />
        Mi perfil
      </h1>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <Card className='lg:col-span-2'>
          <CardContent className='p-6 space-y-4'>
            <div>
              <h2 className='font-semibold mb-2 flex items-center gap-2'>
                <Icon
                  category='Usuario'
                  name='IconamoonProfileFill'
                  className='w-5 h-5'
                />
                Información de la cuenta
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
                <div>
                  <div className='text-gray-500 flex items-center gap-1'>
                    <Icon
                      category='Usuario'
                      name='IconamoonProfileFill'
                      className='w-3 h-3'
                    />
                    Nombre
                  </div>
                  <div className='font-medium'>{user?.nombre || '—'}</div>
                </div>
                <div>
                  <div className='text-gray-500 flex items-center gap-1'>
                    <Icon
                      category='Autenticacion'
                      name='MdiMail'
                      className='w-3 h-3'
                    />
                    Correo
                  </div>
                  <div className='font-medium'>{user?.email || '—'}</div>
                </div>
                <div>
                  <div className='text-gray-500 flex items-center gap-1'>
                    <Icon
                      category='Usuario'
                      name='MaterialSymbolsShieldLocked'
                      className='w-3 h-3'
                    />
                    Rol
                  </div>
                  <div className='font-medium capitalize'>{user?.role}</div>
                </div>
              </div>
            </div>

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

            <div className='pt-4 border-t'>
              <h2 className='font-semibold mb-2 flex items-center gap-2'>
                <Icon
                  category='Usuario'
                  name='MdiShieldOff'
                  className='w-5 h-5'
                />
                Privacidad
              </h2>
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
