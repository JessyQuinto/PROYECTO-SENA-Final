import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import BuyerLayout from './BuyerLayout';
import Icon from '@/components/ui/Icon';

const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('id,total,estado,created_at')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const deleteAccount = async () => {
    if (!confirm('¿Eliminar tu cuenta? Esta acción es irreversible.')) return;
    try {
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

  const cancel = async (id: string) => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL as
        | string
        | undefined;
      if (!backendUrl || !token) throw new Error('Backend no configurado');
      const resp = await fetch(
        `${backendUrl.replace(/\/$/, '')}/orders/${id}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const j = await resp.json();
      if (!resp.ok) throw new Error(j?.error || 'No se pudo cancelar');
      await load();
      (window as any).toast?.success('Pedido cancelado', {
        role: 'comprador',
        action: 'cancel',
      });
    } catch (e: any) {
      (window as any).toast?.error(e?.message || 'No se pudo cancelar', {
        role: 'comprador',
        action: 'cancel',
      });
    }
  };

  return (
    <BuyerLayout title='Mis Pedidos'>
      <div className='flex items-center justify-between mb-3'>
        <h2 className='font-semibold flex items-center gap-2'>
          <Icon
            category='Pedidos'
            name='MaterialSymbolsOrdersOutlineRounded'
            className='w-5 h-5'
          />
          Mis pedidos
        </h2>
        <button
          className='btn btn-outline btn-sm flex items-center gap-2'
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
      {loading ? (
        <div className='flex items-center justify-center py-8'>
          <Icon
            category='Estados y Feedback'
            name='HugeiconsReload'
            className='w-6 h-6 animate-spin'
          />
          <span className='ml-2'>Cargando...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className='card'>
          <div className='card-body text-center text-gray-600'>
            <Icon
              category='Pedidos'
              name='MaterialSymbolsOrdersOutlineRounded'
              className='w-16 h-16 mx-auto mb-4 text-gray-400'
            />
            No tienes pedidos
          </div>
        </div>
      ) : (
        <div className='card card-hover'>
          <div className='card-body overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left text-gray-500'>
                  <th className='py-2 pr-4 flex items-center gap-2'>
                    <Icon
                      category='Pedidos'
                      name='MaterialSymbolsOrdersOutlineRounded'
                      className='w-4 h-4'
                    />
                    ID
                  </th>
                  <th className='py-2 pr-4 flex items-center gap-2'>
                    <Icon
                      category='Estados y Feedback'
                      name='IconoirWarningSquare'
                      className='w-4 h-4'
                    />
                    Fecha
                  </th>
                  <th className='py-2 pr-4 flex items-center gap-2'>
                    <Icon
                      category='Pedidos'
                      name='CarbonPendingFilled'
                      className='w-4 h-4'
                    />
                    Estado
                  </th>
                  <th className='py-2 pr-4 flex items-center gap-2'>
                    <Icon
                      category='Carrito y checkout'
                      name='VaadinWallet'
                      className='w-4 h-4'
                    />
                    Total
                  </th>
                  <th className='py-2 flex items-center gap-2'>
                    <Icon
                      category='Navegación principal'
                      name='MdiGrid'
                      className='w-4 h-4'
                    />
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className='border-t'>
                    <td className='py-2 pr-4 font-mono'>
                      <Link to={`/pedido/${o.id}`} className='nav-link'>
                        #{o.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className='py-2 pr-4'>
                      {new Date(o.created_at).toLocaleString()}
                    </td>
                    <td className='py-2 pr-4'>{o.estado}</td>
                    <td className='py-2 pr-4 font-semibold'>
                      ${Number(o.total).toFixed(0)}
                    </td>
                    <td className='py-2 flex items-center gap-2'>
                      <Link
                        to={`/pedido/${o.id}`}
                        className='btn btn-primary btn-sm flex items-center gap-1'
                      >
                        <Icon
                          category='Catálogo y producto'
                          name='LineMdSearch'
                          className='w-3 h-3'
                        />
                        Ver
                      </Link>
                      {['procesando', 'enviado', 'entregado'].includes(
                        o.estado
                      ) && (
                        <Link
                          to={`/recibo/${o.id}`}
                          className='btn btn-secondary btn-sm flex items-center gap-1'
                        >
                          <Icon
                            category='Carrito y checkout'
                            name='TablerDownload'
                            className='w-3 h-3'
                          />
                          Ver recibo
                        </Link>
                      )}
                      {o.estado === 'pendiente' && (
                        <button
                          className='btn btn-outline btn-sm flex items-center gap-1'
                          onClick={() => cancel(o.id)}
                        >
                          <Icon
                            category='Pedidos'
                            name='IxCancelled'
                            className='w-3 h-3'
                          />
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </BuyerLayout>
  );
};

export default MyOrdersPage;
