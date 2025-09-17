import React from 'react';
import { useAuth } from '@/auth/AuthContext';
import VendorLayout from '@/modules/vendor/VendorLayout';

const VendorStatus: React.FC = () => {
  const { user } = useAuth();

  return (
    <VendorLayout
      title="Estado de la Cuenta"
      subtitle="Información sobre tu cuenta de vendedor"
    >
      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Información de la Cuenta</h3>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-600">Email:</span>
              <p className="font-medium">{user?.email}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">Estado:</span>
              <p className="font-medium capitalize">{user?.vendedor_estado || 'pendiente'}</p>
            </div>
            
            <div className="border-t pt-4">
              {user?.vendedor_estado === 'aprobado' && (
                <div className="text-green-600">
                  ✓ Tu cuenta está aprobada y activa
                </div>
              )}
              
              {user?.vendedor_estado === 'pendiente' && (
                <div className="text-yellow-600">
                  ⏳ Tu cuenta está siendo revisada
                </div>
              )}
              
              {user?.vendedor_estado === 'rechazado' && (
                <div className="text-red-600">
                  ❌ Tu cuenta fue rechazada
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
};

export default VendorStatus;