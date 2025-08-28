import React from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileTabBar from './MobileTabBar';
import GlobalModals from './GlobalModals';
import CookieConsent from '@/components/ui/CookieConsent';
import { useAuth } from '@/auth/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className = '',
}) => {
  const { isSigningOut } = useAuth();

  return (
    <div className='min-h-screen-mobile bg-background text-foreground relative mobile-tap-highlight mobile-text-size-adjust'>
      {/* Loading overlay durante cierre de sesión */}
      {isSigningOut && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'
          aria-live='polite'
          aria-busy='true'
        >
          <div className='flex items-center gap-3 text-muted-foreground bg-card p-4 rounded-lg shadow-lg'>
            <div className='h-5 w-5 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin' />
            <span className='text-sm font-medium'>Cerrando sesión…</span>
          </div>
        </div>
      )}
      
      {/* Header optimizado para móviles */}
      <Header />
      
      {/* Contenido principal con espaciado optimizado */}
      <main 
        className={`
          ${className} 
          pb-24 md:pb-0 
          pt-safe-top 
          mobile-container
          mobile-scroll
          min-h-screen-safe
        `}
      >
        {children}
      </main>
      
      {/* Footer solo visible en desktop */}
      <Footer />
      
      {/* Tab bar móvil optimizado */}
      <MobileTabBar />
      
      {/* Modales y componentes globales */}
      <GlobalModals />
      <CookieConsent />
    </div>
  );
};

export default MainLayout;
