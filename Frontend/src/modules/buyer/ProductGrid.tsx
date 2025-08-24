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
    // Empty state
    if (products.length === 0) {
      return (
        <div className={`text-center py-12 ${className}`}>
          <Icon
            category='Catálogo y producto'
            name='BxsPackage'
            className='w-12 h-12 text-gray-400 mx-auto mb-4'
          />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No se encontraron productos
          </h3>
          <p className='text-gray-500'>
            Intenta ajustar tus filtros de búsqueda
          </p>
        </div>
      );
    }

    return (
      <div className={`min-w-0 lg:col-span-3 ${className}`}>
        {/* Results count */}
        <div className='flex justify-between items-center mb-6'>
          <p className='opacity-80'>
            {products.length} producto{products.length !== 1 ? 's' : ''}{' '}
            encontrado{products.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Products Grid */}
        <div
          className={`grid ${
            twoColsMobile ? 'grid-cols-2' : 'grid-cols-1'
          } sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch content-start`}
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
