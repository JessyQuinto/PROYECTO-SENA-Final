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
    priceMaxAuto,
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
        className={`
          lg:col-span-1 
          ${showFiltersMobile ? 'block' : 'hidden'} 
          lg:block 
          mobile-scroll-smooth
          ${className}
        `}
        role='complementary'
        aria-label='Filtros de productos'
      >
        <Card className='mobile-card'>
          <CardContent className='p-4 md:p-6'>
            <h3 className='font-semibold mb-4 md:mb-6 flex items-center gap-2 text-lg md:text-xl'>
              <Icon
                category='Catálogo y producto'
                name='IonFilter'
                className='w-5 h-5 md:w-4 md:h-4'
                aria-hidden='true'
              />
              Filtros
            </h3>

            {/* Categories Filter - optimizado para móviles */}
            <fieldset className='mb-6 md:mb-8'>
              <legend className='font-medium mb-3 md:mb-4 flex items-center gap-2 text-base md:text-sm'>
                <Icon
                  category='Catálogo y producto'
                  name='LucideTags'
                  className='w-5 h-5 md:w-4 md:h-4'
                  aria-hidden='true'
                />
                Categorías
              </legend>
              <div 
                className='space-y-3 md:space-y-2 max-h-48 md:max-h-40 overflow-y-auto mobile-scroll-smooth'
                role='group'
                aria-label='Seleccionar categorías de productos'
              >
                {categories.map(category => (
                  <label
                    key={category.id}
                    className='
                      flex items-center gap-3 md:gap-2 
                      text-sm md:text-sm cursor-pointer 
                      hover:bg-gray-50 p-2 md:p-1 rounded-lg md:rounded
                      focus-within:bg-gray-50
                      touch-target
                      transition-colors duration-200
                    '
                  >
                    <input
                      type='checkbox'
                      checked={selectedCategories.includes(category.id)}
                      onChange={e =>
                        handleCategoryChange(category.id, e.target.checked)
                      }
                      className='
                        w-5 h-5 md:w-4 md:h-4
                        rounded 
                        focus:ring-2 focus:ring-primary focus:ring-offset-2
                        text-primary
                      '
                      aria-describedby={`category-${category.id}-desc`}
                    />
                    <span className='select-none font-medium'>{category.nombre}</span>
                    <span id={`category-${category.id}-desc`} className='sr-only'>
                      {selectedCategories.includes(category.id) ? 'Seleccionado' : 'No seleccionado'}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Price Range Filter - optimizado para móviles */}
            <fieldset className='mb-6 md:mb-8'>
              <legend className='font-medium mb-3 md:mb-4 flex items-center gap-2 text-base md:text-sm'>
                <Icon
                  category='Catálogo y producto'
                  name='VaadinWallet'
                  className='w-5 h-5 md:w-4 md:h-4'
                  aria-hidden='true'
                />
                Rango de Precio
              </legend>
              <div className='space-y-4 md:space-y-3'>
                <div>
                  <Label htmlFor='price-min' className='text-sm font-medium block mb-2'>
                    Precio mínimo
                  </Label>
                  <Input
                    id='price-min'
                    type='number'
                    placeholder='0'
                    value={priceMin}
                    onChange={e => onPriceMinChange(Number(e.target.value))}
                    className='mobile-input touch-target'
                    min='0'
                    max={priceMax}
                  />
                </div>
                <div>
                  <Label htmlFor='price-max' className='text-sm font-medium block mb-2'>
                    Precio máximo
                  </Label>
                  <Input
                    id='price-max'
                    type='number'
                    placeholder={priceMaxAuto.toString()}
                    value={priceMax}
                    onChange={e => onPriceMaxChange(Number(e.target.value))}
                    className='mobile-input touch-target'
                    min={priceMin}
                    max={priceMaxAuto}
                  />
                </div>
              </div>
            </fieldset>

            {/* Clear Filters Button - optimizado para móviles */}
            <Button
              onClick={onClearFilters}
              variant='outline'
              className='
                w-full touch-target-lg
                text-base md:text-sm
                py-3 md:py-2
                font-medium
                transition-all duration-200
                hover:bg-gray-50
                active:scale-95
              '
            >
              <Icon
                category='Estados y Feedback'
                name='IconoirRefresh'
                className='w-5 h-5 md:w-4 md:h-4 mr-2'
                aria-hidden='true'
              />
              Limpiar Filtros
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
);

ProductFilters.displayName = 'ProductFilters';

export default ProductFilters;
