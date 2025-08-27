import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import Icon from '@/components/ui/Icon';

export const VendorStatusBanner: React.FC = () => {
  const { isVendor, isVendorApproved, isVendorPending, isVendorRejected } = usePermissions();

  if (!isVendor) return null;

  if (isVendorApproved) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Icon
              category="Estados y Feedback"
              name="TypcnTick"
              className="w-5 h-5 text-green-600"
            />
          </div>
          <div>
            <h3 className="text-green-800 font-medium">Cuenta aprobada</h3>
            <p className="text-green-700 text-sm">
              Tu cuenta de vendedor está activa. Puedes crear y gestionar productos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isVendorPending) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <Icon
              category="Estados y Feedback"
              name="TypcnInfoLarge"
              className="w-5 h-5 text-amber-600"
            />
          </div>
          <div>
            <h3 className="text-amber-800 font-medium">Cuenta en revisión</h3>
            <p className="text-amber-700 text-sm">
              Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos por correo cuando sea aprobada.
            </p>
            <div className="mt-2 text-xs text-amber-600">
              Tiempo estimado: 1-3 días hábiles
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isVendorRejected) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <Icon
              category="Estados y Feedback"
              name="TypcnInfoLarge"
              className="w-5 h-5 text-red-600"
            />
          </div>
          <div>
            <h3 className="text-red-800 font-medium">Cuenta rechazada</h3>
            <p className="text-red-700 text-sm">
              Tu solicitud no fue aprobada. Si consideras que se trata de un error, contáctanos.
            </p>
            <div className="mt-2">
              <button className="text-xs text-red-600 hover:text-red-800 underline">
                Contactar soporte
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VendorStatusBanner;

