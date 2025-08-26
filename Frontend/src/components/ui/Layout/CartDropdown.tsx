import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/modules/buyer/CartContext';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/shadcn/button';

export const CartDropdown: React.FC = () => {
  const { items, remove, update } = useCart();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const cartCount = items.reduce((sum, item) => sum + (item.cantidad || 0), 0);
  const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  // Close dropdown on component unmount or user change
  React.useEffect(() => {
    if (!user && isOpen) {
      setIsOpen(false);
    }
  }, [user, isOpen]);

  return (
    <div className='relative'>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => user && setIsOpen(!isOpen)}
        className='relative h-9 w-9 transition-all duration-200 hover:bg-accent hover:scale-105'
        aria-label={`Carrito de compras (${cartCount} artículos)`}
        disabled={!user}
      >
        {/* Improved shopping cart icon */}
        <svg
          className='h-5 w-5'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z'
          />
        </svg>
        {cartCount > 0 && (
          <span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground shadow-sm animate-pulse'>
            {cartCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className='fixed inset-0 z-40'
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className='absolute right-0 z-50 mt-2 w-96 rounded-lg border bg-card text-card-foreground shadow-lg'>
            {/* Header */}
            <div className='flex items-center justify-between border-b p-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Tu carrito</p>
                <p className='font-semibold'>
                  {cartCount} artículo{cartCount !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsOpen(false)}
                aria-label='Cerrar carrito'
                className='h-8 w-8'
              >
                <svg
                  className='h-4 w-4'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </Button>
            </div>

            {/* Items */}
            <div className='max-h-80 overflow-auto'>
              {items.length === 0 ? (
                <div className='p-8 text-center'>
                  <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
                    <svg
                      className='h-6 w-6 text-muted-foreground'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z'
                      />
                    </svg>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Tu carrito está vacío.
                  </p>
                </div>
              ) : (
                <div className='divide-y'>
                  {items.map(item => (
                    <div
                      key={item.productoId}
                      className='flex items-center gap-4 p-4'
                    >
                      <div className='h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted'>
                        {item.imagenUrl ? (
                          <img
                            src={item.imagenUrl}
                            alt={item.nombre}
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
                            —
                          </div>
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='truncate text-sm font-medium'>
                          {item.nombre}
                        </p>
                        <div className='mt-1 flex items-center gap-3'>
                          <div className='inline-flex items-center rounded-md border'>
                            <button
                              className='px-2 py-1 text-sm hover:bg-accent'
                              onClick={() =>
                                update(
                                  item.productoId,
                                  Math.max(1, item.cantidad - 1)
                                )
                              }
                              aria-label='Disminuir cantidad'
                            >
                              -
                            </button>
                            <input
                              type='number'
                              className='w-12 bg-transparent text-center text-sm outline-none'
                              min={1}
                              max={item.stock ?? 9999}
                              value={item.cantidad}
                              onChange={e =>
                                update(
                                  item.productoId,
                                  Math.max(
                                    1,
                                    Math.min(
                                      Number(e.target.value || 1),
                                      item.stock ?? 9999
                                    )
                                  )
                                )
                              }
                              aria-label='Cantidad'
                            />
                            <button
                              className='px-2 py-1 text-sm hover:bg-accent'
                              onClick={() =>
                                update(
                                  item.productoId,
                                  Math.min(
                                    item.cantidad + 1,
                                    item.stock ?? 9999
                                  )
                                )
                              }
                              aria-label='Aumentar cantidad'
                            >
                              +
                            </button>
                          </div>
                          <span className='text-sm font-semibold text-primary'>
                            ${(item.precio * item.cantidad).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => remove(item.productoId)}
                        aria-label='Quitar del carrito'
                        className='h-8 w-8 text-muted-foreground hover:text-destructive'
                      >
                        <svg
                          className='h-4 w-4'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2'
                          />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className='border-t p-4'>
                <div className='mb-3 flex items-center justify-between text-sm'>
                  <span className='text-muted-foreground'>Total</span>
                  <span className='text-lg font-bold'>
                    ${total.toLocaleString()}
                  </span>
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <Link to='/carrito' onClick={() => setIsOpen(false)}>
                    <Button variant='outline' className='w-full'>
                      Ver carrito
                    </Button>
                  </Link>
                  <Link to='/checkout' onClick={() => setIsOpen(false)}>
                    <Button className='w-full'>Pagar ahora</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CartDropdown;
