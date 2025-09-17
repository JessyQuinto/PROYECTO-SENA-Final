import React from 'react';
import Icon from '@/components/ui/Icon';
import type { VendorStats } from './types';

export const VendorStatsCards: React.FC<{ stats: VendorStats; rating?: { promedio: number; total: number } | null }> = ({ stats, rating }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="card card-hover">
        <div className="card-body">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icon category="Catálogo y producto" name="MdiPackageVariant" className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Productos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.productosActivos}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="card card-hover">
        <div className="card-body">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon category="Pedidos" name="MaterialSymbolsOrdersOutlineRounded" className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pedidos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPedidos}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="card card-hover">
        <div className="card-body">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icon category="Carrito y checkout" name="VaadinWallet" className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Ventas</p>
              <p className="text-2xl font-semibold text-gray-900">${'{'}stats.ventasDelMes.toLocaleString(){'}'}</p>
            </div>
          </div>
        </div>
      </div>
      {rating && (
        <div className="card card-hover">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Icon category="Catálogo y producto" name="MdiStar" className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Calificación</p>
                <p className="text-2xl font-semibold text-gray-900">{rating.promedio.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorStatsCards;
