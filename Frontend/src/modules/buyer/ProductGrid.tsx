import React from 'react';
import Icon from '@/components/ui/Icon';
import ProductCard from './ProductCard';

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

interface ProductGridProps {
  products: Product[];
  avgMap: { [key: string]: number };
  twoColsMobile: boolean;
  className?: string;
}

const ProductGrid: React.FC<ProductGridProps> = React.memo(
  ({ products, avgMap, twoColsMobile, className = '' }) => {
    // Empty state - optimizado para móviles
    if (products.length === 0) {
      return (
        <div className={`text-center py-8 md:py-12 px-4 ${className}`}>
          <Icon
            category='Catálogo y producto'
            name='BxsPackage'
            className='w-16 h-16 md:w-12 md:h-12 text-gray-400 mx-auto mb-4 md:mb-4'
          />
          <h3 className='text-xl md:text-lg font-semibold text-gray-900 mb-2 md:mb-2'>
            No se encontraron productos
          </h3>
          <p className='text-base md:text-sm text-gray-500 leading-relaxed'>
            Intenta ajustar tus filtros de búsqueda
          </p>
        </div>
      );
    }

    return (
      <div className={`min-w-0 lg:col-span-3 ${className}`}>
        {/* Results count - optimizado para móviles */}
        <div className='flex justify-between items-center mb-4 md:mb-6 px-2 md:px-0'>
          <p className='text-sm md:text-base opacity-80 font-medium'>
            {products.length} producto{products.length !== 1 ? 's' : ''}{' '}
            encontrado{products.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Products Grid - optimizado para móviles */}
        <div
          className={`
            grid gap-3 md:gap-4 lg:gap-6 
            items-stretch content-start
            ${twoColsMobile 
              ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
            }
            mobile-scroll-smooth
          `}
        >
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              avg={avgMap[product.id]}
            />
          ))}
        </div>
      </div>
    );
  }
);

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid;
