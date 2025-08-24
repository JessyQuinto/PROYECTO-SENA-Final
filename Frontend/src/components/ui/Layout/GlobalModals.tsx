import React from 'react';
import CookieConsent from '@/components/ui/CookieConsent';

interface GlobalModalsProps {
  className?: string;
}

/**
 * GlobalModals component handles all global modal dialogs and overlays
 * that need to be rendered at the application level
 */
const GlobalModals: React.FC<GlobalModalsProps> = ({ className = '' }) => {
  return (
    <div className={`fixed inset-0 pointer-events-none z-[9999] ${className}`}>
      {/* Cookie Consent Modal */}
      <CookieConsent />
      
      {/* Future global modals can be added here:
          - Global error dialogs
          - Network status indicators  
          - Update notifications
          - Authentication modals
      */}
    </div>
  );
};

export default GlobalModals;