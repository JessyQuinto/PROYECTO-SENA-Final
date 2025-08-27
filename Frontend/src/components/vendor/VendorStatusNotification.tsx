import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

interface VendorStatusNotificationProps {
  onClose?: () => void;
}

export const VendorStatusNotification: React.FC<VendorStatusNotificationProps> = ({ onClose }) => {
  const [showApproved, setShowApproved] = useState(false);
  const [showRejected, setShowRejected] = useState(false);

  useEffect(() => {
    // Escuchar notificaciones de cambio de estado
    const handleApproved = () => {
      setShowApproved(true);
      // Auto-ocultar después de 5 segundos
      setTimeout(() => setShowApproved(false), 5000);
    };

    const handleRejected = () => {
      setShowRejected(true);
      // Auto-ocultar después de 5 segundos
      setTimeout(() => setShowRejected(false), 5000);
    };

    window.addEventListener('showVendorApprovedNotification', handleApproved);
    window.addEventListener('showVendorRejectedNotification', handleRejected);

    return () => {
      window.removeEventListener('showVendorApprovedNotification', handleApproved);
      window.removeEventListener('showVendorRejectedNotification', handleRejected);
    };
  }, []);

  if (!showApproved && !showRejected) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Notificación de Aprobación */}
      {showApproved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm animate-in slide-in-from-right duration-300">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon
                category="Estados y Feedback"
                name="TypcnTick"
                className="w-4 h-4 text-green-600"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-green-800 font-medium text-sm">¡Cuenta Aprobada!</h3>
              <p className="text-green-700 text-xs mt-1">
                Tu cuenta de vendedor ha sido aprobada. Ya puedes crear y gestionar productos.
              </p>
            </div>
            <button
              onClick={() => setShowApproved(false)}
              className="text-green-400 hover:text-green-600 transition-colors"
            >
              <Icon
                category="Estados y Feedback"
                name="IconoirCancel"
                className="w-4 h-4"
              />
            </button>
          </div>
        </div>
      )}

      {/* Notificación de Rechazo */}
      {showRejected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm animate-in slide-in-from-right duration-300">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon
                category="Estados y Feedback"
                name="IconoirWarningSquare"
                className="w-4 h-4 text-red-600"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-red-800 font-medium text-sm">Cuenta Rechazada</h3>
              <p className="text-red-700 text-xs mt-1">
                Tu solicitud de vendedor ha sido rechazada. Contacta al administrador para más información.
              </p>
            </div>
            <button
              onClick={() => setShowRejected(false)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <Icon
                category="Estados y Feedback"
                name="IconoirCancel"
                className="w-4 h-4"
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorStatusNotification;
