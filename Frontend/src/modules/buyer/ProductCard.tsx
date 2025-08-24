import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { useCart } from './CartContext';
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
  const { add } = useCart();
  const isLowStock = Number(product.stock) <= 5 && Number(product.stock) > 0;
  const createdAt = product.created_at ? new Date(product.created_at) : null;
  const isNew = createdAt
    ? Date.now() - createdAt.getTime() < 1000 * 60 * 60 * 24 * 14
    : false;

  const handleAddToCart = () => {
    add({
      productoId: product.id,
      nombre: product.nombre,
      precio: Number(product.precio),
      cantidad: 1,
      imagenUrl: product.imagen_url || undefined,
      stock: product.stock,
    });
  };

  return (
    <Card
      className={`transition-all overflow-hidden group hover:shadow-xl border-gray-200 ${className}`}
    >
      <Link to={`/productos/${product.id}`} className='block'>
        <div className='relative bg-gray-100 overflow-hidden aspect-[3/2]'>
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
                className='w-8 h-8'
              />
            </div>
          )}
          <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3'>
            <div className='flex items-center justify-between'>
              {product.categorias?.nombre && (
                <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-90 text-gray-700'>
                  {product.categorias.nombre}
                </span>
              )}
              {isNew && (
                <span className='text-[11px] text-white/90'>Nuevo</span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <CardContent className='p-4'>
        <Link to={`/productos/${product.id}`} className='block'>
          <h3 className='text-base font-semibold line-clamp-2 group-hover:text-(--color-terracotta-suave)'>
            {product.nombre}
          </h3>
        </Link>

        <div className='mt-1 flex items-center justify-between'>
          <span className='text-2xl font-bold text-(--color-terracotta-suave)'>
            ${Number(product.precio).toLocaleString()}
          </span>
          {avg !== undefined && (
            <div className='text-xs text-yellow-600 flex items-center gap-1'>
              <Icon
                category='Catálogo y producto'
                name='LucideHeart'
                className='w-3 h-3'
              />
              {avg.toFixed(1)}
            </div>
          )}
        </div>

        <div className='mt-3 flex items-center justify-between'>
          {isLowStock ? (
            <span className='inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-800'>
              <Icon
                category='Estados y Feedback'
                name='MaterialSymbolsWarning'
                className='w-3 h-3 mr-1'
              />
              ¡Pocas unidades!
            </span>
          ) : (
            <span className='text-xs text-gray-500'>
              Stock: {product.stock}
            </span>
          )}

          <div className='flex items-center gap-2'>
            <Link
              to={`/productos/${product.id}`}
              className='btn btn-outline btn-sm flex items-center gap-1'
            >
              <Icon
                category='Catálogo y producto'
                name='LineMdSearch'
                className='w-3 h-3'
              />
              Ver
            </Link>
            <button
              className='btn btn-primary btn-sm flex items-center gap-1'
              onClick={handleAddToCart}
              disabled={Number(product.stock) <= 0}
              aria-label={`Añadir ${product.nombre} al carrito`}
            >
              <Icon
                category='Carrito y checkout'
                name='WhhShoppingcart'
                className='w-3 h-3'
              />
              Añadir
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProductCard = React.memo(ProductCardBase);

export default ProductCard;
