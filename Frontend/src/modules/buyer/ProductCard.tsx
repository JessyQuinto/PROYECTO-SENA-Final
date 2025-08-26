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
      className={`product-card transition-all overflow-hidden group hover:shadow-xl border-gray-200 bg-white ${className}`}
    >
      <Link to={`/productos/${product.id}`} className='block'>
        <div className='relative bg-gray-100 overflow-hidden aspect-[4/3] sm:aspect-[3/2]'>
          {product.imagen_url ? (
            <ProductImage
              src={product.imagen_url}
              alt={product.nombre}
              className='absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-300 object-cover'
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
        </div>
      </Link>

      <CardContent className='p-3 sm:p-4'>
        <Link to={`/productos/${product.id}`} className='block mb-2'>
          <h3 className='text-sm sm:text-base font-medium line-clamp-2 group-hover:text-(--color-terracotta-suave) mb-2'>
            {product.nombre}
          </h3>
        </Link>

        <div className='flex items-center justify-between mt-2'>
          <span className='text-base sm:text-lg font-bold text-(--color-terracotta-suave)'>
            ${Number(product.precio).toLocaleString()}
          </span>

          <button
            className='btn btn-primary btn-sm min-w-[44px] h-[44px] flex items-center justify-center rounded-lg'
            onClick={handleAddToCart}
            disabled={Number(product.stock) <= 0}
            aria-label={`Añadir ${product.nombre} al carrito`}
          >
            <span className='text-lg font-bold'>+</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

const ProductCard = React.memo(ProductCardBase);

export default ProductCard;
