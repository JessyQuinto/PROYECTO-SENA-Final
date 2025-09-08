import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { useCart } from './CartContext';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import Icon from '@/components/ui/Icon';
import { ProductImage } from '@/components/ui/OptimizedImage';

interface Product {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  imagen_url?: string;
  vendedor_id: string;
  categoria_id?: string;
  created_at: string;
  users?: {
    nombre_completo?: string;
    email: string;
  };
  categorias?: {
    nombre: string;
  };
}

interface ProductCardProps {
  product: Product;
  avg?: number;
  className?: string;
}

const ProductCardBase: React.FC<ProductCardProps> = ({
  product,
  avg,
  className = '',
}) => {
  const navigate = useNavigate();
  const { add } = useCart();
  const { requireCartAccess } = useAuthRedirect();
  const isLowStock = Number(product.stock) <= 5 && Number(product.stock) > 0;
  const createdAt = product.created_at ? new Date(product.created_at) : null;
  const isNew = createdAt
    ? Date.now() - createdAt.getTime() < 1000 * 60 * 60 * 24 * 14
    : false;

  const goToDetail = () => navigate(`/productos/${product.id}`);

  return (
    <Card
      className={`
        product-card mobile-card
        transition-all duration-300 overflow-hidden group 
        hover:shadow-xl border-gray-200 
        mobile-accelerated
        ${className}
      `}
      onClick={goToDetail}
      role='button'
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToDetail();
        }
      }}
    >
      <Link to={`/productos/${product.id}`} className='block'>
        <div className='relative bg-gray-100 overflow-hidden aspect-[3/2]'>
          {/* Badges para stock bajo y productos nuevos */}
          <div className='absolute top-2 left-2 z-10 flex flex-col gap-1'>
            {isNew && (
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow-sm'>
                Nuevo
              </span>
            )}
            {isLowStock && (
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 shadow-sm'>
                Stock bajo
              </span>
            )}
          </div>

          {product.imagen_url ? (
            <ProductImage
              src={product.imagen_url}
              alt={product.nombre}
              className='absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-300'
              priority={false}
              lazy={true}
              placeholder='skeleton'
              fallback='/assert/2/9a92cd16-82e0-4b9b-bc8f-a7805b2ad499.jpg'
            />
          ) : (
            <div
              className='absolute inset-0 w-full h-full flex items-center justify-center text-gray-400'
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, rgba(0,0,0,0.10), rgba(0,0,0,0.10)), url('/assert/2/9a92cd16-82e0-4b9b-bc8f-a7805b2ad499.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <Icon
                category='Catálogo y producto'
                name='MynauiImage'
                className='w-8 h-8 md:w-6 md:h-6'
              />
            </div>
          )}
        </div>
      </Link>

      <CardContent className='p-3 md:p-4'>
        <button
          type='button'
          className='block mb-2 md:mb-3 text-left w-full touch-target'
          onClick={e => {
            e.stopPropagation();
            goToDetail();
          }}
        >
          <h3 className='text-sm md:text-base font-medium line-clamp-2 group-hover:text-primary leading-tight'>
            {product.nombre}
          </h3>
        </button>

        {/* Información del vendedor */}
        {product.users?.nombre_completo && (
          <p className='text-xs md:text-sm text-gray-600 mb-2 md:mb-3 line-clamp-1'>
            Por: {product.users.nombre_completo}
          </p>
        )}

        {/* Categoría */}
        {product.categorias?.nombre && (
          <p className='text-xs text-gray-500 mb-2 md:mb-3 line-clamp-1'>
            {product.categorias.nombre}
          </p>
        )}

        {/* Rating display */}
        {avg !== undefined && avg > 0 && (
          <div className='flex items-center gap-1 mb-2'>
            <div className='flex'>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  category="Catálogo y producto"
                  name={star <= Math.round(avg) ? "MdiStar" : "MdiStarOutline"}
                  className={`w-4 h-4 ${star <= Math.round(avg) ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className='text-xs text-gray-600'>
              {avg.toFixed(1)}
            </span>
          </div>
        )}

        <div className='flex items-center justify-between gap-2'>
          <div className='flex flex-col'>
            <span className='text-lg md:text-xl font-bold text-primary'>
              ${Number(product.precio).toLocaleString()}
            </span>
            {Number(product.stock) <= 0 && (
              <span className='text-xs text-red-600 font-medium'>
                Agotado
              </span>
            )}
          </div>

          <button
            className={`
              touch-target-lg
              flex items-center justify-center
              w-10 h-10 md:w-12 md:h-12
              rounded-full
              text-white font-bold text-lg
              transition-all duration-200
              shadow-sm
              ${Number(product.stock) <= 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 active:scale-95'
              }
            `}
            onClick={e => {
              e.stopPropagation();
              if (Number(product.stock) > 0) {
                // Verificar si el usuario puede añadir al carrito
                if (!requireCartAccess({
                  message: 'Debes iniciar sesión para añadir productos al carrito',
                  returnTo: '/productos'
                })) {
                  return; // El usuario fue redirigido al login
                }

                // Usuario autenticado y con rol correcto, añadir al carrito
                add({
                  productoId: product.id,
                  nombre: product.nombre,
                  precio: Number(product.precio),
                  cantidad: 1,
                  imagenUrl: product.imagen_url || undefined,
                  stock: product.stock,
                });
              }
            }}
            disabled={Number(product.stock) <= 0}
            aria-label={`Añadir ${product.nombre} al carrito`}
          >
            <Icon
              category='Carrito y checkout'
              name='WhhShoppingcart'
              className='w-5 h-5 md:w-6 md:h-6'
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

const ProductCard = React.memo(ProductCardBase);

export default ProductCard;
