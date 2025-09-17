import React from 'react';
import Icon from '@/components/ui/Icon';
import type { ActiveTab } from './types';

interface Props {
  active: ActiveTab;
  onChange: (tab: ActiveTab) => void;
}

export const VendorTabs: React.FC<Props> = ({ active, onChange }) => {
  return (
    <div className='mb-8'>
      <div className='border-b border-gray-200'>
        <nav className='-mb-px flex space-x-8'>
          {([
            { key: 'products', label: 'Mis Productos', icon: ['Catálogo y producto', 'BxsPackage'] },
            { key: 'orders', label: 'Pedidos', icon: ['Pedidos', 'MaterialSymbolsOrdersOutlineRounded'] },
            { key: 'add-product', label: 'Agregar Producto', icon: ['Vendedor', 'LucideCircleFadingPlus'] },
            { key: 'config', label: 'Configuración', icon: ['Usuario', 'RivetIconsSettings'] },
          ] as Array<{ key: ActiveTab; label: string; icon: [string, string] }>).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                active === key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon category={icon[0]} name={icon[1]} className='w-4 h-4' />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default VendorTabs;
