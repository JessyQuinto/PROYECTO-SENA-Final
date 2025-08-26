import React from 'react';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Label } from '@/components/ui/shadcn/label';
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
        role='complementary'
        aria-label='Filtros de productos'
      >
        <Card>
          <CardContent className='p-4 sm:p-4 p-3'>
            <h3 className='font-semibold mb-4 flex items-center gap-2'>
              <Icon
                category='Catálogo y producto'
                name='IonFilter'
                className='w-4 h-4'
                aria-hidden='true'
              />
              Filtros
            </h3>

            {/* Categories Filter */}
            <fieldset className='mb-4'>
              <legend className='font-medium mb-2 flex items-center gap-2'>
                <Icon
                  category='Catálogo y producto'
                  name='LucideTags'
                  className='w-4 h-4'
                  aria-hidden='true'
                />
                Categorías
              </legend>
              <div 
                className='space-y-2 max-h-40 overflow-y-auto'
                role='group'
                aria-label='Seleccionar categorías de productos'
              >
                {categories.map(category => (
                  <label
                    key={category.id}
                    className='flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded focus-within:bg-gray-50'
                  >
                    <input
                      type='checkbox'
                      checked={selectedCategories.includes(category.id)}
                      onChange={e =>
                        handleCategoryChange(category.id, e.target.checked)
                      }
                      className='rounded focus:ring-2 focus:ring-ring focus:ring-offset-2'
                      aria-describedby={`category-${category.id}-desc`}
                    />
                    <span className='select-none'>{category.nombre}</span>
                    <span id={`category-${category.id}-desc`} className='sr-only'>
                      {selectedCategories.includes(category.id) ? 'Seleccionado' : 'No seleccionado'}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Price Range Filter */}
            <fieldset className='mb-4'>
              <legend className='font-medium mb-2 flex items-center gap-2'>
                <Icon
                  category='Carrito y checkout'
                  name='VaadinWallet'
                  className='w-4 h-4'
                  aria-hidden='true'
                />
                Rango de precios
              </legend>
              <div className='space-y-2'>
                <div>
                  <Label 
                    htmlFor='price-min'
                    className='text-sm text-gray-600 block mb-1'
                  >
                    Mínimo
                  </Label>
                  <Input
                    id='price-min'
                    type='number'
                    value={priceMin}
                    onChange={e => onPriceMinChange(Number(e.target.value))}
                    className='w-full'
                    min='0'
                    placeholder='Precio mínimo'
                    aria-label='Precio mínimo en pesos colombianos'
                    aria-describedby='price-min-hint'
                  />
                  <div id='price-min-hint' className='sr-only'>
                    Ingresa el precio mínimo para filtrar productos
                  </div>
                </div>
                <div>
                  <Label 
                    htmlFor='price-max'
                    className='text-sm text-gray-600 block mb-1'
                  >
                    Máximo
                  </Label>
                  <Input
                    id='price-max'
                    type='number'
                    value={priceMax}
                    onChange={e => onPriceMaxChange(Number(e.target.value))}
                    className='w-full'
                    min='0'
                    placeholder='Precio máximo'
                    aria-label='Precio máximo en pesos colombianos'
                    aria-describedby='price-max-hint'
                  />
                  <div id='price-max-hint' className='sr-only'>
                    Ingresa el precio máximo para filtrar productos
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Clear Filters Button */}
            <Button
              variant='outline'
              onClick={onClearFilters}
              className='w-full flex items-center gap-2 sm:py-2 py-2'
              aria-label='Limpiar todos los filtros aplicados'
            >
              <Icon
                category='Estados y Feedback'
                name='HugeiconsReload'
                className='w-4 h-4'
                aria-hidden='true'
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
