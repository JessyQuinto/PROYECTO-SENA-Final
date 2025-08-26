import React from 'react';
import { useCart } from './CartContext';
import { supabase } from '../../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import Icon from '@/components/ui/Icon';

const CartPage: React.FC = () => {
  const { items, total, update, remove, clear } = useCart();
  const navigate = useNavigate();

  const checkout = async () => {
    if (items.length === 0) return;
    try {
      const payload = items.map(i => ({
        producto_id: i.productoId,
        cantidad: i.cantidad,
      }));
      const { data, error } = await supabase.rpc('crear_pedido', {
        items: payload,
      });
      if (error) throw error;
      // Simular pasarela de pago (éxito)
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL as
        | string
        | undefined;
      if (backendUrl) {
        const resp = await fetch(
          `${backendUrl.replace(/\/$/, '')}/payments/simulate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: data, approved: true }),
          }
        );
        if (!resp.ok) {
          let msg = 'Error simulando pago';
          try {
            const j = await resp.json();
            msg = j?.error || msg;
          } catch {}
          throw new Error(msg);
        }
      }
      clear();
      alert('Compra realizada. Pedido: ' + data);
    } catch (e: any) {
      alert(e?.message || 'No se pudo crear el pedido');
    }
  };

  return (
    <div className='container py-4 md:py-8'>
      <div className='max-w-6xl mx-auto'>
        {/* Header mejorado */}
        <div className='text-center mb-6 md:mb-8'>
          <h1 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-3 flex items-center justify-center gap-3'>
            <Icon
              category='Carrito y checkout'
              name='WhhShoppingcart'
              className='w-6 h-6 md:w-8 md:h-8'
            />
            Tu Carrito de Compras
          </h1>
          <p className='text-gray-600 text-base md:text-lg'>
            {items.length > 0
              ? `Tienes ${items.length} producto${items.length > 1 ? 's' : ''} en tu carrito`
              : 'Tu carrito está vacío'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className='max-w-md mx-auto'>
            <Card className='card-hover'>
              <CardContent className='p-8 text-center'>
                <Icon
                  category='Carrito y checkout'
                  name='WhhShoppingcart'
                  className='w-16 h-16 text-gray-400 mx-auto mb-4'
                />
                <h2 className='text-xl font-semibold text-gray-700 mb-2'>
                  Tu carrito está vacío
                </h2>
                <p className='text-gray-600 mb-6'>
                  Agrega productos para comenzar tu compra
                </p>
                <Link
                  to='/productos'
                  className='btn btn-primary flex items-center gap-2 mx-auto text-lg px-8 py-3'
                >
                  <Icon
                    category='Catálogo y producto'
                    name='LineMdSearch'
                    className='w-5 h-5'
                  />
                  Explorar productos
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
            {/* Lista de productos */}
            <div className='lg:col-span-2 space-y-3 md:space-y-4'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4'>
                <h2 className='text-base md:text-lg font-semibold text-gray-900'>
                  Productos en tu carrito
                </h2>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={clear}
                  className='flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 self-start sm:self-auto'
                >
                  <Icon
                    category='Estados y Feedback'
                    name='BxErrorCircle'
                    className='w-4 h-4'
                  />
                  Vaciar carrito
                </Button>
              </div>

              {items.map(i => (
                <Card key={i.productoId} className='card-hover'>
                  <CardContent className='p-4 md:p-6'>
                    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
                      {/* Información del producto */}
                      <div className='flex items-start sm:items-center gap-4 flex-1 w-full sm:w-auto'>
                        <div className='w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 overflow-hidden rounded-lg flex-shrink-0'>
                          {i.imagenUrl ? (
                            <img
                              src={i.imagenUrl}
                              alt={i.nombre}
                              className='w-full h-full object-cover'
                            />
                          ) : (
                            <div className='w-full h-full flex items-center justify-center text-gray-400'>
                              <Icon
                                category='Catálogo y producto'
                                name='MynauiImage'
                                className='w-8 h-8'
                              />
                            </div>
                          )}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h3 className='text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate'>
                            {i.nombre}
                          </h3>
                          <p className='text-base sm:text-lg font-bold text-green-600'>
                            ${i.precio.toLocaleString()}
                          </p>
                          {i.stock !== undefined && (
                            <p className='text-sm text-gray-500'>
                              Stock disponible: {i.stock} unidad
                              {i.stock > 1 ? 'es' : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Controles de cantidad */}
                      <div className='flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto'>
                        <div className='inline-flex items-center border-2 border-gray-200 rounded-lg overflow-hidden'>
                          <button
                            aria-label='Reducir cantidad'
                            className='px-3 py-2 text-sm hover:bg-gray-50 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                            onClick={() =>
                              update(i.productoId, Math.max(1, i.cantidad - 1))
                            }
                            disabled={i.cantidad <= 1}
                          >
                            <Icon
                              category='Catálogo y producto'
                              name='WhhArrowdown'
                              className='w-4 h-4'
                            />
                          </button>
                          <input
                            type='number'
                            className='w-16 text-center text-sm outline-none border-x border-gray-200 py-2'
                            min={1}
                            max={i.stock ?? 9999}
                            value={i.cantidad}
                            onChange={e =>
                              update(
                                i.productoId,
                                Math.max(
                                  1,
                                  Math.min(
                                    Number(e.target.value || 1),
                                    i.stock ?? 9999
                                  )
                                )
                              )
                            }
                          />
                          <button
                            aria-label='Aumentar cantidad'
                            className='px-3 py-2 text-sm hover:bg-gray-50 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                            onClick={() =>
                              update(
                                i.productoId,
                                Math.min(i.cantidad + 1, i.stock ?? 9999)
                              )
                            }
                            disabled={i.cantidad >= (i.stock ?? 9999)}
                          >
                            <Icon
                              category='Catálogo y producto'
                              name='WhhArrowup'
                              className='w-4 h-4'
                            />
                          </button>
                        </div>

                        {/* Subtotal y botón eliminar */}
                        <div className='flex items-center justify-between sm:flex-col sm:items-end gap-3 w-full sm:w-auto'>
                          <div className='text-left sm:text-right min-w-[80px]'>
                            <p className='text-xs text-gray-500'>Subtotal</p>
                            <p className='text-sm sm:text-base font-semibold text-gray-900'>
                              ${(i.precio * i.cantidad).toLocaleString()}
                            </p>
                          </div>

                          {/* Botón eliminar */}
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => remove(i.productoId)}
                            className='flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 min-h-[44px]'
                          >
                            <Icon
                              category='Estados y Feedback'
                              name='BxErrorCircle'
                              className='w-4 h-4'
                            />
                            <span className='hidden sm:inline'>Eliminar</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resumen y botones de acción */}
            <div className='lg:col-span-1 order-first lg:order-last'>
              <Card className='card-hover lg:sticky lg:top-8'>
                <CardContent className='p-4 md:p-6 space-y-4 md:space-y-6'>
                  {/* Header del resumen */}
                  <div className='text-center pb-4 border-b'>
                    <h2 className='text-lg md:text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2'>
                      <Icon
                        category='Carrito y checkout'
                        name='VaadinWallet'
                        className='w-6 h-6'
                      />
                      Resumen de compra
                    </h2>
                    <p className='text-sm text-gray-600'>
                      Revisa tu pedido antes de continuar
                    </p>
                  </div>

                  {/* Lista de productos */}
                  <div className='space-y-3 max-h-48 overflow-y-auto'>
                    {items.map(i => (
                      <div
                        key={i.productoId}
                        className='flex items-center justify-between text-sm'
                      >
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium text-gray-900 truncate'>
                            {i.nombre}
                          </p>
                          <p className='text-gray-500'>
                            Cantidad: {i.cantidad}
                          </p>
                        </div>
                        <span className='font-semibold text-gray-900 ml-2'>
                          ${(i.precio * i.cantidad).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Información adicional */}
                  <div className='space-y-3 pt-4 border-t'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-gray-600'>Subtotal</span>
                      <span className='font-medium'>
                        ${total.toLocaleString()}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-gray-600'>Envío</span>
                      <span className='text-green-600 font-medium'>Gratis</span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-gray-600'>Impuestos</span>
                      <span className='text-gray-500'>Incluidos</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className='pt-4 border-t'>
                    <div className='flex items-center justify-between'>
                      <span className='text-lg font-semibold text-gray-900'>
                        Total a pagar
                      </span>
                      <span className='text-2xl md:text-3xl font-bold text-green-600'>
                        ${total.toLocaleString()}
                      </span>
                    </div>
                    <p className='text-xs text-gray-500 text-center mt-2'>
                      Precios en pesos colombianos
                    </p>
                  </div>

                  {/* Botones de acción */}
                  <div className='space-y-3 pt-4'>
                    <Button
                      className='w-full flex items-center justify-center gap-3 text-base md:text-lg py-3 md:py-4 bg-green-600 hover:bg-green-700'
                      onClick={() => navigate('/pagar')}
                      size='lg'
                    >
                      <Icon
                        category='Carrito y checkout'
                        name='StreamlinePlumpPaymentRecieve7Solid'
                        className='w-5 h-5'
                      />
                      ¡Pagar ahora!
                    </Button>

                    <Link
                      to='/productos'
                      className='btn btn-outline w-full text-center flex items-center justify-center gap-2 py-3'
                    >
                      <Icon
                        category='Catálogo y producto'
                        name='LineMdSearch'
                        className='w-4 h-4'
                      />
                      Seguir comprando
                    </Link>
                  </div>

                  {/* Información de seguridad */}
                  <div className='text-center pt-4 border-t'>
                    <div className='flex items-center justify-center gap-2 text-green-600 mb-2'>
                      <Icon
                        category='Estados y Feedback'
                        name='MdiShieldCheck'
                        className='w-4 h-4'
                      />
                      <span className='text-sm font-medium'>
                        Compra 100% segura
                      </span>
                    </div>
                    <p className='text-xs text-gray-500'>
                      Tus datos están protegidos y tu pedido es procesado de
                      forma segura
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
