import React from 'react';
import { useAuth } from '@/auth/AuthContext';
import VendorLayout from '@/modules/vendor/VendorLayout';

const VendorWelcome: React.FC = () => {
  const { user } = useAuth();

  return (
    <VendorLayout
      title="Bienvenido"
      subtitle="Panel de vendedor - Tesoros Chocó"
    >
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Hola, {user?.email}!
          </h2>
          <p className="text-gray-600">
            Bienvenido a tu panel de vendedor
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">
            Estado de tu cuenta: {user?.vendedor_estado || 'pendiente'}
          </h3>
          {user?.vendedor_estado === 'aprobado' && (
            <p className="text-blue-700 text-sm">
              ✓ Tu cuenta está activa y puedes vender productos
            </p>
          )}
          {user?.vendedor_estado === 'pendiente' && (
            <p className="text-blue-700 text-sm">
              ⏳ Tu cuenta está siendo revisada por nuestro equipo
            </p>
          )}
          {user?.vendedor_estado === 'rechazado' && (
            <p className="text-red-700 text-sm">
              ❌ Tu cuenta fue rechazada. Contacta soporte para más información
            </p>
          )}
        </div>

        {user?.vendedor_estado === 'aprobado' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium mb-2">Productos</h4>
              <p className="text-sm text-gray-600">Gestiona tu inventario</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium mb-2">Pedidos</h4>
              <p className="text-sm text-gray-600">Revisa tus ventas</p>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
};

export default VendorWelcome;