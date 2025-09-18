import React from 'react';
import Icon from '@/components/ui/Icon';
import type { Order, OrderItemRowUI } from './types';

interface Props {
  orders: Order[];
  orderItems: OrderItemRowUI[];
  onMarkSent: (orderItemId: string) => void;
}

export const VendorOrdersSection: React.FC<Props> = ({ orders, orderItems, onMarkSent }) => {
  return (
    <>
      <div className='card'>
        <div className='card-header'>
          <h2 className='text-lg font-semibold text-gray-900'>Pedidos Recientes</h2>
        </div>
        <div className='card-body'>
          {orders.length === 0 ? (
            <p className='text-gray-500 text-center py-8'>No tienes pedidos aún</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-200'>
                    <th className='text-left py-3 px-4 font-medium text-gray-500'>Pedido</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-500'>Cliente</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-500'>Total</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-500'>Estado</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-500'>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className='border-b border-gray-100'>
                      <td className='py-3 px-4 text-sm font-mono'>#{order.id.slice(0, 8)}</td>
                      <td className='py-3 px-4 text-sm'>{order.comprador_email}</td>
                      <td className='py-3 px-4 text-sm font-medium'>${order.total}</td>
                      <td className='py-3 px-4'>
                        <span className={`badge ${order.estado === 'entregado' ? 'badge-success' : order.estado === 'enviado' ? 'badge-primary' : order.estado === 'procesando' ? 'badge-warning' : 'badge-secondary'}`}>
                          {order.estado}
                        </span>
                      </td>
                      <td className='py-3 px-4 text-sm text-gray-500'>{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className='card mt-6'>
        <div className='card-header'>
          <h2 className='text-lg font-semibold text-gray-900'>Ítems pendientes de envío</h2>
        </div>
        <div className='card-body'>
          {orderItems.filter(it => !it.enviado).length === 0 ? (
            <p className='text-gray-500'>No tienes ítems pendientes</p>
          ) : (
            <div className='space-y-2'>
              {orderItems.filter(it => !it.enviado).map(it => (
                <div key={it.id} className='flex items-center justify-between p-3 border rounded-lg'>
                  <div>
                    <p className='font-medium'>
                      {it.producto_nombre} <span className='text-sm text-gray-500'>x{it.cantidad}</span>
                    </p>
                    <p className='text-xs text-gray-500'>Pedido #{it.order_id.slice(0, 8)}</p>
                  </div>
                  <button className='btn btn-outline btn-sm flex items-center gap-1' onClick={() => onMarkSent(it.id)}>
                    <Icon category='Pedidos' name='HugeiconsDeliveredSent' className='w-3 h-3' />
                    Marcar enviado
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VendorOrdersSection;
