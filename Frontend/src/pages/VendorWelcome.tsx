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
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            ¡Hola, {user?.email}!
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Bienvenido a tu panel de vendedor
          </p>
        </div>

        {/* Estado de cuenta */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">
            Estado de tu cuenta:{" "}
            <span className="capitalize">
              {user?.vendedor_estado || "pendiente"}
            </span>
          </h3>
          {user?.vendedor_estado === "aprobado" && (
            <p className="text-blue-700 text-sm flex items-center gap-1">
              <span>✓</span> Tu cuenta está activa y puedes vender productos
            </p>
          )}
          {user?.vendedor_estado === "pendiente" && (
            <p className="text-blue-700 text-sm flex items-center gap-1">
              <span>⏳</span> Tu cuenta está siendo revisada por nuestro equipo
            </p>
          )}
          {user?.vendedor_estado === "rechazado" && (
            <p className="text-red-700 text-sm flex items-center gap-1">
              <span>❌</span> Tu cuenta fue rechazada. Contacta soporte para más
              información
            </p>
          )}
        </div>

        {/* Acciones disponibles si está aprobado */}
        {user?.vendedor_estado === "aprobado" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-white border rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition">
              <h4 className="font-medium mb-1 text-gray-900">Productos</h4>
              <p className="text-sm text-gray-600">Gestiona tu inventario</p>
            </div>
            <div className="bg-white border rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition">
              <h4 className="font-medium mb-1 text-gray-900">Pedidos</h4>
              <p className="text-sm text-gray-600">Revisa tus ventas</p>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
};

export default VendorWelcome;
