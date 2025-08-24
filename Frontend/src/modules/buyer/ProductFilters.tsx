import React from 'react';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import Icon from '@/components/ui/Icon';

interface Category {
  id: string;
  nombre: string;
}

interface ProductFiltersProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  priceMin: number;
  priceMax: number;
  priceMaxAuto: number;
  onPriceMinChange: (value: number) => void;
  onPriceMaxChange: (value: number) => void;
  onClearFilters: () => void;
  showFiltersMobile: boolean;
  className?: string;
}

const ProductFilters: React.FC<ProductFiltersProps> = React.memo(
  ({
    categories,
    selectedCategories,
    onCategoriesChange,
    priceMin,
    priceMax,
    onPriceMinChange,
    onPriceMaxChange,
    onClearFilters,
    showFiltersMobile,
    className = '',
  }) => {
    const handleCategoryChange = (categoryId: string, checked: boolean) => {
      if (checked) {
        onCategoriesChange([...selectedCategories, categoryId]);
      } else {
        onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
      }
    };

    return (
      <div
        className={`lg:col-span-1 ${showFiltersMobile ? '' : 'hidden'} lg:block ${className}`}
      >
        <Card>
          <CardContent className='p-4 sm:p-4 p-3'>
            <h3 className='font-semibold mb-4 flex items-center gap-2'>
              <Icon
                category='Catálogo y producto'
                name='IonFilter'
                className='w-4 h-4'
              />
              Filtros
            </h3>

            {/* Categories Filter */}
            <div className='mb-4'>
              <h4 className='font-medium mb-2 flex items-center gap-2'>
                <Icon
                  category='Catálogo y producto'
                  name='LucideTags'
                  className='w-4 h-4'
                />
                Categorías
              </h4>
              <div className='space-y-2 max-h-40 overflow-y-auto'>
                {categories.map(category => (
                  <label
                    key={category.id}
                    className='flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded'
                  >
                    <input
                      type='checkbox'
                      checked={selectedCategories.includes(category.id)}
                      onChange={e =>
                        handleCategoryChange(category.id, e.target.checked)
                      }
                      className='rounded'
                    />
                    <span className='select-none'>{category.nombre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className='mb-4'>
              <h4 className='font-medium mb-2 flex items-center gap-2'>
                <Icon
                  category='Carrito y checkout'
                  name='VaadinWallet'
                  className='w-4 h-4'
                />
                Rango de precios
              </h4>
              <div className='space-y-2'>
                <div>
                  <label className='text-sm text-gray-600 block mb-1'>
                    Mínimo
                  </label>
                  <Input
                    type='number'
                    value={priceMin}
                    onChange={e => onPriceMinChange(Number(e.target.value))}
                    className='w-full'
                    min='0'
                    placeholder='Precio mínimo'
                  />
                </div>
                <div>
                  <label className='text-sm text-gray-600 block mb-1'>
                    Máximo
                  </label>
                  <Input
                    type='number'
                    value={priceMax}
                    onChange={e => onPriceMaxChange(Number(e.target.value))}
                    className='w-full'
                    min='0'
                    placeholder='Precio máximo'
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            <Button
              variant='outline'
              onClick={onClearFilters}
              className='w-full flex items-center gap-2 sm:py-2 py-2'
            >
              <Icon
                category='Estados y Feedback'
                name='HugeiconsReload'
                className='w-4 h-4'
              />
              Limpiar filtros
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
);

ProductFilters.displayName = 'ProductFilters';

export default ProductFilters;
