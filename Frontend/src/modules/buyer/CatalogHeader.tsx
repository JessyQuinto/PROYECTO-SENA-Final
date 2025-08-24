import React from 'react';
import { Input } from '@/components/ui/shadcn/input';
import Icon from '@/components/ui/Icon';

interface CatalogHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'name';
  onSortChange: (value: 'newest' | 'price_asc' | 'price_desc' | 'name') => void;
  showFiltersMobile: boolean;
  onToggleFiltersMobile: () => void;
  twoColsMobile: boolean;
  onToggleTwoColsMobile: () => void;
  className?: string;
}

const CatalogHeader: React.FC<CatalogHeaderProps> = React.memo(({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  showFiltersMobile,
  onToggleFiltersMobile,
  twoColsMobile,
  onToggleTwoColsMobile,
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {/* Subtle decorative bar */}
      <div
        className='rounded-xl h-14 mb-4 overflow-hidden'
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.25), rgba(0,0,0,0.05)), url('/assert/1/v1045-03.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Main header controls */}
      <div className='flex flex-col md:flex-row gap-4 items-start md:items-center justify-between'>
        <div className='flex-1 w-full md:w-auto'>
          <div className='relative'>
            <Icon
              category='Catálogo y producto'
              name='LineMdSearch'
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4'
            />
            <Input
              type='text'
              placeholder='Buscar productos...'
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className='pl-10 bg-card search-input'
            />
          </div>
        </div>
        
        {/* Sort dropdown */}
        <div className='flex items-center gap-2'>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className='form-select'
          >
            <option value='newest'>Más recientes</option>
            <option value='price_asc'>Precio: menor a mayor</option>
            <option value='price_desc'>Precio: mayor a menor</option>
            <option value='name'>Nombre A-Z</option>
          </select>
        </div>
      </div>

      {/* Mobile controls */}
      <div className='sm:hidden mt-3 flex items-center gap-2'>
        <button
          type='button'
          className='btn btn-outline btn-sm flex items-center gap-2'
          onClick={onToggleFiltersMobile}
          aria-label={showFiltersMobile ? 'Ocultar filtros' : 'Mostrar filtros'}
          title={showFiltersMobile ? 'Ocultar filtros' : 'Mostrar filtros'}
        >
          <Icon
            category='Catálogo y producto'
            name='IonFilter'
            className='w-4 h-4'
          />
          {showFiltersMobile ? 'Ocultar filtros' : 'Mostrar filtros'}
        </button>
        
        <button
          type='button'
          className='btn btn-outline btn-sm flex items-center gap-2'
          onClick={onToggleTwoColsMobile}
          aria-label={
            twoColsMobile
              ? 'Cambiar a vista 1 columna'
              : 'Cambiar a vista 2 columnas'
          }
          title={
            twoColsMobile
              ? 'Cambiar a vista 1 columna'
              : 'Cambiar a vista 2 columnas'
          }
        >
          <Icon
            category='Navegación principal'
            name='MdiGrid'
            className='w-4 h-4'
          />
          {twoColsMobile ? 'Vista 1x' : 'Vista 2x'}
        </button>
      </div>
    </div>
  );
});

CatalogHeader.displayName = 'CatalogHeader';

export default CatalogHeader;